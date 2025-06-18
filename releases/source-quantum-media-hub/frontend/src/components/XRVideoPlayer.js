import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Eye,
  Hand,
  Mic,
  Settings,
  X,
  RotateCcw,
  SkipForward,
  Home,
  Layers,
  Zap
} from 'lucide-react';
import { xrService, gestureService } from '../services/deviceService';

// XR-Optimized Video Player
export const XRVideoPlayer = ({ isOpen, onClose, content, xrMode = 'immersive-vr' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const xrSessionRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [xrActive, setXrActive] = useState(false);
  const [handTracking, setHandTracking] = useState(false);
  const [voiceControl, setVoiceControl] = useState(false);
  const [eyeTracking, setEyeTracking] = useState(false);
  const [xrEnvironment, setXrEnvironment] = useState('theater');
  const [spatialAudio, setSpatialAudio] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen && content) {
      initializeXR();
    }
    return () => {
      cleanup();
    };
  }, [isOpen, content]);

  const initializeXR = async () => {
    if (!xrService.isXRSupported()) {
      setError('XR not supported on this device');
      return;
    }

    setLoading(true);
    try {
      const xrSupport = await xrService.checkXRSupport();
      if (xrSupport.supported && xrSupport.modes[xrMode]) {
        // XR is available but not started by default
        console.log('XR ready for activation');
      }
    } catch (err) {
      setError('Failed to initialize XR: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startXRSession = async () => {
    setLoading(true);
    try {
      const result = await xrService.startXRSession(xrMode);
      if (result.success) {
        xrSessionRef.current = result.session;
        setXrActive(true);
        
        // Setup XR-specific features
        setupXRFeatures(result.session);
        
        // Create XR video element
        if (videoRef.current) {
          setupXRVideo(result.session);
        }
      } else {
        setError('Failed to start XR session: ' + result.error);
      }
    } catch (err) {
      setError('XR session error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupXRFeatures = (session) => {
    // Setup hand tracking
    if (session.inputSources) {
      gestureService.setupHandTracking(session);
      setHandTracking(true);
    }

    // Setup voice control
    const voiceRecognition = gestureService.setupVoiceControl();
    if (voiceRecognition) {
      recognitionRef.current = voiceRecognition;
      
      voiceRecognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          handleVoiceCommand(result[0].transcript.toLowerCase().trim());
        }
      };
      
      voiceRecognition.start();
      setVoiceControl(true);
    }

    // Setup eye tracking (if available)
    const eyeTrackingResult = gestureService.setupEyeTracking();
    setEyeTracking(eyeTrackingResult.enabled);
  };

  const setupXRVideo = (session) => {
    if (!videoRef.current) return;

    // Create XR-optimized video
    const xrVideo = xrService.createXRVideoElement(content.videoUrl || content.embedUrl, session);
    
    // Setup spatial audio for XR
    if (spatialAudio && xrVideo) {
      xrVideo.volume = volume;
      xrVideo.muted = isMuted;
    }

    // Replace current video with XR-optimized version
    if (videoRef.current.parentNode) {
      videoRef.current.parentNode.replaceChild(xrVideo, videoRef.current);
      videoRef.current = xrVideo;
    }
  };

  const handleVoiceCommand = (command) => {
    switch (command) {
      case 'play':
        togglePlay();
        break;
      case 'pause':
        togglePlay();
        break;
      case 'volume up':
        setVolume(prev => Math.min(prev + 0.1, 1));
        break;
      case 'volume down':
        setVolume(prev => Math.max(prev - 0.1, 0));
        break;
      case 'mute':
        setIsMuted(true);
        break;
      case 'unmute':
        setIsMuted(false);
        break;
      case 'next':
        skip(10);
        break;
      case 'previous':
        skip(-10);
        break;
      case 'theater mode':
        setXrEnvironment('theater');
        break;
      case 'space mode':
        setXrEnvironment('space');
        break;
      case 'home mode':
        setXrEnvironment('home');
        break;
      default:
        console.log('Unknown voice command:', command);
    }
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

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
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
    }
  };

  const exitXR = async () => {
    if (xrSessionRef.current) {
      await xrSessionRef.current.end();
      xrSessionRef.current = null;
      setXrActive(false);
      setHandTracking(false);
      setVoiceControl(false);
      setEyeTracking(false);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const cleanup = () => {
    if (xrSessionRef.current) {
      exitXR();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const environments = [
    { id: 'theater', name: 'Theater', icon: Layers, description: 'Cinema experience' },
    { id: 'space', name: 'Space', icon: Zap, description: 'Floating in space' },
    { id: 'home', name: 'Home', icon: Home, description: 'Cozy living room' }
  ];

  if (!isOpen || !content) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* XR Status Indicator */}
        {xrActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 z-20 bg-purple-600/90 backdrop-blur-md rounded-lg p-3"
          >
            <div className="flex items-center space-x-2 text-white">
              <Eye className="animate-pulse" size={20} />
              <span className="font-semibold">XR Mode Active</span>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              {handTracking && (
                <div className="flex items-center space-x-1">
                  <Hand size={14} className="text-green-400" />
                  <span>Hands</span>
                </div>
              )}
              {voiceControl && (
                <div className="flex items-center space-x-1">
                  <Mic size={14} className="text-blue-400" />
                  <span>Voice</span>
                </div>
              )}
              {eyeTracking && (
                <div className="flex items-center space-x-1">
                  <Eye size={14} className="text-purple-400" />
                  <span>Eyes</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-30"
          >
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Initializing XR Experience...</p>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-30"
          >
            <div className="text-center max-w-md">
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

        {/* Video Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          {content.source === 'youtube' ? (
            <iframe
              src={`${content.embedUrl}?autoplay=1&controls=0&modestbranding=1&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              src={content.videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              autoPlay
            />
          )}
        </div>

        {/* XR Controls Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6"
        >
          {/* Progress Bar */}
          {content.source !== 'youtube' && (
            <div className="mb-4">
              <div className="w-full h-2 bg-gray-600 rounded-full">
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
          )}

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
                  onClick={() => setIsMuted(!isMuted)}
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
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    setIsMuted(newVolume === 0);
                  }}
                  className="w-20 h-2 bg-gray-600 rounded-full appearance-none slider"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* XR Toggle */}
              {xrService.isXRSupported() && (
                <motion.button
                  onClick={xrActive ? exitXR : startXRSession}
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    xrActive 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                  whileHover={{ scale: loading ? 1 : 1.05 }}
                  whileTap={{ scale: loading ? 1 : 0.95 }}
                >
                  <Eye size={16} className="inline mr-2" />
                  {xrActive ? 'Exit XR' : 'Enter XR'}
                </motion.button>
              )}

              {/* Environment Selector */}
              {xrActive && (
                <div className="flex space-x-2">
                  {environments.map((env) => {
                    const Icon = env.icon;
                    return (
                      <motion.button
                        key={env.id}
                        onClick={() => setXrEnvironment(env.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          xrEnvironment === env.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={env.description}
                      >
                        <Icon size={16} />
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Settings */}
              <motion.button
                className="text-white hover:text-gray-300 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Settings size={20} />
              </motion.button>

              {/* Close */}
              <motion.button
                onClick={onClose}
                className="text-white hover:text-gray-300 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          {/* XR Environment Info */}
          {xrActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center"
            >
              <p className="text-gray-300 text-sm">
                Environment: <span className="text-purple-400 font-semibold capitalize">{xrEnvironment}</span>
                {voiceControl && (
                  <span className="ml-4">
                    Voice commands: "play", "pause", "volume up/down", "theater/space/home mode"
                  </span>
                )}
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};