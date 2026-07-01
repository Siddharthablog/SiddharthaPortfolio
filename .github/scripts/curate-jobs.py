#!/usr/bin/env python3
"""  # noqa: E501
Job Radar — Autonomous Job Curation Engine
==========================================
Fetches Senior Technical Writer jobs in Bangalore (10+ years) using a
hybrid strategy:
  • Naukri queries  → experience, skills, company name
  • LinkedIn queries → direct /jobs/view/ apply URLs
  • Merge by fuzzy company name match
  • Groq summarises each merged job into one punchy sentence

Environment variables:
  TAVILY_API_KEY  — https://tavily.com
  GROQ_API_KEY    — https://groq.com

Usage:
  python .github/scripts/curate-jobs.py
  python .github/scripts/curate-jobs.py --output ./custom/path/jobs.json
"""

from __future__ import annotations
from typing import Optional
import json
import hashlib
import os
import sys
import re
import time
import argparse
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MAX_JOBS        = 15         # increased cap for broader title coverage
GROQ_MODEL      = "openai/gpt-oss-120b"   # reliable JSON + text output

# ---------------------------------------------------------------------------
# All equivalent job titles for technical writing roles
# ---------------------------------------------------------------------------
JOB_TITLE_VARIANTS = [
    "Technical Writer",
    "Senior Technical Writer",
    "Principal Technical Writer",
    "Staff Technical Writer",
    "Technical Writer II",
    "Technical Writer III",
    "Tech Content Writer",
    "Technical Content Writer",
    "Senior Content Writer",
    "Information Developer",
    "Senior Information Developer",
    "Documentation Engineer",
    "Documentation Specialist",
    "API Documentation Writer",
    "Technical Documentation Specialist",
    "Knowledge Management Specialist",
    "UX Writer",
]

# Naukri queries — dynamically generated, broadened to 5+ years
NAUKRI_QUERIES = [
    "Senior Technical Writer Bangalore 5+ years experience site:naukri.com",
    "Senior Technical Writer Bengaluru DITA API documentation site:naukri.com",
    "Principal Technical Writer Bangalore site:naukri.com",
    "Technical Content Writer Bangalore site:naukri.com",
    "Information Developer Bangalore site:naukri.com",
    "Documentation Specialist Bangalore site:naukri.com",
    "Documentation Engineer Bengaluru site:naukri.com",
    "Technical Writer Bangalore 5 years site:naukri.com",
    "UX Writer Bangalore site:naukri.com",
]

# LinkedIn queries — OR-grouped for maximum coverage per API call
LINKEDIN_QUERIES = [
    'site:in.linkedin.com/jobs/view ("Senior Technical Writer" OR "Technical Writer") Bangalore',
    'site:in.linkedin.com/jobs/view ("Senior Technical Writer" OR "Technical Writer") Bengaluru',
    'site:in.linkedin.com/jobs/view ("Tech Content Writer" OR "Technical Content Writer" OR "Senior Content Writer") Bangalore',
    'site:in.linkedin.com/jobs/view ("Information Developer" OR "Senior Information Developer") Bangalore',
    'site:in.linkedin.com/jobs/view ("Documentation Engineer" OR "Documentation Specialist") Bangalore',
    'site:in.linkedin.com/jobs/view ("Technical Writer II" OR "Technical Writer III" OR "Staff Technical Writer") Bangalore',
    'site:in.linkedin.com/jobs/view ("API Documentation" OR "Technical Documentation Specialist") Bangalore',
    'site:in.linkedin.com/jobs/view ("Principal Technical Writer" OR "Knowledge Management") Bangalore',
    'site:in.linkedin.com/jobs/view "UX Writer" Bangalore OR Bengaluru',
    'site:in.linkedin.com/jobs/view ("Technical Writer" OR "Documentation") Bengaluru "days ago"',
    'site:in.linkedin.com/jobs/view ("Technical Writer" OR "Content Writer") Bangalore DITA OR "API documentation" OR "docs-as-code"',
]

