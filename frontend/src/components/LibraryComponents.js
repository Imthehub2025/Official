import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Folder, 
  Play, 
  Trash2, 
  Plus, 
  Film, 
  Monitor, 
  Youtube, 
  HardDrive,
  FolderOpen,
  FileVideo,
  Clock,
  Database,
  X,
  Download,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';
import { libraryService, youtubeService, storageService } from '../services/libraryService';

// Library Section Component
export const LibrarySection = ({ currentUser, onPlayVideo }) => {
  const [libraryContent, setLibraryContent] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showYouTubeAdd, setShowYouTubeAdd] = useState(false);
  const [scanningStorage, setScanningStorage] = useState(false);

  useEffect(() => {
    loadLibraryContent();
    loadFolders();
  }, []);

  const loadLibraryContent = () => {
    const content = libraryService.getLibraryContent();
    setLibraryContent(content);
  };

  const loadFolders = () => {
    const folderList = libraryService.getLibraryFolders();
    setFolders(['All', ...folderList]);
  };

  const filteredContent = selectedFolder === 'All' 
    ? libraryContent 
    : libraryContent.filter(item => item.folder === selectedFolder);

  const handleFileUpload = async (files) => {
    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const contentData = await libraryService.processUploadedFile(file);
        return libraryService.addToLibrary(contentData);
      } catch (error) {
        console.error('Error uploading file:', error);
        return null;
      }
    });

    await Promise.all(uploadPromises);
    loadLibraryContent();
    setUploading(false);
    setShowUpload(false);
  };

  const handleRemoveContent = (contentId) => {
    libraryService.removeFromLibrary(contentId);
    loadLibraryContent();
  };

  const handleScanExternalStorage = async () => {
    setScanningStorage(true);
    try {
      if (storageService.isFileSystemAccessSupported()) {
        const directoryHandle = await storageService.requestDirectoryAccess();
        const videoFiles = await storageService.scanDirectoryForVideos(directoryHandle);
        
        // Add found videos to library
        for (const videoFile of videoFiles) {
          const contentData = await libraryService.processUploadedFile(videoFile.file);
          contentData.source = 'external';
          libraryService.addToLibrary(contentData);
        }
        
        loadLibraryContent();
      } else {
        alert('External storage access not supported in this browser. Please use a modern browser like Chrome or Edge.');
      }
    } catch (error) {
      console.error('Error scanning external storage:', error);
      alert('Could not access external storage. Please check permissions.');
    } finally {
      setScanningStorage(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">My Library</h1>
          <p className="text-gray-400">
            Upload your own content, add YouTube videos, and stream from external storage
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.button
            onClick={() => setShowUpload(true)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload size={20} />
            <span>Upload Videos</span>
          </motion.button>

          <motion.button
            onClick={() => setShowYouTubeAdd(true)}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Youtube size={20} />
            <span>Add YouTube</span>
          </motion.button>

          <motion.button
            onClick={handleScanExternalStorage}
            disabled={scanningStorage}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            whileHover={{ scale: scanningStorage ? 1 : 1.05 }}
            whileTap={{ scale: scanningStorage ? 1 : 0.95 }}
          >
            <HardDrive size={20} />
            <span>{scanningStorage ? 'Scanning...' : 'Scan Storage'}</span>
          </motion.button>

          <motion.button
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Wifi size={20} />
            <span>Stream Online</span>
          </motion.button>
        </motion.div>

        {/* Folder Filter */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {folders.map((folder) => (
              <motion.button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedFolder === folder
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Folder size={16} />
                <span>{folder}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Content Grid */}
        {filteredContent.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {filteredContent.map((item, index) => (
              <LibraryContentCard
                key={item.id}
                item={item}
                onPlay={onPlayVideo}
                onRemove={handleRemoveContent}
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Database size={64} className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-400 mb-2">
              {selectedFolder === 'All' ? 'Your library is empty' : `No content in ${selectedFolder}`}
            </h2>
            <p className="text-gray-500 mb-4">
              Upload videos, add YouTube content, or scan external storage to get started.
            </p>
          </motion.div>
        )}

        {/* Upload Modal */}
        <UploadModal
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onUpload={handleFileUpload}
          uploading={uploading}
        />

        {/* YouTube Add Modal */}
        <YouTubeAddModal
          isOpen={showYouTubeAdd}
          onClose={() => setShowYouTubeAdd(false)}
          onAdd={loadLibraryContent}
        />
      </div>
    </div>
  );
};

// Library Content Card Component
export const LibraryContentCard = ({ item, onPlay, onRemove, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handlePlay = () => {
    onPlay(item);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this item from your library?')) {
      onRemove(item.id);
    }
  };

  const getSourceIcon = () => {
    switch (item.source) {
      case 'youtube':
        return <Youtube size={16} className="text-red-500" />;
      case 'external':
        return <HardDrive size={16} className="text-blue-500" />;
      case 'online':
        return <Wifi size={16} className="text-green-500" />;
      default:
        return <FileVideo size={16} className="text-purple-500" />;
    }
  };

  return (
    <motion.div
      className="cursor-pointer"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handlePlay}
    >
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        {/* Thumbnail */}
        <div className="aspect-video bg-gray-800 flex items-center justify-center">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <FileVideo size={48} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No Preview</p>
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="p-3">
          <h3 className="text-white font-semibold text-sm mb-1 truncate" title={item.title}>
            {item.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              {getSourceIcon()}
              <span className="capitalize">{item.source || 'local'}</span>
            </div>
            {item.size && (
              <span>{libraryService.formatFileSize(item.size)}</span>
            )}
          </div>
          {item.duration && (
            <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
              <Clock size={12} />
              <span>{libraryService.formatDuration(item.duration)}</span>
            </div>
          )}
        </div>

        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center"
            >
              <div className="flex space-x-2">
                <motion.button
                  onClick={handlePlay}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Play size={20} fill="currentColor" className="text-black ml-1" />
                </motion.button>
                
                <motion.button
                  onClick={handleRemove}
                  className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 size={20} className="text-white" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Upload Modal Component
export const UploadModal = ({ isOpen, onClose, onUpload, uploading }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onUpload(files);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Upload Videos</h2>
            <motion.button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={24} />
            </motion.button>
          </div>

          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-white mb-2">Drag & drop video files here</p>
            <p className="text-gray-400 text-sm mb-4">or</p>
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              whileHover={{ scale: uploading ? 1 : 1.05 }}
              whileTap={{ scale: uploading ? 1 : 0.95 }}
            >
              {uploading ? 'Uploading...' : 'Select Files'}
            </motion.button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <p className="text-gray-400 text-sm mt-4">
            Supported formats: MP4, AVI, MKV, MOV, WMV, WebM
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// YouTube Add Modal Component
export const YouTubeAddModal = ({ isOpen, onClose, onAdd }) => {
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setAdding(true);
    setError('');

    try {
      await youtubeService.addYouTubeVideo(url);
      onAdd();
      setUrl('');
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Youtube className="text-red-500" />
              <span>Add YouTube Video</span>
            </h2>
            <motion.button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={24} />
            </motion.button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex space-x-3">
              <motion.button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: adding ? 1 : 1.05 }}
                whileTap={{ scale: adding ? 1 : 0.95 }}
              >
                {adding ? 'Adding...' : 'Add Video'}
              </motion.button>
              
              <motion.button
                onClick={onClose}
                className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};