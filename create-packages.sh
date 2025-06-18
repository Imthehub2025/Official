#!/bin/bash

# Quantum Media Hub - Quick Package Creation Script
# Creates distributable packages for all platforms

echo "🚀 Creating Quantum Media Hub Distribution Packages"
echo "=================================================="

# Create releases directory
mkdir -p releases

echo "📦 Creating Docker deployment package..."
mkdir -p releases/docker-quantum-media-hub
cp docker-compose.yml releases/docker-quantum-media-hub/
cp -r docker releases/docker-quantum-media-hub/
cp Dockerfile releases/docker-quantum-media-hub/
cp DEPLOYMENT.md releases/docker-quantum-media-hub/README.md

echo "✅ Docker package created: releases/docker-quantum-media-hub/"

echo "📱 Creating Progressive Web App package..."
mkdir -p releases/pwa-quantum-media-hub
cd frontend && yarn build && cd ..
cp -r frontend/build/* releases/pwa-quantum-media-hub/
cp frontend/public/manifest.json releases/pwa-quantum-media-hub/

echo "✅ PWA package created: releases/pwa-quantum-media-hub/"

echo "💻 Creating source code package..."
mkdir -p releases/source-quantum-media-hub
cp -r frontend releases/source-quantum-media-hub/
cp -r backend releases/source-quantum-media-hub/
cp -r electron releases/source-quantum-media-hub/
cp -r mobile releases/source-quantum-media-hub/
cp -r docker releases/source-quantum-media-hub/
cp -r build-scripts releases/source-quantum-media-hub/
cp docker-compose.yml releases/source-quantum-media-hub/
cp Dockerfile releases/source-quantum-media-hub/
cp DEPLOYMENT.md releases/source-quantum-media-hub/

echo "✅ Source package created: releases/source-quantum-media-hub/"

echo ""
echo "🎉 All packages created successfully!"
echo "📂 Available in releases/ directory"
echo "🚀 Quantum Media Hub - Ultimate Sovereign Streaming Platform"