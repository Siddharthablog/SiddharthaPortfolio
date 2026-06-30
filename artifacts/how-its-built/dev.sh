#!/bin/bash

# Simple development script
# This ensures environment variables are set before starting the dev server

echo "🚀 Starting development server..."
echo ""

# Check if .env exists, if not create it from .env.example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Open .env and fill in your GROQ_API_KEY and HF_TOKEN"
    echo "   GROQ_API_KEY  → https://console.groq.com (free)"
    echo "   HF_TOKEN      → https://huggingface.co/settings/tokens"
    echo ""
else
    # Warn if keys are still placeholder values
    if grep -q "your_groq_api_key_here\|your_hf_token_here" .env 2>/dev/null; then
        echo "⚠️  WARNING: .env still has placeholder values — chatbots will return errors."
        echo "   Edit .env and set real values for GROQ_API_KEY and HF_TOKEN."
        echo ""
    fi
fi

# Start the dev server (api-dev-server.mjs + vite are both started via 'dev' script)
pnpm run dev

# Made with Bob
