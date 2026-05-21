#!/bin/bash
# Quick-start script to run the Tech Pulse curation engine locally
# Usage: ./run-local.sh

set -e

echo "🚀 Tech Pulse Curation Engine - Local Runner"
echo "=============================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
REQUIRED_VERSION="3.10"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Python $REQUIRED_VERSION or higher is required. You have Python $PYTHON_VERSION"
    exit 1
fi

echo "✅ Python $PYTHON_VERSION detected"
echo ""

# Check if API keys are set
if [ -z "$TAVILY_API_KEY" ]; then
    echo "❌ TAVILY_API_KEY environment variable is not set!"
    echo ""
    echo "Please set your API keys before running this script:"
    echo ""
    echo "  export TAVILY_API_KEY=\"your_tavily_api_key_here\""
    echo "  export GROQ_API_KEY=\"your_groq_api_key_here\""
    echo ""
    echo "Then run this script again."
    echo ""
    echo "Get your API keys from:"
    echo "  - Tavily: https://tavily.com (free tier: 1,000 searches/month)"
    echo "  - Groq: https://groq.com (free tier with generous rate limits)"
    exit 1
fi

if [ -z "$GROQ_API_KEY" ]; then
    echo "❌ GROQ_API_KEY environment variable is not set!"
    echo ""
    echo "Please set your API keys before running this script:"
    echo ""
    echo "  export TAVILY_API_KEY=\"your_tavily_api_key_here\""
    echo "  export GROQ_API_KEY=\"your_groq_api_key_here\""
    echo ""
    echo "Then run this script again."
    echo ""
    echo "Get your API keys from:"
    echo "  - Tavily: https://tavily.com (free tier: 1,000 searches/month)"
    echo "  - Groq: https://groq.com (free tier with generous rate limits)"
    exit 1
fi

echo "✅ API keys detected"
echo ""

# Check if dependencies are installed
echo "📦 Checking Python dependencies..."
if ! python3 -c "import tavily" 2>/dev/null; then
    echo "⚠️  Dependencies not found. Installing..."
    pip install -r .github/scripts/requirements.txt
    echo ""
fi

echo "✅ Dependencies ready"
echo ""

# Run the script
echo "🏃 Running curation engine..."
echo ""
python3 .github/scripts/curate.py "$@"

echo ""
echo "✨ Done! Check artifacts/how-its-built/public/insights.json for results."

# Made with Bob
