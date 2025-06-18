#!/bin/bash

# Quantum Media Hub - Complete Build Script
# Builds Docker images, Electron apps, and mobile packages

set -e

echo "🚀 Building Quantum Media Hub - Ultimate Sovereign Streaming Platform"
echo "======================================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    local deps=("docker" "docker-compose" "node" "yarn")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v $dep &> /dev/null; then
            missing_deps+=($dep)
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All dependencies found"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        yarn install
    fi
    
    print_status "Building React application..."
    yarn build
    
    if [ $? -eq 0 ]; then
        print_success "Frontend build completed"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    cd ..
}

# Build Docker images
build_docker() {
    print_status "Building Docker images..."
    
    # Build main application image
    docker build -t quantum-media-hub:latest .
    
    if [ $? -eq 0 ]; then
        print_success "Docker image built successfully"
    else
        print_error "Docker build failed"
        exit 1
    fi
    
    # Build with docker-compose for complete stack
    print_status "Building complete Docker stack..."
    docker-compose build
    
    if [ $? -eq 0 ]; then
        print_success "Docker stack built successfully"
    else
        print_error "Docker stack build failed"
        exit 1
    fi
}

# Build Electron apps
build_electron() {
    print_status "Building Electron desktop applications..."
    cd electron
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing Electron dependencies..."
        yarn install
    fi
    
    # Build for current platform by default
    local platform=$(uname -s)
    case $platform in
        Darwin*)
            print_status "Building for macOS..."
            yarn dist:mac
            ;;
        Linux*)
            print_status "Building for Linux..."
            yarn dist:linux
            ;;
        MINGW*|CYGWIN*|MSYS*)
            print_status "Building for Windows..."
            yarn dist:win
            ;;
        *)
            print_warning "Unknown platform: $platform. Building for all platforms..."
            yarn dist:all
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "Electron apps built successfully"
        print_status "Installers available in: electron/dist/"
    else
        print_error "Electron build failed"
        exit 1
    fi
    
    cd ..
}

# Build mobile apps
build_mobile() {
    print_status "Preparing mobile applications..."
    cd mobile
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing mobile dependencies..."
        yarn install
    fi
    
    # Check if Android SDK is available
    if command -v android &> /dev/null || [ -n "$ANDROID_HOME" ]; then
        print_status "Building Android APK..."
        yarn build:android
        
        if [ $? -eq 0 ]; then
            print_success "Android APK built successfully"
            print_status "APK available in: mobile/android/app/build/outputs/apk/"
        else
            print_warning "Android build failed - SDK might not be configured"
        fi
    else
        print_warning "Android SDK not found - skipping Android build"
        print_status "To build Android APK, install Android Studio and set ANDROID_HOME"
    fi
    
    # Check if Xcode is available (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]] && command -v xcodebuild &> /dev/null; then
        print_status "Building iOS app..."
        yarn build:ios
        
        if [ $? -eq 0 ]; then
            print_success "iOS app prepared successfully"
            print_status "iOS project available in: mobile/ios/"
            print_status "Open in Xcode to build and sign for App Store"
        else
            print_warning "iOS build failed"
        fi
    else
        print_warning "Xcode not available - skipping iOS build"
    fi
    
    cd ..
}

