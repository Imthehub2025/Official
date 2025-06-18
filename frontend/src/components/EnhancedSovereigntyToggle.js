import React, { useState, useEffect } from 'react';
import { Shield, Server, Globe, Lock, Crown, Zap, Settings, Info, ChevronDown, ChevronUp } from 'lucide-react';
import SovereigntyActivation from './SovereigntyActivation';
import AIStatusIndicator from './AIStatusIndicator';

const EnhancedSovereigntyToggle = ({ 
  currentUser, 
  onToggle, 
  onOpenSettings 
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [sovereigntyData, setSovereigntyData] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    uptime: '99.9%',
    processed: '1,247',
    saved: '2.3GB'
  });

  useEffect(() => {
    if (currentUser) {
      loadSovereigntyStatus();
    }
  }, [currentUser]);

  const loadSovereigntyStatus = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/sovereignty/settings/${currentUser.id}`);
      
      if (response.ok) {
        const settings = await response.json();
        setIsEnabled(!!settings);
        setSovereigntyData(settings);
        setAiEnabled(settings?.external_api_usage || false);
      }
    } catch (error) {
      console.error('Error loading sovereignty status:', error);
    }
  };

  const handleToggle = async () => {
    if (!isEnabled) {
      setShowActivation(true);
      return;
    }

    // Disable sovereignty mode
    await toggleSovereigntyMode(false, null);
  };

  const handleActivationComplete = async (apiKey, activationData) => {
    setShowActivation(false);
    await toggleSovereigntyMode(true, apiKey, activationData);
  };

  const handleActivationCancel = () => {
    setShowActivation(false);
  };

  const toggleSovereigntyMode = async (enable, apiKey = null, activationData = null) => {
    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      if (enable) {
        const settings = {
          user_id: currentUser.id,
          decentralized_storage: true,
          p2p_sharing: true,
          local_ai_processing: true,
          external_api_usage: !!apiKey,
          content_source_preferences: apiKey ? ['local', 'p2p', 'api'] : ['local', 'p2p'],
          privacy_level: 'maximum',
          data_retention_days: 0,
          encryption_enabled: true,
          anonymous_mode: !apiKey
        };

        const payload = {
          user_id: currentUser.id,
          settings: settings
        };

        if (apiKey) {
          payload.openai_api_key = apiKey;
        }

        const response = await fetch(`${backendUrl}/api/sovereignty/enable`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          setIsEnabled(true);
          setSovereigntyData(settings);
          setAiEnabled(!!apiKey);
          onToggle && onToggle(true, settings, activationData);
        }
      } else {
        const response = await fetch(`${backendUrl}/api/sovereignty/disable`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: currentUser.id })
        });

        if (response.ok) {
          setIsEnabled(false);
          setSovereigntyData(null);
          setAiEnabled(false);
          onToggle && onToggle(false, null);
        }
      }
    } catch (error) {
      console.error('Error toggling sovereignty mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Toggle Card */}
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl border border-purple-500/30 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`relative p-3 rounded-xl transition-all duration-300 ${
                  isEnabled 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/25' 
                    : 'bg-gray-700'
                }`}>
                  {isEnabled ? (
                    <Crown className="w-7 h-7 text-white" />
                  ) : (
                    <Shield className="w-7 h-7 text-gray-300" />
                  )}
                  
                  {isEnabled && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Full Sovereignty Mode
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {isEnabled 
                      ? aiEnabled 
                        ? 'Complete autonomy with AI enhancement'
                        : 'Local processing and privacy protection'
                      : 'Standard streaming mode'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Status Indicator */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                  isEnabled 
                    ? 'bg-green-900/50 text-green-300 border border-green-500/30'
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`} />
                  <span>{isEnabled ? 'Active' : 'Inactive'}</span>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={handleToggle}
                  disabled={isLoading}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    isEnabled ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-600'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                      isEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  >
                    {isLoading && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Status Display */}
          {isEnabled && sovereigntyData && (
            <div className="p-6 border-t border-gray-700/50">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-3 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                  <Server className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-white font-medium text-sm">Local Processing</div>
                    <div className="text-purple-300 text-xs">Active</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
                  <Lock className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-medium text-sm">Encryption</div>
                    <div className="text-blue-300 text-xs">AES-256</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-900/20 rounded-lg border border-green-500/20">
                  <Globe className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium text-sm">P2P Network</div>
                    <div className="text-green-300 text-xs">Connected</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-white font-medium text-sm">AI Enhanced</div>
                    <div className="text-yellow-300 text-xs">{aiEnabled ? 'Enabled' : 'Local Only'}</div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{stats.uptime}</div>
                  <div className="text-gray-400 text-xs">Uptime</div>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{stats.processed}</div>
                  <div className="text-gray-400 text-xs">Content Processed</div>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{stats.saved}</div>
                  <div className="text-gray-400 text-xs">Storage Saved</div>
                </div>
              </div>

              {/* Expandable Details */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <span className="text-white font-medium text-sm">Advanced Settings</span>
                {showDetails ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showDetails && (
                <div className="mt-4 space-y-3 animate-slideDown">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Privacy Level:</span>
                        <span className="text-white">{sovereigntyData.privacy_level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Data Retention:</span>
                        <span className="text-white">{sovereigntyData.data_retention_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Anonymous Mode:</span>
                        <span className="text-white">{sovereigntyData.anonymous_mode ? 'On' : 'Off'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Decentralized Storage:</span>
                        <span className="text-green-300">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">P2P Sharing:</span>
                        <span className="text-green-300">Enabled</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Local AI:</span>
                        <span className="text-green-300">Running</span>
                      </div>
                    </div>
                  </div>
                  
                  {onOpenSettings && (
                    <button
                      onClick={onOpenSettings}
                      className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configure Settings</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Call to Action when disabled */}
          {!isEnabled && (
            <div className="p-6 border-t border-gray-700/50">
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">Unlock Full Sovereignty</h4>
                    <p className="text-gray-300 text-sm mb-3">
                      Enable complete control over your media experience with local processing, 
                      AI enhancement, and decentralized content discovery.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <Crown className="w-3 h-3 text-purple-400" />
                        <span className="text-gray-300">Full user control</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-3 h-3 text-blue-400" />
                        <span className="text-gray-300">Maximum privacy</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span className="text-gray-300">AI enhancement</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Globe className="w-3 h-3 text-green-400" />
                        <span className="text-gray-300">Decentralized content</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Status Indicator */}
        {isEnabled && (
          <AIStatusIndicator
            aiEnabled={aiEnabled}
            sovereigntyMode={isEnabled}
            onOpenSettings={onOpenSettings}
          />
        )}
      </div>

      {/* Sovereignty Activation Modal */}
      <SovereigntyActivation
        isVisible={showActivation}
        onComplete={handleActivationComplete}
        onCancel={handleActivationCancel}
        userProfile={currentUser}
      />

      <style jsx>{`
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default EnhancedSovereigntyToggle;