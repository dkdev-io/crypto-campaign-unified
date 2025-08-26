#!/bin/bash

# Deploy script for GitHub Pages
set -e

echo "🚀 Building and deploying to GitHub Pages..."

# Build the project
echo "📦 Building project..."
cd frontend
npm run build
cd ..

# Copy build files to temporary directory
echo "📋 Preparing deployment files..."
rm -rf /tmp/gh-pages-deploy
mkdir -p /tmp/gh-pages-deploy
cp -r frontend/dist/* /tmp/gh-pages-deploy/

# Switch to gh-pages branch
echo "🌿 Switching to gh-pages branch..."
git checkout -B gh-pages

# Clear current contents and copy new files
echo "🧹 Updating gh-pages branch..."
rm -rf *
cp -r /tmp/gh-pages-deploy/* .

# Create .nojekyll file to prevent Jekyll processing
touch .nojekyll

# Commit and push
echo "💾 Committing changes..."
git add .
git commit -m "Deploy to GitHub Pages - $(date)"

echo "🚀 Pushing to GitHub..."
git push -f origin gh-pages

# Switch back to main branch
echo "🔄 Switching back to main branch..."
git checkout main

echo "✅ Deployment complete!"
echo "🌐 Your site will be available at: https://dkdev-io.github.io/crypto-campaign-unified/"