# Package everything
package_releases() {
    print_status "Packaging release files..."
    
    # Create release directory
    mkdir -p releases
    rm -rf releases/*
    
    # Copy Docker files
    print_status "Packaging Docker deployment..."
    mkdir -p releases/docker
    cp docker-compose.yml releases/docker/
    cp -r docker/ releases/docker/
    cp Dockerfile releases/docker/
    
    # Create Docker deployment script
    cat > releases/docker/deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying Quantum Media Hub..."
echo "Starting services with docker-compose..."
docker-compose up -d
echo "✅ Quantum Media Hub is now running!"
echo "🌐 Frontend: http://localhost"
echo "⚙️  Backend API: http://localhost:8001"
echo "📊 Admin Dashboard: http://localhost:8001/docs"
EOF
    chmod +x releases/docker/deploy.sh
    
    # Copy Electron apps
    if [ -d "electron/dist" ]; then
        print_status "Packaging desktop applications..."
        cp -r electron/dist releases/desktop
    fi
    
    # Copy mobile builds
    if [ -d "mobile/android/app/build/outputs/apk" ]; then
        print_status "Packaging Android APK..."
        mkdir -p releases/mobile
        cp mobile/android/app/build/outputs/apk/debug/app-debug.apk releases/mobile/quantum-media-hub.apk 2>/dev/null || true
        cp mobile/android/app/build/outputs/apk/release/app-release.apk releases/mobile/quantum-media-hub-release.apk 2>/dev/null || true
    fi
    
    # Create README for releases
    cat > releases/README.md << 'EOF'
# Quantum Media Hub - Release Packages

## 🐳 Docker Deployment
Navigate to the `docker/` directory and run:
```bash
./deploy.sh
```

## 💻 Desktop Applications
Desktop installers are available in the `desktop/` directory:
- **macOS**: `.dmg` and `.pkg` files
- **Windows**: `.exe` and `.msi` files  
- **Linux**: `.AppImage`, `.deb`, and `.rpm` files

## 📱 Mobile Applications
Mobile apps are available in the `mobile/` directory:
- **Android**: `quantum-media-hub.apk`
- **iOS**: Build from source using Xcode

## 🌐 Web Access
The platform can also be accessed directly via web browser at the deployed URL.

## 🔑 Features
- 🔐 Full Sovereignty Mode
- 🤖 AI-Powered Recommendations
- 📺 4K-16K Video Streaming
- 🥽 XR/VR Support
- 📱 Advanced Device Integration
- 👥 Social Features & Watch Parties
- 📊 Real-time Analytics
- 🎙️ Voice Commands

For more information, visit: https://quantum-media-hub.com
EOF
    
    print_success "All packages created in releases/ directory"
}

# Main build process
main() {
    print_status "Starting complete build process..."
    
    # Parse command line arguments
    BUILD_FRONTEND=true
    BUILD_DOCKER=true
    BUILD_ELECTRON=true
    BUILD_MOBILE=true
    PACKAGE_RELEASES=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --frontend-only)
                BUILD_DOCKER=false
                BUILD_ELECTRON=false
                BUILD_MOBILE=false
                PACKAGE_RELEASES=false
                shift
                ;;
            --docker-only)
                BUILD_FRONTEND=true
                BUILD_ELECTRON=false
                BUILD_MOBILE=false
                PACKAGE_RELEASES=false
                shift
                ;;
            --desktop-only)
                BUILD_DOCKER=false
                BUILD_MOBILE=false
                PACKAGE_RELEASES=false
                shift
                ;;
            --mobile-only)
                BUILD_DOCKER=false
                BUILD_ELECTRON=false
                PACKAGE_RELEASES=false
                shift
                ;;
            --no-package)
                PACKAGE_RELEASES=false
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --frontend-only   Build only the frontend"
                echo "  --docker-only     Build only Docker images"
                echo "  --desktop-only    Build only desktop applications"
                echo "  --mobile-only     Build only mobile applications"
                echo "  --no-package      Skip packaging step"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_warning "Unknown option: $1"
                shift
                ;;
        esac
    done
    
    # Run build steps
    check_dependencies
    
    if [ "$BUILD_FRONTEND" = true ]; then
        build_frontend
    fi
    
    if [ "$BUILD_DOCKER" = true ]; then
        build_docker
    fi
    
    if [ "$BUILD_ELECTRON" = true ]; then
        build_electron
    fi
    
    if [ "$BUILD_MOBILE" = true ]; then
        build_mobile
    fi
    
    if [ "$PACKAGE_RELEASES" = true ]; then
        package_releases
    fi
    
    print_success "🎉 Build process completed successfully!"
    echo ""
    print_status "📦 Available packages:"
    if [ "$BUILD_DOCKER" = true ]; then
        echo "   🐳 Docker: docker-compose up -d"
    fi
    if [ "$BUILD_ELECTRON" = true ]; then
        echo "   💻 Desktop: electron/dist/"
    fi
    if [ "$BUILD_MOBILE" = true ]; then
        echo "   📱 Mobile: mobile/android/app/build/outputs/apk/"
    fi
    if [ "$PACKAGE_RELEASES" = true ]; then
        echo "   📁 All packages: releases/"
    fi
    echo ""
    print_status "🚀 Quantum Media Hub - Ultimate Sovereign Streaming Platform is ready!"
}

# Run main function with all arguments
main "$@"