#!/usr/bin/env node

const { build } = require('electron-builder');
const path = require('path');
const fs = require('fs');

// Build configuration
const config = {
  directories: {
    app: path.join(__dirname, '..'),
    output: path.join(__dirname, '../dist')
  },
  files: [
    'main.js',
    'preload.js',
    'renderer/**/*',
    'assets/**/*',
    'package.json',
    '!node_modules/**/*',
    '!src/**/*',
    '!build-scripts/**/*'
  ],
  extraResources: [
    {
      from: path.join(__dirname, '../../frontend/build'),
      to: 'app',
      filter: ['**/*']
    }
  ],
  publish: null // Don't publish automatically
};

// Platform-specific builds
const platforms = {
  mac: {
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'pkg', arch: ['x64', 'arm64'] }
    ]
  },
  win: {
    target: [
      { target: 'nsis', arch: ['x64', 'ia32'] },
      { target: 'msi', arch: ['x64', 'ia32'] }
    ]
  },
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] },
      { target: 'rpm', arch: ['x64'] }
    ]
  }
};

async function buildApp() {
  console.log('🚀 Building Quantum Media Hub Desktop App...\n');

  try {
    // Ensure frontend is built
    const frontendBuildPath = path.join(__dirname, '../../frontend/build');
    if (!fs.existsSync(frontendBuildPath)) {
      console.log('❌ Frontend build not found. Please run "yarn build" in the frontend directory first.');
      process.exit(1);
    }

    // Get build targets from command line
    const args = process.argv.slice(2);
    let targets = [];

    if (args.includes('--mac') || args.includes('--all')) {
      targets.push({ platform: 'mac', ...platforms.mac });
    }
    if (args.includes('--win') || args.includes('--all')) {
      targets.push({ platform: 'win32', ...platforms.win });
    }
    if (args.includes('--linux') || args.includes('--all')) {
      targets.push({ platform: 'linux', ...platforms.linux });
    }

    // Default to current platform if no targets specified
    if (targets.length === 0) {
      const currentPlatform = process.platform === 'darwin' ? 'mac' : 
                             process.platform === 'win32' ? 'win' : 'linux';
      targets.push({ platform: currentPlatform, ...platforms[currentPlatform] });
    }

    // Build for each target
    for (const target of targets) {
      console.log(`📦 Building for ${target.platform}...`);
      
      await build({
        ...config,
        [target.platform]: target,
        publish: null
      });

      console.log(`✅ ${target.platform} build completed!\n`);
    }

    console.log('🎉 All builds completed successfully!');
    console.log('📁 Output directory:', path.join(__dirname, '../dist'));

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the build
buildApp();