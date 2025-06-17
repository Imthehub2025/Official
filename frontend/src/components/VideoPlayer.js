import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  RotateCcw,
  Settings,
  X,
  Youtube,
  ExternalLink,
  Download
} from 'lucide-react';

// Enhanced Video Player Component
export const VideoPlayer = ({ isOpen, onClose, content }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && content) {
      setLoading(true);
      setError(null);
      // Auto-hide controls after 3 seconds
      resetControlsTimeout();
    }
  }, [isOpen, content]);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoading(false);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVideoSource = () => {
    if (!content) return null;

    switch (content.source) {
      case 'youtube':
        return (
          <div className="w-full h-full">
            <iframe
              src={`${content.embedUrl}?autoplay=1&controls=0&modestbranding=1&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setLoading(false)}
            />
          </div>
        );
      
      case 'local':
      case 'external':
        return (
          <video
            ref={videoRef}
            src={content.videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              setError('Error loading video file');
              setLoading(false);
            }}
            onLoadStart={() => setLoading(true)}
            onCanPlay={() => setLoading(false)}
          />
        );
      
      case 'online':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <ExternalLink size={64} className="text-gray-600 mx-auto mb-4" />
              <p className="text-white text-lg mb-4">External Streaming Content</p>
              <motion.button
                onClick={() => window.open(content.streamUrl, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ExternalLink size={20} className="inline mr-2" />
                Open External Player
              </motion.button>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400">Unsupported video format</p>
          </div>
        );
    }
  };

  if (!isOpen || !content) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
        onMouseMove={handleMouseMove}
      >
        {/* Close Button */}
        <AnimatePresence>
          {showControls && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={24} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Video Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 z-10"
            >
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white">Loading video...</p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 z-10"
            >
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <motion.button
                  onClick={onClose}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close Player
                </motion.button>
              </div>
            </motion.div>
          )}

          {renderVideoSource()}

          {/* Custom Controls (only for local/external videos) */}
          {(content.source === 'local' || content.source === 'external') && (
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6"
                >
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div 
                      className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-300 mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Play/Pause */}
                      <motion.button
                        onClick={togglePlay}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:bg-gray-200 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
                      </motion.button>

                      {/* Skip Buttons */}
                      <motion.button
                        onClick={() => skip(-10)}
                        className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <RotateCcw size={20} />
                      </motion.button>

                      <motion.button
                        onClick={() => skip(10)}
                        className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <SkipForward size={20} />
                      </motion.button>

                      {/* Volume */}
                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={toggleMute}
                          className="text-white hover:text-gray-300 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </motion.button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-2 bg-gray-600 rounded-full appearance-none slider"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Title */}
                      <span className="text-white font-semibold">{content.title}</span>

                      {/* Fullscreen */}
                      <motion.button
                        onClick={toggleFullscreen}
                        className="text-white hover:text-gray-300 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* YouTube Source Info */}
          {content.source === 'youtube' && showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-4 bg-black/50 rounded-lg p-3"
            >
              <div className="flex items-center space-x-2 text-white">
                <Youtube className="text-red-500" size={20} />
                <span className="font-semibold">{content.title}</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Mini Player Component for Picture-in-Picture
export const MiniPlayer = ({ content, onExpand, onClose }) => {
  if (!content) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed bottom-4 right-4 w-80 h-48 bg-black rounded-lg overflow-hidden shadow-2xl z-40"
    >
      <div className="relative w-full h-full">
        {/* Video Preview */}
        <div className="w-full h-32 bg-gray-900 flex items-center justify-center">
          <Play size={24} className="text-white" />
        </div>

        {/* Mini Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-2">
          <p className="text-white text-sm font-semibold truncate mb-2">{content.title}</p>
          <div className="flex items-center justify-between">
            <motion.button
              onClick={onExpand}
              className="text-white hover:text-gray-300 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Maximize size={16} />
            </motion.button>
            <motion.button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};