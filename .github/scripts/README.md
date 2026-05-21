# Tech Pulse Curation Engine

Autonomous web curation engine that fetches the latest tech-writing and AI documentation news via Tavily, summarizes each article with Groq (Llama 3.1 70B), deduplicates, and writes a structured JSON file for the portfolio frontend.

## Prerequisites

- Python 3.10 or higher
- Tavily API key (free tier: 1,000 searches/month)
- Groq API key (free tier with generous rate limits)

## Setup

### 1. Install Python Dependencies

From the project root directory:

```bash
pip install -r .github/scripts/requirements.txt
```

Or using a virtual environment (recommended):

```bash
# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate  # On macOS/Linux
# OR
.venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r .github/scripts/requirements.txt
```

### 2. Get API Keys

#### Tavily API Key
1. Visit https://tavily.com
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier includes 1,000 searches per month

#### Groq API Key
1. Visit https://groq.com
2. Sign up for a free account
3. Get your API key from the console
4. Free tier has generous rate limits

### 3. Set Environment Variables

You have two options:

#### Option A: Export in Terminal (Recommended for Testing)

Run these commands in your terminal before running the script:

```bash
export TAVILY_API_KEY="your_actual_tavily_api_key_here"
export GROQ_API_KEY="your_actual_groq_api_key_here"
```

On Windows (Command Prompt):
```cmd
set TAVILY_API_KEY=your_actual_tavily_api_key_here
set GROQ_API_KEY=your_actual_groq_api_key_here
```

On Windows (PowerShell):
```powershell
$env:TAVILY_API_KEY="your_actual_tavily_api_key_here"
$env:GROQ_API_KEY="your_actual_groq_api_key_here"
```

#### Option B: Create a .env File (For Repeated Use)

1. Copy the example file:
   ```bash
   cp .github/scripts/.env.example .github/scripts/.env
   ```

2. Edit `.github/scripts/.env` and add your actual API keys

3. Load the environment variables before running:
   ```bash
   source .github/scripts/.env  # On macOS/Linux
   ```

**⚠️ Important:** Never commit the `.env` file with real API keys to GitHub!

## Usage

### Run with Default Output Path

From the project root directory:

```bash
python .github/scripts/curate.py
```

This will save the output to: `artifacts/how-its-built/public/insights.json`

### Run with Custom Output Path

```bash
python .github/scripts/curate.py --output ./custom/path/insights.json
```

### One-Line Command with Environment Variables

```bash
TAVILY_API_KEY="your_key" GROQ_API_KEY="your_key" python .github/scripts/curate.py
```

## What It Does

1. **Searches** for tech documentation and AI writing news using Tavily
2. **Summarizes** each article using Groq's Llama 3.1 70B model
3. **Deduplicates** articles to avoid repeats
4. **Saves** up to 15 most recent insights to JSON file
5. **Tags** articles by category (AI Docs, API Standards, DITA, DevOps, Dev Tools)

## Configuration

Edit `curate.py` to customize:

- `MAX_INSIGHTS`: Maximum number of insights to keep (default: 15)
- `TAVILY_MAX_RESULTS`: Results per search query (default: 3)
- `GROQ_MODEL`: AI model to use (default: "llama-3.1-70b-versatile")
- `SEARCH_QUERIES`: Add/modify search queries and tags

## Output Format

The script generates a JSON file with this structure:

```json
[
  {
    "id": "a1b2c3d4",
    "title": "Article Title",
    "summary": "Two-sentence summary...",
    "source": "Source Name",
    "url": "https://...",
    "tag": "AI Docs",
    "date": "2026-05-20"
  }
]
```

## Troubleshooting

### "TAVILY_API_KEY not set" Error
- Make sure you've exported the environment variable in your current terminal session
- Check for typos in the variable name
- Verify the API key is valid

### "Groq summarisation failed" Error
- Check your Groq API key is valid
- Verify you haven't exceeded rate limits
- Try again in a few minutes

### Import Errors
- Make sure you've installed the requirements: `pip install -r .github/scripts/requirements.txt`
- Verify you're using Python 3.10 or higher: `python --version`

## GitHub Actions

This script is also configured to run automatically via GitHub Actions. The workflow file is at `.github/workflows/curate-news.yml`.

For GitHub Actions, the API keys should be stored as repository secrets:
- `TAVILY_API_KEY`
- `GROQ_API_KEY`