# Signals that indicate a job is no longer accepting applications
CLOSED_SIGNALS = [
    # LinkedIn signals
    "no longer accepting",
    "no longer accepting applications",
    "no longer available",
    "this job is no longer available",
    "applications are closed",
    "application is closed",
    "this position has been filled",
    "position has been filled",
    "position is no longer",
    "this job has been filled",
    "job has been filled",
    "role has been filled",
    # Generic / Naukri signals
    "job has expired",
    "job is closed",
    "posting has expired",
    "this job has expired",
    "this posting has expired",
    "listing has expired",
    "vacancy closed",
    "vacancy has been closed",
    "opening has been closed",
    "recruitment closed",
    "hiring complete",
    "position closed",
    "job expired",
    "applications closed",
]

# Positive signals that a job page is live and still accepting applications
# Used as a secondary check: if extract returns content but has NEITHER
# closed signals NOR active signals, the page is likely stale/blocked.
ACTIVE_SIGNALS = [
    "apply",
    "easy apply",
    "apply now",
    "apply on company website",
    "submit application",
    "apply for this job",
    "apply for this position",
    "accepting applications",
    "actively recruiting",
    "be an early applicant",
    "applicants",
    "posted",
    "days ago",
    "ago)",
    "just posted",
    "reposted",
]

# Staleness signals in snippets — posting is too old to be valid
# If a search snippet contains these, the cached result is stale
STALE_SIGNALS = [
    "2 weeks ago",
    "3 weeks ago",
    "4 weeks ago",
    "weeks ago",
    "1 month ago",
    "2 months ago",
    "3 months ago",
    "months ago",
    "30+ days ago",
    "over a month ago",
    "30 days ago",
]

SUMMARY_PROMPT = """You are a job board curator for senior technical writers.
Write exactly ONE sentence (max 20 words) summarising this job opportunity.
Be specific: mention the company, domain or product area, and one key skill if available.
No filler. No "This role...". Start directly with the company name or role context."""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def url_hash(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:8]


def extract_experience_from_text(text: str) -> Optional[str]:
    """Helper to extract experience range or minimum years using regex."""
    if not text:
        return None
    
    # Strip HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Normalize whitespaces
    text = " ".join(text.split())
    
    patterns = [
        r"\b(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?)(?:\s*of)?\s*experience\b",
        r"\b(\d+)\+?\s*(?:years?|yrs?)(?:\s*of)?\s*experience\b",
        r"\b(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?)\b",
        r"\b(\d+)\+?\s*(?:years?|yrs?)\b",
        r"\b(\d+)\s*(?:years?|yrs?)\+\b"
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            groups = match.groups()
            if len(groups) >= 2 and groups[0] and groups[1]:
                d1, d2 = int(groups[0]), int(groups[1])
                if 1 <= d1 <= 25 and 1 <= d2 <= 25:
                    return f"{d1}-{d2} Yrs"
            elif groups[0]:
                digit = int(groups[0])
                if 1 <= digit <= 25:
                    val = match.group(0).lower()
                    if "+" in val or "more" in val or "above" in val:
                        return f"{digit}+ Yrs"
                    # Look slightly backward to see if there is an "at least" or "minimum"
                    context = text[max(0, match.start()-15):match.start()].lower()
                    if "at least" in context or "minimum" in context or "min" in context:
                        return f"{digit}+ Yrs"
                    return f"{digit} Yrs"
    return None


def infer_experience_from_title(title: str) -> Optional[str]:
    """Helper to infer general experience level from title keywords."""
    if not title:
        return None
    title_lower = title.lower()
    if "principal" in title_lower or "lead" in title_lower or "manager" in title_lower:
        return "Lead / Principal"
    if "senior" in title_lower or "sr." in title_lower:
        return "Senior Level"
    if "specialist" in title_lower or "staff" in title_lower:
        return "Mid-Senior Level"
    if "associate" in title_lower or "junior" in title_lower or "jr." in title_lower:
        return "Entry Level"
    return None


def _normalize_location(loc: str) -> str:
    """Normalize location strings to a clean display format."""
    if not loc:
        return "Bangalore"
    loc = loc.strip()
    low = loc.lower()
    if low in ("null", "none", "unknown", "not specified"):
        return "Bangalore"
    # Map common Bangalore / Bengaluru variants
    bangalore_aliases = ["bengaluru", "bangalore", "bengaluru, karnataka, india",
                         "bangalore, karnataka, india", "bengaluru, india",
                         "bangalore, india", "bengaluru, karnataka",
                         "bangalore, karnataka"]
    if low in bangalore_aliases:
        return "Bangalore"
    # Keep non-Bangalore locations as-is but clean up trailing ", India"
    if loc.endswith(", India"):
        loc = loc[:-7]
    return loc

def fuzzy_match(a: str, b: str) -> bool:
    """True if two company name strings share significant overlap."""
    if not a or not b:
        return False
    a_words = set(re.sub(r"[^a-z0-9\s]", "", a.lower()).split())
    b_words = set(re.sub(r"[^a-z0-9\s]", "", b.lower()).split())
    # remove noise words
    noise = {"pvt","ltd","inc","llc","technologies","technology","consulting",
             "solutions","india","global","services","the","and","of"}
    a_words -= noise
    b_words -= noise
    if not a_words or not b_words:
        return False
    overlap = a_words & b_words
    
    if not overlap:
        return False
        
    # If the only overlap is a very common word, require stricter matching
    common_words = {"tech", "group", "systems", "private", "limited", "corp"}
    if overlap.issubset(common_words):
        return False

    ratio = len(overlap) / min(len(a_words), len(b_words))
    return ratio > 0.5 or (len(overlap) == len(a_words) and len(a_words) == 1)


def load_existing(path: Path) -> list[dict]:
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []


def save_jobs(path: Path, jobs: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)
    print(f"✅  Saved {len(jobs)} jobs to {path}")


def validate_linkedin_direct(url: str) -> tuple[bool, str, Optional[str]]:
    """Directly fetch a LinkedIn job page via HTTP to check if it's still open.

    LinkedIn renders 'No longer accepting applications' in server-side HTML
    for SEO purposes, so a direct HTTP GET can detect it even when Tavily
    extract returns cached/stale content. We also parse the job age to drop
    postings that are older than 1 week (e.g. 2 weeks ago, 3 weeks ago, etc.)
    since they are stale/expired.

    Returns (is_open, reason, experience).
    """
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0.0.0 Safari/537.36"
            ),
            "Accept": (
                "text/html,application/xhtml+xml,"
                "application/xml;q=0.9,*/*;q=0.8"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "identity",
            "Connection": "close",
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore").lower()

            # Check for closed signals in the raw HTML
            for signal in CLOSED_SIGNALS:
                if signal in html:
                    return False, f"closed: '{signal}'", None

            # Extract experience from HTML description
            exp = extract_experience_from_text(html)

            # Check the main job's post age to avoid stale/closed postings
            single_line = " ".join(html.split())
            time_match = re.search(r'class="posted-time-ago__text[^"]*"[^>]*>\s*([^<]+)', single_line)
            if time_match:
                time_text = time_match.group(1).strip().lower()
                stale_keywords = ["2 weeks", "3 weeks", "4 weeks", "weeks ago", "month", "year", "30+"]
                if any(kw in time_text for kw in stale_keywords):
                    return False, f"stale: posted {time_text}", None
                
                # If it's a valid job page and has fresh posted time, it's open
                return True, f"fresh: posted {time_text}", exp

            # Content exists but no clear posted time — let extract double check
            return False, "no posted time found in page HTML", None

    except urllib.error.HTTPError as e:
        # LinkedIn returns 999 for bot detection, 429 for rate limits
        return False, f"HTTP {e.code}", None
    except Exception as e:
        return False, f"fetch error: {e}", None


# ---------------------------------------------------------------------------
# Tavily Search
# ---------------------------------------------------------------------------

def search_tavily(query: str, api_key: str, max_results: int = 3, days: int = None) -> list[dict]:
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=api_key)
        params = dict(
            query=query,
            max_results=max_results,
            search_depth="advanced",
            include_answer=False,
        )
        if days:
            params["days"] = days   # only return pages indexed in last N days
        response = client.search(**params)
        return response.get("results", [])
    except Exception as e:
        print(f"⚠️  Tavily search failed for '{query[:50]}': {e}")
        return []


