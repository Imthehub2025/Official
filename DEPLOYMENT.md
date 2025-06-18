# 🚀 Quantum Media Hub - Deployment Guide

## Overview
Quantum Media Hub is available in multiple deployment formats to suit different needs and platforms.

## 📦 Available Packages

### 🐳 Docker Container (Recommended)
**Best for**: Server deployment, development, self-hosting

**Features**:
- Complete stack with MongoDB, Redis, and all services
- Production-ready with NGINX load balancing
- Easy scaling and management
- Includes WebRTC signaling for watch parties

**Requirements**:
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum, 8GB recommended
- 20GB storage minimum

**Quick Start**:
```bash
# Clone or download the docker files
git clone https://github.com/quantum-development/media-hub.git
cd media-hub

# Start the complete stack
docker-compose up -d

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8001
# Admin Dashboard: http://localhost:8001/docs
```

**Environment Variables**:
```bash
# Optional: Add your OpenAI API key for AI features
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

### 💻 Desktop Applications
**Best for**: Personal use, offline access, native experience

**Available Platforms**:
- **macOS**: `.dmg` installer (x64, arm64)
- **Windows**: `.exe` and `.msi` installers (x64, x32)
- **Linux**: `.AppImage`, `.deb`, `.rpm` packages (x64)

**Features**:
- Native desktop integration
- Auto-updates
- System tray integration
- Offline mode support
- Local media file support

**Installation**:
1. Download the appropriate installer for your platform
2. Run the installer (may require admin privileges)
3. Launch Quantum Media Hub from your applications menu
4. The app will automatically connect to a local backend or prompt for server configuration

### 📱 Mobile Applications

#### 📱 Progressive Web App (PWA)
**Best for**: Cross-platform mobile access, no app store required

**Features**:
- Install directly from browser
- Offline support
- Push notifications
- Native app-like experience
- Works on iOS, Android, and desktop

**Installation**:
1. Visit the Quantum Media Hub URL in your mobile browser
2. Tap "Add to Home Screen" (iOS) or "Install App" (Android)
3. The PWA will be added to your device like a native app

#### 📱 Android APK
**Best for**: Android devices, sideloading, full device integration

**Features**:
- Full native Android experience
- Hardware access (camera, microphone, sensors)
- Background processing
- Deep system integration

**Installation**:
1. Download the `quantum-media-hub.apk` file
2. Enable "Unknown Sources" in Android settings
3. Install the APK file
4. Grant necessary permissions for full functionality

#### 🍎 iOS Application
**Best for**: iOS devices, App Store distribution

**Note**: iOS build requires Xcode and Apple Developer account
1. Open the iOS project in Xcode
2. Configure signing and provisioning
3. Build and install to device or submit to App Store

## 🛠️ Building from Source

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Yarn package manager

### Complete Build
```bash
# Make the build script executable
chmod +x build-scripts/build-all.sh

# Build all packages
./build-scripts/build-all.sh

# Or build specific packages:
./build-scripts/build-all.sh --docker-only
./build-scripts/build-all.sh --desktop-only
./build-scripts/build-all.sh --mobile-only
```

### Manual Frontend Build
```bash
cd frontend
yarn install
yarn build
```

### Manual Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

## 🌐 Production Deployment

### Docker Production
```yaml
version: '3.8'
services:
  app:
    image: quantum-media-hub:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MONGO_URL=mongodb://mongo:27017
    volumes:
      - ./data:/app/sovereign_storage
      - ./ssl:/etc/ssl/certs
    restart: unless-stopped
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: quantum-media-hub
spec:
  replicas: 3
  selector:
    matchLabels:
      app: quantum-media-hub
  template:
    metadata:
      labels:
        app: quantum-media-hub
    spec:
      containers:
      - name: app
        image: quantum-media-hub:latest
        ports:
        - containerPort: 80
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: quantum-secrets
              key: openai-api-key
```

### Reverse Proxy (NGINX)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Backend Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=quantum_media_hub
OPENAI_API_KEY=your_api_key_here
REDIS_URL=redis://localhost:6379

# Frontend Configuration  
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_VERSION=2.0.0
```

### Storage Configuration
- **Default**: Local filesystem storage
- **S3**: Configure AWS S3 for cloud storage
- **MinIO**: Self-hosted S3-compatible storage
- **IPFS**: Decentralized storage for sovereignty mode

### AI Configuration
- **OpenAI**: Add API key for full AI features
- **Local AI**: Use local models for sovereignty mode
- **Hybrid**: Mix of cloud and local AI processing

## 📊 Monitoring & Analytics

### Health Checks
- **Backend**: `GET /health`
- **Frontend**: Service worker status
- **Database**: MongoDB connection status
- **Services**: Supervisor process monitoring

### Logging
- **Application**: Structured JSON logs
- **Access**: NGINX access logs
- **Errors**: Centralized error tracking
- **Performance**: Real-time metrics dashboard

### Metrics
- **User Analytics**: Viewing patterns, preferences
- **Performance**: Response times, resource usage
- **Business**: Content popularity, user engagement
- **Technical**: System health, error rates

## 🔒 Security

### Authentication
- **Multi-user**: Support for multiple user profiles
- **OAuth**: Integration with social providers
- **API Keys**: Secure API access
- **Sessions**: Secure session management

### Data Protection
- **Encryption**: At-rest and in-transit encryption
- **Privacy**: GDPR-compliant data handling
- **Sovereignty**: Complete user data control
- **Backups**: Automated backup strategies

### Network Security
- **HTTPS**: TLS encryption for all traffic
- **CORS**: Proper cross-origin resource sharing
- **CSP**: Content Security Policy headers
- **Rate Limiting**: API rate limiting and DDoS protection

## 🆘 Troubleshooting

### Common Issues

**Docker container won't start**:
```bash
# Check logs
docker-compose logs quantum-media-hub

# Check disk space
df -h

# Restart services
docker-compose restart
```

**Desktop app won't launch**:
- Check system requirements
- Run as administrator (Windows)
- Check security settings (macOS)
- Install missing dependencies (Linux)

**Mobile app issues**:
- Update to latest version
- Clear app cache
- Check permissions
- Restart device

**API connection errors**:
- Verify backend is running
- Check network connectivity
- Validate API endpoints
- Review CORS settings

### Performance Optimization

**Video Streaming**:
- Enable hardware acceleration
- Configure CDN for static assets
- Optimize video encoding settings
- Use adaptive bitrate streaming

**Database**:
- Create proper indexes
- Enable query optimization
- Configure connection pooling
- Regular maintenance tasks

**Frontend**:
- Enable service worker caching
- Optimize bundle size
- Use code splitting
- Implement lazy loading

## 📞 Support

### Community Support
- **GitHub**: Issues and discussions
- **Discord**: Real-time community chat
- **Forum**: Technical discussions
- **Wiki**: Community documentation

### Commercial Support
- **Enterprise**: Dedicated support team
- **Consulting**: Custom deployment assistance
- **Training**: Team training programs
- **SLA**: Service level agreements

---

**🚀 Quantum Media Hub - Ultimate Sovereign Streaming Platform**
*The future of media consumption is here!*