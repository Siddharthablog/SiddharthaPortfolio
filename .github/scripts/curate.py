#!/usr/bin/env python3
"""
Tech Pulse — Autonomous Web Curation Engine
============================================
Fetches the latest tech-writing and AI documentation news via Tavily,
summarises each article with Groq (Llama 3.1 70B), deduplicates,
and writes a structured JSON file for the portfolio frontend.

Environment variables:
  TAVILY_API_KEY  — https://tavily.com  (free tier: 1,000 searches/month)
  GROQ_API_KEY    — https://groq.com    (free tier: generous rate limits)

Usage:
  python .github/scripts/curate.py           # uses default output path
  python .github/scripts/curate.py --output ./custom/path/insights.json
"""

import json
import hashlib
import os
import sys
import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MAX_INSIGHTS = 9           # keep only the most recent N insights
TAVILY_MAX_RESULTS = 2     # results per search query (2 × 5 queries = 10 → trimmed to 9)
GROQ_MODEL = "openai/gpt-oss-120b"

# Search queries — each maps to a tag category
SEARCH_QUERIES = [
    {
        "query": "AI documentation tools LLM technical writing 2026",
        "tag": "AI Docs",
    },
    {
        "query": "OpenAPI AsyncAPI API documentation standards 2026",
        "tag": "API Standards",
    },
    {
        "query": "DITA XML structured content management technical writing",
        "tag": "DITA & Structured Content",
    },
    {
        "query": "DevOps CI/CD documentation automation pipeline docs-as-code",
        "tag": "DevOps & CI/CD",
    },
    {
        "query": "developer tools documentation generation code-to-docs 2026",
        "tag": "Dev Tools",
    },
]

GROQ_SYSTEM_PROMPT = """You are a senior technical writer summarising articles for a documentation professionals audience.
Given an article title and content snippet, write exactly 2 sentences:
- Sentence 1: What happened or what was released (factual, specific).
- Sentence 2: Why it matters for technical writers, documentation teams, or DocOps workflows.

Rules:
- Be punchy and developer-friendly. No filler words.
- Never start with "This article..." or "The article...".
- Do NOT use markdown formatting.
- Keep the total under 60 words."""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def url_hash(url: str) -> str:
    """Short deterministic ID from a URL."""
    return hashlib.sha256(url.encode()).hexdigest()[:8]


def load_existing(path: Path) -> list[dict]:
    """Load the current insights file, or return an empty list."""
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []


def save_insights(path: Path, insights: list[dict]) -> None:
    """Write insights list to JSON file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(insights, f, indent=2, ensure_ascii=False)
    print(f"✅  Saved {len(insights)} insights to {path}")


# ---------------------------------------------------------------------------
# Tavily Search
# ---------------------------------------------------------------------------

def search_tavily(query: str, api_key: str) -> list[dict]:
    """Run a Tavily search and return results."""
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=api_key)
        response = client.search(
            query=query,
            max_results=TAVILY_MAX_RESULTS,
            search_depth="basic",
            include_answer=False,
        )
        return response.get("results", [])
    except Exception as e:
        print(f"⚠️  Tavily search failed for '{query}': {e}")
        return []


# ---------------------------------------------------------------------------
# Groq Summarisation
# ---------------------------------------------------------------------------

def summarise_with_groq(title: str, content: str, api_key: str) -> Optional[str]:
    """Send title + content to Groq and get a 2-sentence summary."""
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": GROQ_SYSTEM_PROMPT},
                {"role": "user", "content": f"Title: {title}\n\nContent: {content[:1500]}"},
            ],
            temperature=0.3,
            max_tokens=120,
        )
        result = response.choices[0].message.content
        if result:
            return result.strip()
        # Log empty response so it's visible in CI logs
        print(f"⚠️  Groq returned empty content for '{title[:60]}' — finish_reason: {response.choices[0].finish_reason}")
        return None
    except Exception as e:
        print(f"❌  Groq summarisation FAILED — {type(e).__name__}: {e}")
        return None


def validate_groq(api_key: str) -> bool:
    """Quick smoke-test to verify the Groq key and model work before processing."""
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": "say ok"}],
            max_tokens=3,
        )
        print(f"✅  Groq key valid, model '{GROQ_MODEL}' reachable.")
        return True
    except Exception as e:
        print(f"❌  Groq validation FAILED — {type(e).__name__}: {e}")
        return False


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------

def run_pipeline(output_path: Path) -> None:
    """Execute the full curation pipeline."""

    # 1. Validate API keys
    tavily_key = os.environ.get("TAVILY_API_KEY", "").strip()
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()

    if not tavily_key:
        print("❌  TAVILY_API_KEY not set. Exiting.")
        sys.exit(1)
    if not groq_key:
        print("❌  GROQ_API_KEY not set. Exiting.")
        sys.exit(1)

    # 1b. Smoke-test Groq before doing any Tavily searches
    if not validate_groq(groq_key):
        print("❌  Groq unreachable — aborting pipeline.")
        sys.exit(1)

    # 2. Load existing insights (kept as fallback only)
    existing = load_existing(output_path)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # seen_ids only deduplicates within the current run, not against existing
    seen_ids: set = set()
    new_insights: list = []
    total_searched = 0
    total_summarised = 0

    # 3. Run searches and summarise
    for sq in SEARCH_QUERIES:
        query = sq["query"]
        tag = sq["tag"]
        print(f"\n🔍  Searching: {query}")

        results = search_tavily(query, tavily_key)
        total_searched += len(results)

        for result in results:
            url = result.get("url", "")
            title = result.get("title", "Untitled")
            content = result.get("content", "")
            source = _extract_source(url)

            # Skip duplicates within this run only
            uid = url_hash(url)
            if uid in seen_ids:
                print(f"   ⏭  Skipping (duplicate in run): {title[:60]}...")
                continue

            # Summarise with Groq
            print(f"   🤖  Summarising: {title[:60]}...")
            summary = summarise_with_groq(title, content, groq_key)
            if not summary:
                continue

            total_summarised += 1
            seen_ids.add(uid)
            new_insights.append({
                "id": uid,
                "title": title,
                "summary": summary,
                "source": source,
                "url": url,
                "tag": tag,
                "date": today,
            })

    # 4. Fresh insights replace old ones; fall back to existing if nothing new
    if new_insights:
        merged = new_insights[:MAX_INSIGHTS]
    else:
        print("⚠️  No new insights fetched — keeping existing insights unchanged.")
        merged = existing[:MAX_INSIGHTS]

    # 5. Save
    save_insights(output_path, merged)

    print(f"\n📊  Stats: {total_searched} articles found, {total_summarised} new summaries, {len(merged)} total insights saved")


def _extract_source(url: str) -> str:
    """Extract a clean source name from a URL."""
    from urllib.parse import urlparse
    domain = urlparse(url).netloc.lower()
    domain = domain.replace("www.", "")

    source_map = {
        "dev.to": "Dev.to",
        "news.ycombinator.com": "Hacker News",
        "github.com": "GitHub",
        "medium.com": "Medium",
        "infoq.com": "InfoQ",
        "tldr.tech": "TLDR Tech",
        "arxiv.org": "arXiv",
        "techcrunch.com": "TechCrunch",
        "stackoverflow.com": "Stack Overflow",
        "blog.google": "Google Blog",
        "openai.com": "OpenAI",
        "anthropic.com": "Anthropic",
        "groq.com": "Groq",
        "huggingface.co": "Hugging Face",
    }

    for key, name in source_map.items():
        if key in domain:
            return name

    # Fallback: capitalise domain parts
    parts = domain.split(".")
    return parts[-2].capitalize() if len(parts) >= 2 else domain.capitalize()


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tech Pulse Curation Engine")
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Path to output insights.json (defaults to public/insights.json relative to repo root)",
    )
    args = parser.parse_args()

    if args.output:
        out = Path(args.output)
    else:
        # Default: repo_root/artifacts/how-its-built/public/insights.json
        repo_root = Path(__file__).resolve().parent.parent.parent
        out = repo_root / "artifacts" / "how-its-built" / "public" / "insights.json"

    print(f"🚀  Tech Pulse Curation Engine")
    print(f"   Output: {out}")
    print(f"   Model:  {GROQ_MODEL}")
    print(f"   Max insights: {MAX_INSIGHTS}")

    run_pipeline(out)
