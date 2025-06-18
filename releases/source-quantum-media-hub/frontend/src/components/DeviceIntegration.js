import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Bluetooth, 
  Cast, 
  Eye, 
  Headphones,
  Tv,
  Monitor,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Glasses,
  Hand,
  Mic,
  Radio,
  ScreenShare,
  Airplay
} from 'lucide-react';
import { 
  xrService, 
  bluetoothService, 
  mirrorService, 
  pwaService,
  gestureService 
} from '../services/deviceService';

// Device Integration Dashboard
export const DeviceIntegration = ({ isOpen, onClose, currentVideo }) => {
  const [xrSupport, setXrSupport] = useState(null);
  const [bluetoothDevices, setBluetoothDevices] = useState([]);
  const [castingDevices, setCastingDevices] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('xr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      initializeDeviceSupport();
    }
  }, [isOpen]);

  const initializeDeviceSupport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check XR support
      const xrResult = await xrService.checkXRSupport();
      setXrSupport(xrResult);

      // Detect casting devices
      const castDevices = await mirrorService.detectCastingDevices();
      setCastingDevices(castDevices);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'xr', label: 'XR/VR', icon: Glasses, count: xrSupport?.modes ? Object.keys(xrSupport.modes).length : 0 },
    { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth, count: bluetoothDevices.length },
    { id: 'casting', label: 'Screen Mirror', icon: Cast, count: castingDevices.length },
    { id: 'pwa', label: 'App Features', icon: Smartphone, count: 4 }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gray-900/90 backdrop-blur-md border-b border-gray-700 p-4"
          >
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Device Integration</h1>
                <p className="text-gray-400">Connect XR headsets, Bluetooth devices, and enable screen mirroring</p>
              </div>
              <motion.button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto mt-6">
              <div className="flex space-x-6 overflow-x-auto pb-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className="bg-gray-600 text-xs px-2 py-1 rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto p-6">
              {loading ? (
                <div className="text-center py-16">
                  <Loader size={48} className="text-purple-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-400">Detecting devices...</p>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                  <p className="text-red-400 mb-4">{error}</p>
                  <motion.button
                    onClick={initializeDeviceSupport}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Retry
                  </motion.button>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === 'xr' && (
                      <XRSection 
                        xrSupport={xrSupport} 
                        currentVideo={currentVideo}
                        connectedDevices={connectedDevices}
                        setConnectedDevices={setConnectedDevices}
                      />
                    )}
                    {activeTab === 'bluetooth' && (
                      <BluetoothSection 
                        devices={bluetoothDevices}
                        setDevices={setBluetoothDevices}
                        connectedDevices={connectedDevices}
                        setConnectedDevices={setConnectedDevices}
                      />
                    )}
                    {activeTab === 'casting' && (
                      <CastingSection 
                        devices={castingDevices}
                        currentVideo={currentVideo}
                        connectedDevices={connectedDevices}
                        setConnectedDevices={setConnectedDevices}
                      />
                    )}
                    {activeTab === 'pwa' && (
                      <PWASection 
                        connectedDevices={connectedDevices}
                        setConnectedDevices={setConnectedDevices}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// XR/VR Section Component
export const XRSection = ({ xrSupport, currentVideo, connectedDevices, setConnectedDevices }) => {
  const [xrSession, setXrSession] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    if (xrSupport?.supported) {
      const info = xrService.getXRDeviceInfo();
      setDeviceInfo(info);
    }
  }, [xrSupport]);

  const startXRSession = async (mode) => {
    try {
      const result = await xrService.startXRSession(mode);
      if (result.success) {
        setXrSession(result.session);
        setConnectedDevices(prev => [...prev, {
          id: 'xr-headset',
          name: deviceInfo?.device || 'XR Headset',
          type: 'XR',
          status: 'connected'
        }]);
      }
    } catch (error) {
      console.error('XR session error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* XR Support Status */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Glasses className="text-purple-500" />
          <span>XR/VR Support</span>
        </h3>
        
        {xrSupport?.supported ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle size={20} />
              <span>WebXR is supported on this device</span>
            </div>
            
            {deviceInfo && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Detected Device</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Device:</span>
                    <span className="text-white ml-2">{deviceInfo.device}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Platform:</span>
                    <span className="text-white ml-2">{deviceInfo.platform}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-gray-400">Features:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {deviceInfo.features.map((feature, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* XR Modes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(xrSupport.modes).map(([mode, supported]) => (
                <motion.div
                  key={mode}
                  className={`p-4 rounded-lg border-2 ${
                    supported 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-red-500 bg-red-500/10'
                  }`}
                  whileHover={{ scale: supported ? 1.05 : 1 }}
                >
                  <h4 className="text-white font-semibold mb-2 capitalize">
                    {mode.replace('-', ' ')}
                  </h4>
                  <div className={`flex items-center space-x-2 mb-3 ${
                    supported ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {supported ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span className="text-sm">
                      {supported ? 'Supported' : 'Not Available'}
                    </span>
                  </div>
                  {supported && (
                    <motion.button
                      onClick={() => startXRSession(mode)}
                      disabled={!!xrSession}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 rounded transition-colors text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {xrSession ? 'Session Active' : 'Start Session'}
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle size={20} />
            <span>{xrSupport?.reason || 'WebXR not supported on this device'}</span>
          </div>
        )}
      </div>

      {/* XR Controls */}
      {xrSession && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Eye className="text-green-500" />
            <span>XR Session Active</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.button
              className="flex flex-col items-center space-y-2 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Hand size={24} className="text-purple-400" />
              <span className="text-white text-sm">Hand Tracking</span>
            </motion.button>

            <motion.button
              className="flex flex-col items-center space-y-2 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Mic size={24} className="text-blue-400" />
              <span className="text-white text-sm">Voice Control</span>
            </motion.button>

            <motion.button
              className="flex flex-col items-center space-y-2 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye size={24} className="text-green-400" />
              <span className="text-white text-sm">Eye Tracking</span>
            </motion.button>

            <motion.button
              onClick={() => {
                setXrSession(null);
                setConnectedDevices(prev => prev.filter(d => d.id !== 'xr-headset'));
              }}
              className="flex flex-col items-center space-y-2 p-4 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={24} className="text-white" />
              <span className="text-white text-sm">Exit XR</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Bluetooth Section Component
export const BluetoothSection = ({ devices, setDevices, connectedDevices, setConnectedDevices }) => {
  const [scanning, setScanning] = useState(false);

  const scanForDevices = async () => {
    setScanning(true);
    try {
      const result = await bluetoothService.scanForDevices();
      if (result.success) {
        setDevices(prev => [...prev, result.device]);
      }
    } catch (error) {
      console.error('Bluetooth scan error:', error);
    } finally {
      setScanning(false);
    }
  };

  const connectToRemote = async () => {
    try {
      const result = await bluetoothService.connectToRemote();
      if (result.success) {
        setConnectedDevices(prev => [...prev, {
          id: 'bluetooth-remote',
          name: result.device.name || 'Bluetooth Remote',
          type: 'Remote',
          status: 'connected'
        }]);
      }
    } catch (error) {
      console.error('Remote connection error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bluetooth Support */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Bluetooth className="text-blue-500" />
          <span>Bluetooth Devices</span>
        </h3>

        {bluetoothService.isBluetoothSupported() ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle size={20} />
                <span>Web Bluetooth is supported</span>
              </div>
              <div className="flex space-x-2">
                <motion.button
                  onClick={scanForDevices}
                  disabled={scanning}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  whileHover={{ scale: scanning ? 1 : 1.05 }}
                  whileTap={{ scale: scanning ? 1 : 0.95 }}
                >
                  {scanning ? 'Scanning...' : 'Scan Devices'}
                </motion.button>
                <motion.button
                  onClick={connectToRemote}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Connect Remote
                </motion.button>
              </div>
            </div>

            {/* Device Types */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Samsung Remote', icon: Tv, color: 'blue' },
                { name: 'Apple TV Remote', icon: Monitor, color: 'gray' },
                { name: 'Gaming Controller', icon: Radio, color: 'green' },
                { name: 'Smart Speaker', icon: Volume2, color: 'purple' }
              ].map((deviceType, index) => {
                const Icon = deviceType.icon;
                return (
                  <motion.div
                    key={index}
                    className={`p-4 bg-gray-700 rounded-lg border border-${deviceType.color}-500/30 hover:border-${deviceType.color}-500/60 transition-colors cursor-pointer`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={32} className={`text-${deviceType.color}-400 mx-auto mb-2`} />
                    <p className="text-white text-sm text-center">{deviceType.name}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle size={20} />
            <span>Web Bluetooth not supported on this device</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Casting Section Component
export const CastingSection = ({ devices, currentVideo, connectedDevices, setConnectedDevices }) => {
  const [casting, setCasting] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

  const startScreenShare = async () => {
    try {
      const result = await mirrorService.startScreenCapture();
      if (result.success) {
        setScreenStream(result.stream);
      }
    } catch (error) {
      console.error('Screen share error:', error);
    }
  };

  const castToDevice = async (deviceType) => {
    setCasting(true);
    try {
      const result = await mirrorService.castToDevice(screenStream, deviceType);
      if (result.success) {
        setConnectedDevices(prev => [...prev, {
          id: `cast-${deviceType}`,
          name: result.platform,
          type: 'Cast',
          status: 'connected'
        }]);
      }
    } catch (error) {
      console.error('Casting error:', error);
    } finally {
      setCasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Screen Mirroring */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Cast className="text-green-500" />
          <span>Screen Mirroring & Casting</span>
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle size={20} />
              <span>Screen sharing supported</span>
            </div>
            <motion.button
              onClick={startScreenShare}
              disabled={!!screenStream}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              whileHover={{ scale: screenStream ? 1 : 1.05 }}
              whileTap={{ scale: screenStream ? 1 : 0.95 }}
            >
              {screenStream ? 'Screen Shared' : 'Start Screen Share'}
            </motion.button>
          </div>

          {/* Available Casting Devices */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {devices.map((device, index) => {
              const getIcon = (type) => {
                switch (type) {
                  case 'chromecast': return Cast;
                  case 'airplay': return Airplay;
                  case 'samsung': return Tv;
                  case 'miracast': return Screen;
                  default: return Monitor;
                }
              };

              const Icon = getIcon(device.type);
              return (
                <motion.div
                  key={index}
                  onClick={() => screenStream && castToDevice(device.type)}
                  className={`p-4 rounded-lg border-2 cursor-pointer ${
                    device.available && screenStream
                      ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20'
                      : 'border-gray-600 bg-gray-700/50'
                  }`}
                  whileHover={{ scale: device.available && screenStream ? 1.05 : 1 }}
                  whileTap={{ scale: device.available && screenStream ? 0.95 : 1 }}
                >
                  <Icon size={32} className={`mx-auto mb-2 ${
                    device.available ? 'text-green-400' : 'text-gray-500'
                  }`} />
                  <p className="text-white text-sm text-center">{device.name}</p>
                  <p className={`text-xs text-center mt-1 ${
                    device.available ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {device.available ? 'Available' : 'Not Available'}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// PWA Section Component
export const PWASection = ({ connectedDevices, setConnectedDevices }) => {
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const installPWA = async () => {
    const result = await pwaService.installPWA();
    if (result.success) {
      setPwaInstalled(true);
    }
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      pwaService.enableFullscreen();
    } else {
      document.exitFullscreen();
    }
    setFullscreen(!fullscreen);
  };

  return (
    <div className="space-y-6">
      {/* PWA Features */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Smartphone className="text-purple-500" />
          <span>Progressive Web App Features</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.button
            onClick={installPWA}
            disabled={pwaInstalled}
            className="flex flex-col items-center space-y-2 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:bg-gray-800 transition-colors"
            whileHover={{ scale: pwaInstalled ? 1 : 1.05 }}
            whileTap={{ scale: pwaInstalled ? 1 : 0.95 }}
          >
            <Smartphone size={24} className="text-purple-400" />
            <span className="text-white text-sm">Install App</span>
            <span className={`text-xs ${pwaInstalled ? 'text-green-400' : 'text-gray-400'}`}>
              {pwaInstalled ? 'Installed' : 'Available'}
            </span>
          </motion.button>

          <motion.button
            onClick={toggleFullscreen}
            className="flex flex-col items-center space-y-2 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Monitor size={24} className="text-blue-400" />
            <span className="text-white text-sm">Fullscreen</span>
            <span className="text-xs text-gray-400">
              {fullscreen ? 'Exit' : 'Enter'}
            </span>
          </motion.button>

          <motion.button
            onClick={() => pwaService.setOrientation('landscape')}
            className="flex flex-col items-center space-y-2 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Radio size={24} className="text-green-400" />
            <span className="text-white text-sm">Orientation</span>
            <span className="text-xs text-gray-400">Landscape</span>
          </motion.button>

          <motion.button
            className="flex flex-col items-center space-y-2 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings size={24} className="text-orange-400" />
            <span className="text-white text-sm">Settings</span>
            <span className="text-xs text-gray-400">Configure</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};