import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Brain, Command, Zap } from 'lucide-react';

const VoiceCommand = ({ 
  currentUser,
  onCommand,
  onVolumeChange,
  onPlayPause,
  onSeek,
  onQualityChange,
  onSearch,
  className = ""
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [commandHistory, setCommandHistory] = useState([]);

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setConfidence(confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          processVoiceCommand(finalTranscript, confidence);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && voiceEnabled) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processVoiceCommand = async (command, confidenceScore) => {
    if (!command.trim()) return;

    setIsProcessing(true);
    setLastCommand(command);

    try {
      // Process locally first for common commands
      const localResult = processLocalCommand(command.toLowerCase());
      
      if (localResult.handled) {
        executeCommand(localResult);
        addToCommandHistory(command, localResult.action, true);
        setIsProcessing(false);
        return;
      }

      // Send to AI service for complex commands
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/ai/voice-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser?.id || 'anonymous',
          command: command,
          context: {
            current_page: window.location.pathname,
            timestamp: new Date().toISOString(),
            confidence: confidenceScore
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        executeCommand(result);
        addToCommandHistory(command, result.action, result.confidence > 0.7);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      addToCommandHistory(command, 'error', false);
    } finally {
      setIsProcessing(false);
      
      // Auto-clear transcript after 3 seconds
      timeoutRef.current = setTimeout(() => {
        setTranscript('');
        setLastCommand('');
      }, 3000);
    }
  };

  const processLocalCommand = (command) => {
    // Common voice commands that can be processed locally
    const commands = {
      // Playback control
      'play': { action: 'play', handled: true },
      'pause': { action: 'pause', handled: true },
      'stop': { action: 'pause', handled: true },
      'resume': { action: 'play', handled: true },
      
      // Volume control
      'volume up': { action: 'volume_up', handled: true },
      'volume down': { action: 'volume_down', handled: true },
      'mute': { action: 'mute', handled: true },
      'unmute': { action: 'unmute', handled: true },
      
      // Navigation
      'go home': { action: 'navigate', parameters: { section: 'home' }, handled: true },
      'go to movies': { action: 'navigate', parameters: { section: 'movies' }, handled: true },
      'go to tv shows': { action: 'navigate', parameters: { section: 'tv-shows' }, handled: true },
      'my list': { action: 'navigate', parameters: { section: 'my-list' }, handled: true },
      
      // Quality
      '4k': { action: 'quality', parameters: { quality: '2160p' }, handled: true },
      'hd': { action: 'quality', parameters: { quality: '1080p' }, handled: true },
      'fullscreen': { action: 'fullscreen', handled: true },
      'exit fullscreen': { action: 'exit_fullscreen', handled: true }
    };

    // Check for exact matches
    if (commands[command]) {
      return commands[command];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(commands)) {
      if (command.includes(key)) {
        return value;
      }
    }

    // Check for search commands
    if (command.startsWith('search for ')) {
      return {
        action: 'search',
        parameters: { query: command.replace('search for ', '') },
        handled: true
      };
    }

    return { handled: false };
  };

  const executeCommand = (result) => {
    const { action, parameters = {} } = result;

    switch (action) {
      case 'play':
        onPlayPause && onPlayPause(true);
        break;
      case 'pause':
        onPlayPause && onPlayPause(false);
        break;
      case 'volume_up':
        onVolumeChange && onVolumeChange('up');
        break;
      case 'volume_down':
        onVolumeChange && onVolumeChange('down');
        break;
      case 'mute':
        onVolumeChange && onVolumeChange('mute');
        break;
      case 'unmute':
        onVolumeChange && onVolumeChange('unmute');
        break;
      case 'navigate':
        if (parameters.section && onCommand) {
          onCommand('navigate', parameters);
        }
        break;
      case 'search':
        if (parameters.query && onSearch) {
          onSearch(parameters.query);
        }
        break;
      case 'quality':
        if (parameters.quality && onQualityChange) {
          onQualityChange(parameters.quality);
        }
        break;
      case 'fullscreen':
        document.documentElement.requestFullscreen?.();
        break;
      case 'exit_fullscreen':
        document.exitFullscreen?.();
        break;
      default:
        onCommand && onCommand(action, parameters);
    }
  };

  const addToCommandHistory = (command, action, success) => {
    const historyItem = {
      id: Date.now(),
      command,
      action,
      success,
      timestamp: new Date().toISOString()
    };

    setCommandHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10 commands
  };

  const toggleVoiceEnabled = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isListening) {
      stopListening();
    }
  };

  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    return null; // Speech recognition not supported
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Voice Control */}
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/25' 
                : voiceEnabled
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                  : 'bg-gray-700'
            }`}>
              {isListening ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-semibold">Voice Commands</h3>
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400">
                {isListening 
                  ? 'Listening...' 
                  : isProcessing 
                    ? 'Processing...'
                    : voiceEnabled 
                      ? 'Click to speak'
                      : 'Voice disabled'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Voice Enable/Disable Toggle */}
            <button
              onClick={toggleVoiceEnabled}
              className={`p-2 rounded-lg transition-colors ${
                voiceEnabled ? 'text-green-400 hover:bg-green-400/20' : 'text-gray-500 hover:bg-gray-700'
              }`}
              title={voiceEnabled ? 'Disable Voice Commands' : 'Enable Voice Commands'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Main Voice Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!voiceEnabled || isProcessing}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : voiceEnabled
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isListening ? 'Stop' : isProcessing ? 'Processing...' : 'Speak'}
            </button>
          </div>
        </div>

        {/* Live Transcript */}
        {(transcript || lastCommand) && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600/30">
            <div className="flex items-start space-x-2">
              <Command className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-gray-300">
                  {isListening && transcript ? (
                    <span className="text-blue-400">{transcript}</span>
                  ) : lastCommand ? (
                    <span className="text-green-400">"{lastCommand}"</span>
                  ) : null}
                </div>
                {confidence > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Confidence: {Math.round(confidence * 100)}%
                  </div>
                )}
              </div>
              {isProcessing && (
                <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Commands */}
      <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
        <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
          <Command className="w-4 h-4" />
          <span>Quick Commands</span>
        </h4>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          {[
            '"Play"', '"Pause"', '"Volume up"', '"Volume down"',
            '"Go home"', '"Search for..."', '"4K quality"', '"Fullscreen"'
          ].map((cmd, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-2 text-center">
              <span className="text-gray-300">{cmd}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/20">
          <h4 className="text-white font-medium mb-3">Recent Commands</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {commandHistory.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">"{item.command}"</span>
                <div className={`w-2 h-2 rounded-full ${
                  item.success ? 'bg-green-400' : 'bg-red-400'
                }`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommand;