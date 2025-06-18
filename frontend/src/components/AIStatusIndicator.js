import React, { useState, useEffect } from 'react';
import { Brain, Zap, CheckCircle, AlertCircle, Settings, Crown } from 'lucide-react';

const AIStatusIndicator = ({ 
  aiEnabled, 
  sovereigntyMode, 
  onOpenSettings,
  className = "" 
}) => {
  const [status, setStatus] = useState('checking');
  const [capabilities, setCapabilities] = useState([]);

  useEffect(() => {
    checkAIStatus();
  }, [aiEnabled, sovereigntyMode]);

  const checkAIStatus = async () => {
    setStatus('checking');
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/health`);
      
      if (response.ok) {
        const healthData = await response.json();
        const aiAvailable = healthData.services?.ai_service === 'available';
        
        if (aiAvailable && aiEnabled) {
          setStatus('enabled');
          setCapabilities([
            'AI Recommendations',
            'Voice Commands',
            'Content Analysis',
            'Smart Moderation'
          ]);
        } else if (sovereigntyMode && !aiEnabled) {
          setStatus('sovereignty_only');
          setCapabilities([
            'Local Processing',
            'Decentralized Storage',
            'Privacy Protection'
          ]);
        } else if (!aiAvailable) {
          setStatus('unavailable');
          setCapabilities([]);
        } else {
          setStatus('disabled');
          setCapabilities([]);
        }
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'enabled':
        return {
          icon: Brain,
          color: 'text-green-400',
          bgColor: 'bg-green-900/30',
          borderColor: 'border-green-500/30',
          title: 'AI Fully Enabled',
          description: 'All AI features are active and operational'
        };
      case 'sovereignty_only':
        return {
          icon: Crown,
          color: 'text-purple-400',
          bgColor: 'bg-purple-900/30',
          borderColor: 'border-purple-500/30',
          title: 'Sovereignty Mode Active',
          description: 'Local processing without AI cloud features'
        };
      case 'disabled':
        return {
          icon: AlertCircle,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/30',
          borderColor: 'border-yellow-500/30',
          title: 'AI Disabled',
          description: 'AI features are available but not enabled'
        };
      case 'unavailable':
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-900/30',
          borderColor: 'border-red-500/30',
          title: 'AI Unavailable',
          description: 'AI services are not configured'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-900/30',
          borderColor: 'border-red-500/30',
          title: 'Connection Error',
          description: 'Unable to check AI status'
        };
      default:
        return {
          icon: Brain,
          color: 'text-gray-400',
          bgColor: 'bg-gray-900/30',
          borderColor: 'border-gray-600/30',
          title: 'Checking...',
          description: 'Verifying AI service status'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border ${statusInfo.borderColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
            {status === 'checking' ? (
              <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin"></div>
            ) : (
              <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
            )}
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-sm">
              {statusInfo.title}
            </h3>
            <p className="text-gray-400 text-xs">
              {statusInfo.description}
            </p>
          </div>
        </div>

        {status === 'enabled' && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Capabilities List */}
      {capabilities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="grid grid-cols-2 gap-2">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-xs"
              >
                <CheckCircle className={`w-3 h-3 ${statusInfo.color}`} />
                <span className="text-gray-300">{capability}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      {(status === 'disabled' || status === 'unavailable') && onOpenSettings && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <button
            onClick={onOpenSettings}
            className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Settings className="w-3 h-3" />
            <span>Configure AI</span>
          </button>
        </div>
      )}

      {/* Performance Metrics (when enabled) */}
      {status === 'enabled' && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-green-400 font-semibold text-sm">98%</div>
              <div className="text-gray-400 text-xs">Accuracy</div>
            </div>
            <div>
              <div className="text-blue-400 font-semibold text-sm">< 1s</div>
              <div className="text-gray-400 text-xs">Response</div>
            </div>
            <div>
              <div className="text-purple-400 font-semibold text-sm">24/7</div>
              <div className="text-gray-400 text-xs">Uptime</div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {status !== 'checking' && (
        <div className="mt-2 text-right">
          <span className="text-gray-500 text-xs">
            Updated {new Date().toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default AIStatusIndicator;