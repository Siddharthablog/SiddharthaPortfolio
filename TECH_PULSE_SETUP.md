# Tech Pulse - Local Testing Guide

This guide explains how to test the Tech Pulse curation engine locally before pushing to GitHub.

## 📋 Quick Summary

The Tech Pulse feature uses two APIs:
- **Tavily API** - For searching tech documentation news
- **Groq API** - For AI-powered article summarization

## 🚀 Quick Start (Recommended)

### Step 1: Get Your API Keys

1. **Tavily API Key**
   - Visit: https://tavily.com
   - Sign up for free (1,000 searches/month)
   - Copy your API key

2. **Groq API Key**
   - Visit: https://groq.com
   - Sign up for free (generous rate limits)
   - Copy your API key

### Step 2: Install Python Dependencies

```bash
pip install -r .github/scripts/requirements.txt
```

Or with a virtual environment (recommended):

```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# OR
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r .github/scripts/requirements.txt
```

### Step 3: Set Environment Variables and Run

**Option A: One-Line Command (Easiest)**

```bash
TAVILY_API_KEY="your_tavily_key" GROQ_API_KEY="your_groq_key" python3 .github/scripts/curate.py
```

**Option B: Export Then Run**

```bash
# Set the API keys
export TAVILY_API_KEY="your_tavily_key"
export GROQ_API_KEY="your_groq_key"

# Run the script
python3 .github/scripts/curate.py
```

**Option C: Use the Helper Script**

```bash
# Set the API keys first
export TAVILY_API_KEY="your_tavily_key"
export GROQ_API_KEY="your_groq_key"

# Run the helper script (it checks everything for you)
./.github/scripts/run-local.sh
```

### Step 4: Check the Output

The script will create/update: `artifacts/how-its-built/public/insights.json`

## 📝 Detailed Instructions

### Windows Users

**Command Prompt:**
```cmd
set TAVILY_API_KEY=your_tavily_key
set GROQ_API_KEY=your_groq_key
python .github/scripts/curate.py
```

**PowerShell:**
```powershell
$env:TAVILY_API_KEY="your_tavily_key"
$env:GROQ_API_KEY="your_groq_key"
python .github/scripts/curate.py
```

### Custom Output Path

```bash
python3 .github/scripts/curate.py --output ./custom/path/insights.json
```

## 🔒 Security Notes

### ⚠️ NEVER commit API keys to GitHub!

The `.gitignore` file is already configured to exclude:
- `.env` files
- `.env.*` files (except `.env.example`)

### For GitHub Actions

When you're ready to push to GitHub, add your API keys as repository secrets:

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add two secrets:
   - `TAVILY_API_KEY`
   - `GROQ_API_KEY`

The GitHub Actions workflow (`.github/workflows/curate-news.yml`) will use these secrets automatically.

## 📊 What the Script Does

1. **Searches** for tech documentation and AI writing news using Tavily
2. **Summarizes** each article using Groq's Llama 3.1 70B model
3. **Deduplicates** articles to avoid repeats
4. **Saves** up to 15 most recent insights to JSON
5. **Tags** articles by category:
   - AI Docs
   - API Standards
   - DITA & Structured Content
   - DevOps & CI/CD
   - Dev Tools

## 🛠️ Troubleshooting

### "TAVILY_API_KEY not set" Error

Make sure you've set the environment variable in your **current terminal session**:

```bash
echo $TAVILY_API_KEY  # Should print your key
```

If empty, export it again in the same terminal where you'll run the script.

### "Module not found" Error

Install the dependencies:

```bash
pip install -r .github/scripts/requirements.txt
```

### "Groq summarisation failed" Error

- Check your Groq API key is valid
- You might have hit rate limits - wait a few minutes
- Check your internet connection

### Python Version Issues

The script requires Python 3.10 or higher:

```bash
python3 --version  # Should be 3.10+
```

## 📁 Project Structure

```
.github/
├── scripts/
│   ├── curate.py           # Main curation script
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Example environment file
│   ├── README.md           # Detailed documentation
│   └── run-local.sh        # Helper script for local testing
└── workflows/
    └── curate-news.yml     # GitHub Actions workflow

artifacts/
└── how-its-built/
    └── public/
        └── insights.json   # Output file (generated)
```

## 🎯 Next Steps

After testing locally:

1. ✅ Verify `insights.json` was created/updated
2. ✅ Check the JSON structure looks correct
3. ✅ Add your API keys as GitHub repository secrets
4. ✅ Push your changes to GitHub
5. ✅ The GitHub Action will run automatically on schedule

## 📚 Additional Resources

- Full documentation: `.github/scripts/README.md`
- Tavily API docs: https://docs.tavily.com
- Groq API docs: https://console.groq.com/docs
- Python script source: `.github/scripts/curate.py`

## 💡 Tips

- The free tier limits are generous for testing
- Run the script manually first to verify everything works
- The GitHub Action runs on a schedule (check `.github/workflows/curate-news.yml`)
- You can customize search queries in `curate.py` (lines 35-56)