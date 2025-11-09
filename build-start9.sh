#!/bin/bash
# Quick build script for Start9 package
# Usage: ./build-start9.sh

set -e  # Exit on error

echo "🏗️  Building Tally Budget for Start9..."
echo ""

# Step 1: Build frontend
echo "📦 Step 1/5: Building frontend..."
cd /home/mitch/tally/frontend
npm run build
echo "✅ Frontend built"
echo ""

# Step 2: Build Docker image
echo "🐳 Step 2/5: Building Docker image..."
cd /home/mitch/tally
VERSION=$(grep "^version:" startos/manifest.yaml | awk '{print $2}')
echo "   Version: $VERSION"
docker build --load -t start9/tally-budget/main:$VERSION -f docker/Dockerfile . > /tmp/docker-build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Docker image built"
else
    echo "❌ Docker build failed! Check /tmp/docker-build.log"
    exit 1
fi
echo ""

# Step 3: Export Docker image
echo "💾 Step 3/5: Exporting Docker image to tar..."
cd /home/mitch/tally/startos
docker save start9/tally-budget/main:$VERSION -o docker-images/x86_64.tar
echo "✅ Docker image exported"
echo ""

# Step 4: Build Start9 package
echo "📦 Step 4/5: Building Start9 package..."
start-sdk pack
echo "✅ Start9 package built"
echo ""

# Step 5: Show results
echo "🎉 Step 5/5: Build complete!"
echo ""
echo "📋 Package details:"
ls -lh /home/mitch/tally/startos/tally-budget.s9pk
echo ""
echo "✅ Ready to install: /home/mitch/tally/startos/tally-budget.s9pk"
echo "   Version: $VERSION"
