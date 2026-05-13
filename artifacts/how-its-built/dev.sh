#!/bin/bash

# Simple development script
# This ensures environment variables are set before starting the dev server

echo "🚀 Starting development server..."
echo ""

# Check if .env exists, if not create it from .env.example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
fi

# Start the dev server
pnpm run dev

# Made with Bob
