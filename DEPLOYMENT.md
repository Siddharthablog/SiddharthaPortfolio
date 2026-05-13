# Deployment Guide

This guide explains how to deploy your portfolio website to Vercel (or other platforms) without installation issues.

## What We Fixed

The original project was configured for Replit's Linux environment, which caused issues on macOS and would cause issues on Vercel. We've made the following improvements:

### 1. **Flexible Vite Configuration**
- Updated `artifacts/how-its-built/vite.config.ts` to use default values for PORT and BASE_PATH
- No longer throws errors if environment variables are missing
- Defaults: PORT=5173, BASE_PATH=/

### 2. **Environment Variables**
- Created `.env` file for local development
- Created `.env.example` as a template
- These files ensure consistent configuration

### 3. **Vercel Configuration**
- Created `vercel.json` with proper build settings
- Automatically sets required environment variables
- Uses `--no-frozen-lockfile` to avoid pnpm lockfile issues

## Deploy to Vercel (Recommended)

### Step 1: Prepare Your Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Ready for deployment"

# Create a GitHub repository and push
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Click **"Deploy"**

That's it! Your site will be live in ~2 minutes at `https://your-project.vercel.app`

### Environment Variables (Already Configured)

The `vercel.json` file automatically sets:
- `PORT=5173`
- `BASE_PATH=/`

No manual configuration needed!

## Alternative: Deploy to Netlify

If you prefer Netlify:

1. Go to [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Configure build settings:
   - **Base directory**: `artifacts/how-its-built`
   - **Build command**: `pnpm install && pnpm run build`
   - **Publish directory**: `artifacts/how-its-built/dist/public`
4. Add environment variables:
   - `PORT=5173`
   - `BASE_PATH=/`
5. Deploy!

## Alternative: GitHub Pages

For GitHub Pages deployment:

```bash
cd artifacts/how-its-built

# Install gh-pages
pnpm add -D gh-pages

# Add to package.json scripts:
# "deploy": "vite build && gh-pages -d dist/public"

# Deploy
pnpm run deploy
```

## Local Development

To run locally (now much simpler):

```bash
# Install dependencies
pnpm install --ignore-scripts

# Run the portfolio site
cd artifacts/how-its-built
pnpm run dev
```

The `.env` file will automatically provide the required environment variables.

## Troubleshooting

### Issue: pnpm installation fails
**Solution**: Use `pnpm install --no-frozen-lockfile` or `pnpm install --ignore-scripts`

### Issue: Missing environment variables
**Solution**: Copy `.env.example` to `.env` in the `artifacts/how-its-built` directory

### Issue: Build fails on Vercel
**Solution**: Check that `vercel.json` is in the root directory and contains the correct configuration

## Docker Alternative (Optional)

If you want to use Docker for consistent builds:

```dockerfile
# Dockerfile
FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/how-its-built/package.json ./artifacts/how-its-built/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build
WORKDIR /app/artifacts/how-its-built
RUN pnpm run build

# Expose port
EXPOSE 5173

# Start
CMD ["pnpm", "run", "serve"]
```

However, **Docker is NOT needed for Vercel** - the `vercel.json` configuration handles everything automatically.

## Summary

✅ **No more installation issues**
✅ **Works on macOS, Linux, and Vercel**
✅ **Simple one-click deployment**
✅ **Environment variables handled automatically**

Your portfolio is now deployment-ready! 🚀