# ---------------------------------------------------------------------------
# Groq Extraction & Summarisation
# ---------------------------------------------------------------------------

def extract_naukri_job(title: str, content: str, url: str, groq_client) -> list[dict]:
    """Extract one or more job records from a Naukri snippet."""
    try:
        resp = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": """Extract all individual job listings from this Naukri search result.
Return a JSON object with key "jobs" containing an array. Each item:
  {"title": "...", "company": "...", "location": "city name or null", "experience": "e.g. 5-10 Yrs or null", "skills": ["skill1","skill2","skill3"]}
If no clear job listings, return {"jobs": []}. Skills max 4. Return ONLY valid JSON."""},
                {"role": "user", "content": f"URL: {url}\nTitle: {title}\nContent: {content[:800]}"},
            ],
            temperature=0.1,
            max_tokens=500,
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content)
        return data.get("jobs", []) if isinstance(data, dict) else []
    except Exception as e:
        print(f"   ⚠️  Extraction failed: {e}")
        return []


def extract_linkedin_job(title: str, content: str, url: str, groq_client) -> Optional[dict]:
    """Extract company name and job details from a LinkedIn /jobs/view/ page."""
    try:
        resp = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": """Extract job details from this LinkedIn job page.
Return JSON: {"title": "...", "company": "...", "location": "...", "experience": "e.g. 5+ Yrs, 8+ Yrs, or null"}
If the text mentions experience requirements (like 5 years, 8+ years), extract it. If the title is "Senior" or "Principal" and no specific years are mentioned, you can infer "Senior Level (5+ Yrs)" or "Principal (10+ Yrs)" respectively.
Return ONLY valid JSON."""},
                {"role": "user", "content": f"URL: {url}\nTitle: {title}\nContent: {content[:600]}"},
            ],
            temperature=0.1,
            max_tokens=150,
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content)
        if isinstance(data, dict) and data.get("company"):
            return data
        return None
    except Exception as e:
        print(f"   ⚠️  LinkedIn extraction failed: {e}")
        return None


def summarise_job(title: str, company: str, skills: list, experience: str, groq_client) -> str:
    """Generate a one-sentence job summary."""
    try:
        skills_str = ", ".join(skills[:3]) if skills else "technical writing"
        resp = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SUMMARY_PROMPT},
                {"role": "user", "content": f"Role: {title} at {company}. Experience: {experience or 'not specified'}. Skills: {skills_str}."},
            ],
            temperature=0.4,
            max_tokens=60,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"   ⚠️  Summary failed: {e}")
        return f"{title} role at {company} in Bangalore."


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------

def run_pipeline(output_path: Path) -> None:

    tavily_key = os.environ.get("TAVILY_API_KEY", "").strip()
    groq_key   = os.environ.get("GROQ_API_KEY", "").strip()

    if not tavily_key:
        print("❌  TAVILY_API_KEY not set. Exiting.")
        sys.exit(1)
    if not groq_key:
        print("❌  GROQ_API_KEY not set. Exiting.")
        sys.exit(1)

    from groq import Groq
    groq_client = Groq(api_key=groq_key)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = load_existing(output_path)
    seen_ids = {item["id"] for item in existing}

    # ── Step 1: Naukri — collect experience + skills ───────────────────────
    print("\n📋  Step 1: Scraping Naukri for experience & skills...")
    naukri_jobs: list[dict] = []   # {"title","company","experience","skills","naukri_url"}
    naukri_seen_companies: set[str] = set()

    for query in NAUKRI_QUERIES:
        print(f"   🔍  {query[:60]}...")
        results = search_tavily(query, tavily_key, max_results=3, days=7)
        for r in results:
            url     = r.get("url", "")
            title   = r.get("title", "")
            content = r.get("content", "")

            # ── Skip closed/expired jobs at snippet level ─────────────
            content_lower = content.lower()
            if any(signal in content_lower for signal in CLOSED_SIGNALS):
                print(f"      ⏭  Skipping closed Naukri job: {title[:55]}")
                continue

            extracted = extract_naukri_job(title, content, url, groq_client)
            for job in extracted:
                company = (job.get("company") or "").strip()
                # skip null, empty, or generic placeholder company names
                if (not company
                        or company.lower() in naukri_seen_companies
                        or company.lower() in ("null","n/a","not specified","unknown","company")):
                    continue
                # normalise generic job titles
                job_title = (job.get("title") or "").strip()
                if not job_title or job_title.lower() in ("writer","author","specialist","null"):
                    job_title = "Senior Technical Writer"
                naukri_seen_companies.add(company.lower())
                naukri_jobs.append({
                    "title":      job_title,
                    "company":    company,
                    "location":   job.get("location"),
                    "experience": job.get("experience"),
                    "skills":     job.get("skills", [])[:4],
                    "naukri_url": url,
                })
                print(f"      ✓ {company} | {job.get('experience','?')}")

    print(f"\n   → {len(naukri_jobs)} unique companies from Naukri")

    # ── Step 2: LinkedIn — collect direct apply URLs ───────────────────────
    print("\n🔗  Step 2: Scraping LinkedIn for direct job post URLs...")
    linkedin_jobs: list[dict] = []  # {"company","title","apply_url"}
    linkedin_seen_urls: set[str] = set()

    for query in LINKEDIN_QUERIES:
        print(f"   🔍  {query[:60]}...")
        results = search_tavily(query, tavily_key, max_results=5, days=7)
        for r in results:
            url     = r.get("url", "")
            title   = r.get("title", "")
            content = r.get("content", "")

            # Only keep individual job posts
            if "/jobs/view/" not in url:
                continue
            if url in linkedin_seen_urls:
                continue

            # ── Skip closed/expired jobs ──────────────────────────────────
            content_lower = content.lower()
            if any(signal in content_lower for signal in CLOSED_SIGNALS):
                print(f"      ⏭  Skipping closed job: {title[:55]}")
                continue

            # ── Skip stale postings ("1 month ago", etc.) ────────────────
            if any(signal in content_lower for signal in STALE_SIGNALS):
                print(f"      ⏭  Skipping stale job: {title[:55]}")
                continue

            linkedin_seen_urls.add(url)

            info = extract_linkedin_job(title, content, url, groq_client)
            if info and info.get("company"):
                linkedin_jobs.append({
                    "company":    info["company"].strip(),
                    "title":      info.get("title", title),
                    "location":   info.get("location"),
                    "experience": info.get("experience"),
                    "apply_url":  url,
                })
                print(f"      ✓ {info['company']} → {url.split('/')[-1][:50]}")

    print(f"\n   → {len(linkedin_jobs)} individual LinkedIn posts")

    print("\n🔀  Step 3: Merging Naukri + LinkedIn by company name...")
    merged: list[dict] = []
    seen_in_run = set()

    for nj in naukri_jobs:
        # find a matching LinkedIn post
        apply_url  = None
        li_matched = None
        for lj in linkedin_jobs:
            if fuzzy_match(nj["company"], lj["company"]):
                apply_url  = lj["apply_url"]
                li_matched = lj
                break

        # Ensure a unique ID by combining company name and URL
        # (Naukri jobs can share the same query/landing page URL)
        uid = url_hash(f"{nj['company'].lower()}:{apply_url or nj['naukri_url']}")
        if uid in seen_in_run:
            continue
        seen_in_run.add(uid)

        # Generate summary
        summary = summarise_job(
            nj["title"], nj["company"], nj["skills"], nj["experience"] or (li_matched.get("experience") if li_matched else None), groq_client
        )

        source = "LinkedIn + Naukri" if apply_url else "Naukri"
        merged.append({
            "id":         uid,
            "job_title":  nj["title"],
            "company":    nj["company"],
            "location":   _normalize_location(nj.get("location") or "Bangalore"),
            "experience": nj["experience"] or (li_matched.get("experience") if li_matched else None),
            "skills":     nj["skills"],
            "summary":    summary,
            "apply_url":  apply_url or nj["naukri_url"],
            "naukri_url": nj["naukri_url"],
            "source":     source,
            "date":       today,
        })
        match_str = f"→ matched LinkedIn: {li_matched['company']}" if li_matched else "→ Naukri only"
        print(f"   ✓ {nj['company']} {match_str}")

    # Also add unmatched LinkedIn-only posts — only keep clear TW roles
    TW_KEYWORDS = {"technical writer", "technical writing", "documentation",
                   "information developer", "publications", "tech writer", "doc",
                   "content writer", "tech content", "documentation engineer",
                   "documentation specialist", "knowledge management",
                   "api documentation", "ux writer", "content designer"}
    matched_companies = {m["company"].lower() for m in merged}
    for lj in linkedin_jobs:
        if fuzzy_match_any(lj["company"], matched_companies):
            continue
        # drop non-TW roles (SRM, intern, marketing admin, etc.)
        title_lower = lj["title"].lower()
        if not any(kw in title_lower for kw in TW_KEYWORDS):
            print(f"   ✗ Skipping non-TW: {lj['title']} @ {lj['company']}")
            continue
        # Ensure a unique ID by combining company name and URL
        uid = url_hash(f"{lj['company'].lower()}:{lj['apply_url']}")
        if uid in seen_in_run:
            continue
        seen_in_run.add(uid)
        summary = summarise_job(lj["title"], lj["company"], [], None, groq_client)
        merged.append({
            "id":         uid,
            "job_title":  lj["title"],
            "company":    lj["company"],
            "location":   _normalize_location(lj.get("location") or "Bangalore"),
            "experience": lj.get("experience"),
            "skills":     [],
            "summary":    summary,
            "apply_url":  lj["apply_url"],
            "naukri_url": None,
            "source":     "LinkedIn",
            "date":       today,
        })
        print(f"   ✓ {lj['company']} → LinkedIn only")

    # ── Step 4: Live-validate job URLs ─────────────────────────────────────
    # Tavily search() AND extract() both return cached content for LinkedIn.
    # LinkedIn blocks Tavily's crawlers, so extract() never sees the real page.
    # Fix: direct HTTP fetch for LinkedIn URLs (renders status server-side for
    # SEO), with Tavily extract as fallback for non-LinkedIn URLs.
    # We combine newly merged jobs and existing jobs, then validate ALL of them.
    # This prevents old, closed jobs from persisting in our json output.
    print("\n🔎  Step 4: Live-validating job URLs (direct HTTP + Tavily extract)...")
    from tavily import TavilyClient as _TC
    _tv = _TC(api_key=tavily_key)

    candidates: list[dict] = []
    seen_candidate_ids = set()
    for job in merged + existing:
        if job["id"] not in seen_candidate_ids:
            seen_candidate_ids.add(job["id"])
            candidates.append(job)

    print(f"   📋  Validating {len(candidates)} total jobs (new + existing)...")

    validated: list[dict] = []
    now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    for job in candidates:
        url = job.get("apply_url", "")
        is_linkedin = "linkedin.com/jobs/view/" in url
        verified = False

        # ── Layer A: Direct HTTP check for LinkedIn (real-time) ───────────
        if is_linkedin:
            time.sleep(1.5)   # rate-limit to avoid LinkedIn 429/999
            is_open, reason, exp = validate_linkedin_direct(url)

            if not is_open and ("closed" in reason or "stale" in reason):
                # Definitive closed or stale signal found in live HTML — trust it
                print(f"   ❌  Removed (direct):  {job['company']} — {reason}")
                continue
            elif is_open:
                verified = True
                print(f"   ✅  Verified (direct): {job['company']} — {job['job_title']}")
                # Update experience if missing
                if exp and (not job.get("experience") or str(job.get("experience")).lower() in ("null", "none")):
                    job["experience"] = exp
            else:
                # Direct check was blocked/ambiguous — fall through to extract
                print(f"   🔄  Direct check inconclusive for {job['company']} ({reason}), trying extract...")

        # ── Layer B: Tavily extract (fallback for blocked/non-LinkedIn) ───
        if not verified:
            try:
                result = _tv.extract(urls=[url])
                raw = ""
                if result and result.get("results"):
                    raw = result["results"][0].get("raw_content", "")

                if not raw.strip():
                    # Empty response — site blocked the crawl
                    print(f"   ⚠️  Empty extract for {job['company']} — dropping (unverifiable)")
                    continue

                raw_lower = raw.lower()

                # Check for closed/expired signals
                if any(s in raw_lower for s in CLOSED_SIGNALS):
                    print(f"   ❌  Removed (extract): {job['company']} — {job['job_title']}")
                    continue

                # Check for stale age signals in extract content
                if any(s in raw_lower for s in STALE_SIGNALS):
                    print(f"   ⚠️  Stale content for {job['company']} — dropping")
                    continue

                # For LinkedIn: require positive active signals
                if is_linkedin:
                    has_active = any(s in raw_lower for s in ACTIVE_SIGNALS)
                    if not has_active:
                        print(f"   ⚠️  No active signals for {job['company']} — dropping (likely stale cache)")
                        continue

                verified = True
                print(f"   ✅  Verified (extract): {job['company']} — {job['job_title']}")
                # Update experience if missing
                if not job.get("experience") or str(job.get("experience")).lower() in ("null", "none"):
                    exp = extract_experience_from_text(raw)
                    if exp:
                        job["experience"] = exp

            except Exception as e:
                print(f"   ⚠️  Extract failed for {job['company']} — dropping: {e}")
                continue

        if verified:
            # Clean up null values or infer from title
            if not job.get("experience") or str(job.get("experience")).lower() in ("null", "none"):
                inferred = infer_experience_from_title(job["job_title"])
                job["experience"] = inferred if inferred else None
            
            job["verified_at"] = now_ts
            validated.append(job)

    removed = len(candidates) - len(validated)
    print(f"\n   → Removed {removed} unverified/closed, {len(validated)} confirmed open")

    # ── Step 5: Sort so LinkedIn jobs surface first, then cap ──────────────
    # Priority: LinkedIn+Naukri (best) → LinkedIn only → Naukri only
    SOURCE_PRIORITY = {"LinkedIn + Naukri": 0, "LinkedIn": 1, "Naukri": 2}
    validated.sort(key=lambda x: SOURCE_PRIORITY.get(x["source"], 9))

    final = validated[:MAX_JOBS]

    save_jobs(output_path, final)
    print(f"\n📊  Stats: {len(naukri_jobs)} Naukri + {len(linkedin_jobs)} LinkedIn → {len(merged)} merged → {removed} closed/stale removed → {len(final)} saved")


def fuzzy_match_any(company: str, company_set: set[str]) -> bool:
    """Check if company fuzzy-matches any company in the set."""
    return any(fuzzy_match(company, c) for c in company_set)


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Job Radar Curation Engine")
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    if args.output:
        out = Path(args.output)
    else:
        repo_root = Path(__file__).resolve().parent.parent.parent
        out = repo_root / "artifacts" / "how-its-built" / "public" / "jobs.json"

    print("🚀  Job Radar Curation Engine")
    print(f"   Output : {out}")
    print(f"   Model  : {GROQ_MODEL}")
    print(f"   Max    : {MAX_JOBS} jobs")

    run_pipeline(out)
