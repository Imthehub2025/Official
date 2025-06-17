// Library Service for managing uploaded content
const STORAGE_KEYS = {
  LIBRARY_CONTENT: 'quantum_library_content',
  LIBRARY_FOLDERS: 'quantum_library_folders'
};

// Library Management Service
export const libraryService = {
  // Get all library content
  getLibraryContent: () => {
    const content = localStorage.getItem(STORAGE_KEYS.LIBRARY_CONTENT);
    return content ? JSON.parse(content) : [];
  },

  // Add content to library
  addToLibrary: (contentData) => {
    const library = libraryService.getLibraryContent();
    const newContent = {
      id: Date.now(),
      ...contentData,
      addedAt: new Date().toISOString(),
      type: 'uploaded',
      source: 'local'
    };
    
    library.unshift(newContent);
    localStorage.setItem(STORAGE_KEYS.LIBRARY_CONTENT, JSON.stringify(library));
    return newContent;
  },

  // Remove content from library
  removeFromLibrary: (contentId) => {
    const library = libraryService.getLibraryContent();
    const filteredLibrary = library.filter(item => item.id !== contentId);
    localStorage.setItem(STORAGE_KEYS.LIBRARY_CONTENT, JSON.stringify(filteredLibrary));
    return filteredLibrary;
  },

  // Get library folders
  getLibraryFolders: () => {
    const folders = localStorage.getItem(STORAGE_KEYS.LIBRARY_FOLDERS);
    return folders ? JSON.parse(folders) : ['Movies', 'TV Shows', 'Documentaries', 'Home Videos'];
  },

  // Add library folder
  addLibraryFolder: (folderName) => {
    const folders = libraryService.getLibraryFolders();
    if (!folders.includes(folderName)) {
      folders.push(folderName);
      localStorage.setItem(STORAGE_KEYS.LIBRARY_FOLDERS, JSON.stringify(folders));
    }
    return folders;
  },

  // Process uploaded file
  processUploadedFile: (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      // Check if it's a video file
      const videoTypes = ['video/mp4', 'video/avi', 'video/mkv', 'video/mov', 'video/wmv', 'video/webm'];
      const isVideo = videoTypes.some(type => file.type.includes('video')) || 
                     file.name.match(/\.(mp4|avi|mkv|mov|wmv|webm)$/i);

      if (!isVideo) {
        reject(new Error('Please upload a valid video file'));
        return;
      }

      // Create object URL for the video file
      const videoUrl = URL.createObjectURL(file);
      
      // Extract filename without extension for title
      const title = file.name.replace(/\.[^/.]+$/, "");
      
      const contentData = {
        title: title,
        filename: file.name,
        size: file.size,
        type: file.type,
        videoUrl: videoUrl,
        duration: 0, // Will be set when video loads
        thumbnail: null, // Will be generated when video loads
        folder: 'Movies' // Default folder
      };

      resolve(contentData);
    });
  },

  // Generate video thumbnail
  generateThumbnail: (videoElement) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 320;
      canvas.height = 180;
      
      // Draw video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnailUrl);
    });
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format duration
  formatDuration: (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

// YouTube Service for enhanced YouTube integration
export const youtubeService = {
  // Extract video ID from YouTube URL
  extractVideoId: (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  },

  // Get YouTube video info (basic)
  getVideoInfo: async (videoId) => {
    try {
      // This is a simplified version - in production you'd use YouTube API
      return {
        id: videoId,
        title: 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`
      };
    } catch (error) {
      console.error('Error getting YouTube video info:', error);
      return null;
    }
  },

  // Add YouTube video to library
  addYouTubeVideo: async (url) => {
    const videoId = youtubeService.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const videoInfo = await youtubeService.getVideoInfo(videoId);
    if (!videoInfo) {
      throw new Error('Could not fetch video information');
    }

    const contentData = {
      title: videoInfo.title,
      videoId: videoId,
      thumbnail: videoInfo.thumbnail,
      embedUrl: videoInfo.embedUrl,
      watchUrl: videoInfo.watchUrl,
      source: 'youtube',
      folder: 'YouTube'
    };

    return libraryService.addToLibrary(contentData);
  }
};

// External Storage Service (Browser limitations apply)
export const storageService = {
  // Check if File System Access API is supported
  isFileSystemAccessSupported: () => {
    return 'showDirectoryPicker' in window;
  },

  // Request directory access (only works in modern browsers with user permission)
  requestDirectoryAccess: async () => {
    try {
      if (!storageService.isFileSystemAccessSupported()) {
        throw new Error('File System Access API not supported in this browser');
      }

      const directoryHandle = await window.showDirectoryPicker();
      return directoryHandle;
    } catch (error) {
      console.error('Error accessing directory:', error);
      throw error;
    }
  },

  // Scan directory for video files
  scanDirectoryForVideos: async (directoryHandle) => {
    const videoFiles = [];
    const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.webm'];

    try {
      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'file') {
          const isVideo = videoExtensions.some(ext => 
            name.toLowerCase().endsWith(ext)
          );
          
          if (isVideo) {
            const file = await handle.getFile();
            videoFiles.push({
              name: name,
              file: file,
              handle: handle,
              size: file.size,
              lastModified: file.lastModified
            });
          }
        }
      }
    } catch (error) {
      console.error('Error scanning directory:', error);
    }

    return videoFiles;
  }
};