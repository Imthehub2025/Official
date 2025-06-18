import React, { useState, useEffect } from 'react';
import { Shield, Server, Globe, Lock, Unlock, Settings, Crown, Zap } from 'lucide-react';

const SovereigntyModeToggle = ({ 
  currentUser, 
  onToggle, 
  onOpenSettings 
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sovereigntyData, setSovereigntyData] = useState(null);

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
      }
    } catch (error) {
      console.error('Error loading sovereignty status:', error);
    }
  };

  const handleToggle = async () => {
    if (!isEnabled) {
      setShowConfirmation(true);
      return;
    }

    // Disable sovereignty mode
    await toggleSovereigntyMode(false);
  };

  const confirmEnable = async () => {
    setShowConfirmation(false);
    await toggleSovereigntyMode(true);
  };

  const toggleSovereigntyMode = async (enable) => {
    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      if (enable) {
        // Enable with default settings
        const defaultSettings = {
          user_id: currentUser.id,
          decentralized_storage: true,
          p2p_sharing: true,
          local_ai_processing: true,
          external_api_usage: false,
          content_source_preferences: ['local', 'p2p'],
          privacy_level: 'maximum',
          data_retention_days: 0,
          encryption_enabled: true,
          anonymous_mode: true
        };

        const response = await fetch(`${backendUrl}/api/sovereignty/enable`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            settings: defaultSettings
          })
        });

        if (response.ok) {
          setIsEnabled(true);
          setSovereigntyData(defaultSettings);
          onToggle && onToggle(true, defaultSettings);
        }
      } else {
        // Disable sovereignty mode
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
    <div className="relative">
      {/* Main Toggle Button */}
      <div className="flex items-center space-x-3 bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
        <div className="flex items-center space-x-2">
          <div className={`relative p-2 rounded-lg transition-all duration-300 ${
            isEnabled 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/25' 
              : 'bg-gray-700'
          }`}>
            {isEnabled ? (
              <Crown className="w-5 h-5 text-white" />
            ) : (
              <Shield className="w-5 h-5 text-gray-300" />
            )}
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              Full Sovereignty Mode
            </span>
            <span className="text-xs text-gray-400">
              {isEnabled ? 'Complete autonomy & privacy' : 'Standard streaming mode'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full ${
            isEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
          }`} />
          
          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
              isEnabled ? 'bg-purple-600' : 'bg-gray-600'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>

          {/* Settings Button */}
          {isEnabled && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Sovereignty Settings"
            >
              <Settings className="w-4 h-4 text-gray-300" />
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Status Display */}
      {isEnabled && sovereigntyData && (
        <div className="mt-3 p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/20">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Server className="w-3 h-3 text-purple-400" />
              <span className="text-gray-300">Local Processing</span>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            </div>
            
            <div className="flex items-center space-x-2">
              <Lock className="w-3 h-3 text-blue-400" />
              <span className="text-gray-300">Encrypted Storage</span>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            </div>
            
            <div className="flex items-center space-x-2">
              <Globe className="w-3 h-3 text-green-400" />
              <span className="text-gray-300">P2P Network</span>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            </div>
            
            <div className="flex items-center space-x-2">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-gray-300">AI Enhanced</span>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Enable Full Sovereignty Mode
                </h3>
                <p className="text-sm text-gray-400">
                  Complete control & privacy
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                <span>Complete local content control</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <span>Decentralized content discovery</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span>Maximum privacy & encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                <span>Unrestricted content access</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                <span>Local AI processing</span>
              </div>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-100">
                  <p className="font-medium mb-1">Important Notice:</p>
                  <p>Sovereignty mode provides complete autonomy over your media experience. You take full responsibility for content accessed through this mode.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnable}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                {isLoading ? 'Enabling...' : 'Enable Sovereignty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SovereigntyModeToggle;