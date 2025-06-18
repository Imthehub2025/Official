import React, { useState, useEffect } from 'react';
import { Crown, Shield, Brain, Zap, Lock, Key, Eye, EyeOff, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

const SovereigntyActivation = ({ 
  isVisible, 
  onComplete, 
  onCancel, 
  userProfile 
}) => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [activationProgress, setActivationProgress] = useState(0);
  const [isActivating, setIsActivating] = useState(false);

  const sovereigntyFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Recommendations",
      description: "GPT-4o personalized content discovery",
      color: "text-purple-400"
    },
    {
      icon: Zap,
      title: "Natural Language Voice Commands",
      description: "Advanced speech recognition and processing",
      color: "text-blue-400"
    },
    {
      icon: Shield,
      title: "Smart Content Moderation",
      description: "Toggle-able AI content filtering",
      color: "text-green-400"
    },
    {
      icon: Sparkles,
      title: "Enhanced Metadata Processing",
      description: "Automatic content analysis and tagging",
      color: "text-yellow-400"
    }
  ];

  useEffect(() => {
    if (isVisible) {
      setStep(1);
      setApiKey('');
      setValidationError('');
      setActivationProgress(0);
    }
  }, [isVisible]);

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationError('Please enter your OpenAI API key');
      return false;
    }

    if (!apiKey.startsWith('sk-')) {
      setValidationError('Invalid API key format. OpenAI keys start with "sk-"');
      return false;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      // Test the API key with a simple request
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsValidating(false);
        return true;
      } else {
        setValidationError('Invalid API key. Please check your key and try again.');
        setIsValidating(false);
        return false;
      }
    } catch (error) {
      setValidationError('Unable to validate API key. Please check your connection.');
      setIsValidating(false);
      return false;
    }
  };

  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateApiKey();
    if (isValid) {
      setStep(2);
      startActivation();
    }
  };

  const startActivation = async () => {
    setIsActivating(true);
    
    // Simulate activation process with progress updates
    const steps = [
      { message: "Initializing sovereignty protocols...", progress: 20 },
      { message: "Connecting to AI services...", progress: 40 },
      { message: "Configuring local processing...", progress: 60 },
      { message: "Enabling decentralized features...", progress: 80 },
      { message: "Sovereignty mode activated!", progress: 100 }
    ];

    for (const stepInfo of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setActivationProgress(stepInfo.progress);
    }

    // Save API key and complete activation
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Store API key in backend
      await fetch(`${backendUrl}/api/sovereignty/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userProfile?.id || 'default_user',
          settings: {
            user_id: userProfile?.id || 'default_user',
            decentralized_storage: true,
            p2p_sharing: true,
            local_ai_processing: true,
            external_api_usage: true,
            content_source_preferences: ['local', 'p2p', 'api'],
            privacy_level: 'maximum',
            data_retention_days: 0,
            encryption_enabled: true,
            anonymous_mode: false
          },
          openai_api_key: apiKey
        })
      });

      // Complete activation
      setTimeout(() => {
        onComplete(apiKey, {
          ai_enabled: true,
          sovereignty_mode: true,
          features_unlocked: sovereigntyFeatures.length
        });
      }, 1500);

    } catch (error) {
      console.error('Error activating sovereignty mode:', error);
      setValidationError('Failed to activate sovereignty mode. Please try again.');
      setIsActivating(false);
    }
  };

  const handleSkip = () => {
    // Enable sovereignty mode without AI features
    onComplete(null, {
      ai_enabled: false,
      sovereignty_mode: true,
      features_unlocked: 0
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full border border-purple-500/30 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="relative p-8 pb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Enable Full Sovereignty Mode
                </h2>
                <p className="text-gray-300">
                  Unlock AI-powered features for the ultimate streaming experience
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {step === 1 && (
            <div className="space-y-6 animate-slideIn">
              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {sovereigntyFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-gray-700/50`}>
                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-sm mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-gray-400 text-xs">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* API Key Input */}
              <form onSubmit={handleApiKeySubmit} className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-3">
                    <Key className="w-4 h-4 inline mr-2" />
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12"
                      disabled={isValidating}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {validationError && (
                    <div className="flex items-center space-x-2 mt-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{validationError}</span>
                    </div>
                  )}
                </div>

                {/* Help Text */}
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Brain className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-100">
                      <p className="font-medium mb-1">Get your OpenAI API key:</p>
                      <p>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">platform.openai.com/api-keys</a> to create your API key. This enables AI-powered recommendations, voice commands, and content analysis.</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isValidating || !apiKey.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isValidating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Activate AI Features</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Skip AI Features
                  </button>
                  
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-6 py-8 animate-slideIn">
              {/* Activation Animation */}
              <div className="relative mx-auto w-32 h-32 mb-8">
                <div className="absolute inset-0 border-4 border-purple-600/30 rounded-full"></div>
                <div 
                  className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"
                  style={{ borderTopColor: activationProgress > 50 ? '#10b981' : '#8b5cf6' }}
                ></div>
                <div className="absolute inset-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  {activationProgress === 100 ? (
                    <CheckCircle className="w-12 h-12 text-white" />
                  ) : (
                    <Crown className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-4">
                <div className="text-2xl font-bold text-white">
                  {activationProgress === 100 ? 'Sovereignty Mode Activated!' : 'Activating Sovereignty Mode...'}
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${activationProgress}%` }}
                  ></div>
                </div>
                
                <div className="text-gray-300">
                  {activationProgress}% Complete
                </div>
              </div>

              {/* Features Being Unlocked */}
              <div className="space-y-3">
                {sovereigntyFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-500 ${
                      activationProgress > (index + 1) * 20 
                        ? 'bg-green-900/30 border border-green-500/30' 
                        : 'bg-gray-800/30 border border-gray-600/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activationProgress > (index + 1) * 20 
                        ? 'bg-green-600' 
                        : 'bg-gray-600'
                    }`}>
                      {activationProgress > (index + 1) * 20 ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <feature.icon className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className={`font-medium ${
                      activationProgress > (index + 1) * 20 
                        ? 'text-green-300' 
                        : 'text-gray-400'
                    }`}>
                      {feature.title}
                    </span>
                    {activationProgress > (index + 1) * 20 && (
                      <span className="text-green-300 text-sm ml-auto">✓ Enabled</span>
                    )}
                  </div>
                ))}
              </div>

              {activationProgress === 100 && (
                <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-500/30 animate-pulse">
                  <div className="flex items-center justify-center space-x-2 text-purple-300">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-lg font-medium">Full AI capabilities unlocked!</span>
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SovereigntyActivation;