#!/bin/bash

echo "🚀 Starting safe Vercel deployment..."

# Stop local dev server
echo "📛 Stopping local development server..."
pkill -f "next dev" || true

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf .next .vercel

# Build and deploy
echo "🔨 Building and deploying to Vercel..."
npm run build
npx vercel --prod

# Clean deployment artifacts
echo "🧽 Cleaning deployment artifacts..."
rm -rf .next .vercel

# Restart local development
echo "🔄 Restarting local development server..."
npm run dev &

echo "✅ Deployment complete! Local dev server restarted."
echo "🌐 Check your Vercel dashboard for the live URL" 