import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import localforage from 'localforage';
import { firebaseCloudMessaging } from '../utils/firebase';

export default function FirebaseConfigForm({ onConfigSaved }) {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
    vapidKey: '',
    serviceAccount: ''
  });

  const [isPasting, setIsPasting] = useState(false);
  const [token, setToken] = useState(null);
  const pasteAreaRef = useRef(null);

  // In this new iteration, we actually *do* accept the ServiceAccount key structure.
  // The user might paste Web Config OR Service Account. It's up to them.

  const looksLikeWebConfig = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    // Firebase Web App config typically contains these keys
    return (
      typeof obj.apiKey === 'string' ||
      typeof obj.authDomain === 'string' ||
      typeof obj.messagingSenderId === 'string' ||
      typeof obj.appId === 'string' ||
      typeof obj.projectId === 'string'
    );
  };

  useEffect(() => {
    loadSavedConfig();
  }, []);

  const loadSavedConfig = async () => {
    try {
      const savedConfig = await localforage.getItem('firebase_config');
      if (savedConfig) {
        setConfig(savedConfig);
      }
      const savedToken = await localforage.getItem('fcm_token');
      if (savedToken) {
        setToken(savedToken);
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
    }
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      toast.success('Token copied to clipboard!');
    }
  };

  const parsePastedConfig = (text) => {
    try {
      // Try to parse as JSON object first
      let parsed;
      try {
        parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        // Not valid JSON, continue with manual parsing
      }

      // Remove curly braces and clean up if it's a code block
      let cleaned = text
        .replace(/^[\s\S]*?\{/, '{') // Remove everything before first {
        .replace(/\}[\s\S]*$/, '}') // Remove everything after last }
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*/g, '') // Remove line comments
        .trim();

      // Try to parse as JSON again after cleaning
      try {
        parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        // Still not valid JSON, continue with manual parsing
      }

      // Manual parsing for key-value pairs
      // Remove curly braces
      cleaned = cleaned.replace(/[{}]/g, '').trim();

      // Split by comma, but be careful with quoted strings
      const pairs = [];
      let currentPair = '';
      let inQuotes = false;
      let quoteChar = '';

      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];

        if ((char === '"' || char === "'") && (i === 0 || cleaned[i - 1] !== '\\')) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
            quoteChar = '';
          }
        }

        if (char === ',' && !inQuotes) {
          if (currentPair.trim()) {
            pairs.push(currentPair.trim());
            currentPair = '';
          }
        } else {
          currentPair += char;
        }
      }

      if (currentPair.trim()) {
        pairs.push(currentPair.trim());
      }

      const configObj = {};
      pairs.forEach(pair => {
        const colonIndex = pair.indexOf(':');
        if (colonIndex > 0) {
          let key = pair.substring(0, colonIndex).trim();
          let value = pair.substring(colonIndex + 1).trim();

          // Remove quotes from key and value
          key = key.replace(/^["']|["']$/g, '');
          value = value.replace(/^["']|["']$/g, '');

          if (key && value) {
            configObj[key] = value;
          }
        }
      });

      return Object.keys(configObj).length > 0 ? configObj : null;
    } catch (error) {
      console.error('Error parsing config:', error);
      return null;
    }
  };

  const handlePaste = async (e) => {
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const pasteTarget = e.target;

    // Try to parse and decide if we should intercept this paste.
    const parsedConfig = parsePastedConfig(pastedText);

    // If it's not parseable or doesn't look like Firebase Web config, allow normal paste behavior.
    if (!parsedConfig) return;

    // Service account JSON has been shifted from "don't paste this here" 
    // to "paste it directly into the Service Account box".
    // Try to parse web config.
    if (!looksLikeWebConfig(parsedConfig)) {
      // Maybe they pasted service account JSON into the general drop field.
      if (parsedConfig && (parsedConfig.type === 'service_account' || 'private_key' in parsedConfig)) {
        if (pasteTarget && pasteTarget.name === 'serviceAccount') {
          // Handle normal paste for service account without web config check blocking it over
          return;
        }
        toast.info("Pasted JSON is a Service Account file. Please paste it into the 'Service Account JSON' field.");
        return;
      }
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    setIsPasting(true);

    setTimeout(() => {
      // Map the parsed config to our form fields
      const mappedConfig = {
        apiKey: parsedConfig.apiKey || '',
        authDomain: parsedConfig.authDomain || '',
        projectId: parsedConfig.projectId || '',
        storageBucket: parsedConfig.storageBucket || '',
        messagingSenderId: parsedConfig.messagingSenderId || '',
        appId: parsedConfig.appId || '',
        measurementId: parsedConfig.measurementId || '',
        vapidKey: config.vapidKey, // Keep existing VAPID key
        serviceAccount: config.serviceAccount // Keep existing Service Account
      };

      const hasAnyMappedValue = Object.entries(mappedConfig).some(
        ([key, value]) => key === 'vapidKey' ? false : Boolean(value)
      );

      if (hasAnyMappedValue) {
        setConfig(prev => ({ ...prev, ...mappedConfig }));
        toast.success('Configuration auto-filled from clipboard!');

        // Clear the paste area only if it was pasted in the textarea
        if (pasteTarget === pasteAreaRef.current && pasteAreaRef.current) {
          pasteAreaRef.current.value = '';
        }
      } else {
        toast.error('Could not find Firebase Web App config keys (apiKey/authDomain/...).');
      }

      setIsPasting(false);
    }, 100);
  };

  const handlePasteAreaClick = () => {
    pasteAreaRef.current?.focus();
    pasteAreaRef.current?.select();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId', 'vapidKey'];
    const missingFields = requiredFields.filter(field => !config[field]);

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      await localforage.setItem('firebase_config', config);
      toast.success('Firebase configuration saved successfully!');

      await localforage.removeItem('fcm_token');
      setToken(null);

      if (onConfigSaved) {
        onConfigSaved(config);
      }

      // Initialize token immediately after saving config
      try {
        const fcmToken = await firebaseCloudMessaging.init();
        if (fcmToken) {
          setToken(fcmToken);
        }
      } catch (err) {
        console.error('Error generating token on save:', err);
      }

      // Reload to ensure clean Firebase initialization with new config
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    }
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear the Firebase configuration?')) {
      try {
        await localforage.removeItem('firebase_config');
        await localforage.removeItem('fcm_token');
        setToken(null);
        setConfig({
          apiKey: '',
          authDomain: '',
          projectId: '',
          storageBucket: '',
          messagingSenderId: '',
          appId: '',
          measurementId: '',
          vapidKey: '',
          serviceAccount: ''
        });
        toast.success('Configuration cleared');
        window.location.reload();
      } catch (error) {
        console.error('Error clearing config:', error);
        toast.error('Failed to clear configuration');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-warning/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Firebase Configuration
          </h1>
          <p className="text-muted-foreground text-lg">
            Configure your Firebase project settings for push notifications
          </p>
        </div>

        {/* Token Display Area - Shown at top if token exists */}
        {token && (
          <div className="mb-8 bg-success/10 border-2 border-success/30 rounded-xl p-6 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-foreground flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Your FCM Token
              </h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={token}
                onClick={(e) => e.target.select()}
                className="flex-1 px-4 py-3 border-2 border-success/30 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm cursor-text select-all"
              />
              <button
                type="button"
                onClick={copyToken}
                className="px-6 py-3 bg-success text-success-foreground font-semibold rounded-lg hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200 flex items-center whitespace-nowrap"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Token
              </button>
            </div>
            <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/20">
              <p className="text-sm text-foreground">
                <strong>✓ Configuration Active!</strong> Use this token to send test notifications from Firebase Console → Cloud Messaging → Send test message.
              </p>
            </div>
          </div>
        )}

        {/* Paste Area */}
        <div className="mb-8">
          <div
            className="relative bg-card text-card-foreground rounded-xl shadow-lg border-2 border-dashed border-primary/40 p-6 hover:border-primary/60 transition-all duration-200"
          >
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-primary/70 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quick Paste
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste your Firebase config object anywhere (works in any field below too!)
              </p>
              <textarea
                ref={pasteAreaRef}
                onPaste={handlePaste}
                onClick={handlePasteAreaClick}
                placeholder="Paste your Firebase config here..."
                className="w-full h-24 px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 outline-none resize-none text-sm font-mono"
                style={{ minHeight: '60px' }}
              />
              {isPasting && (
                <div className="inline-flex items-center text-primary mt-2">
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border p-8">
          <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-6">
            {/* API Key */}
            <div>
              <label htmlFor="apiKey" className="block text-sm font-semibold text-foreground mb-2">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="apiKey"
                name="apiKey"
                value={config.apiKey}
                onChange={handleChange}
                onPaste={handlePaste}
                required
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 outline-none"
                placeholder="AIzaSy..."
              />
            </div>

            {/* Auth Domain */}
            <div>
              <label htmlFor="authDomain" className="block text-sm font-semibold text-foreground mb-2">
                Auth Domain <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="authDomain"
                name="authDomain"
                value={config.authDomain}
                onChange={handleChange}
                onPaste={handlePaste}
                required
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 outline-none"
                placeholder="your-project.firebaseapp.com"
              />
            </div>

            {/* Project ID */}
            <div>
              <label htmlFor="projectId" className="block text-sm font-semibold text-foreground mb-2">
                Project ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="projectId"
                name="projectId"
                value={config.projectId}
                onChange={handleChange}
                onPaste={handlePaste}
                required
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 outline-none"
                placeholder="your-project-id"
              />
            </div>

            {/* Storage Bucket */}
            <div>
              <label htmlFor="storageBucket" className="block text-sm font-semibold text-foreground mb-2">
                Storage Bucket
              </label>
              <input
                type="text"
                id="storageBucket"
                name="storageBucket"
                value={config.storageBucket}
                onChange={handleChange}
                onPaste={handlePaste}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 outline-none"
                placeholder="your-project.appspot.com"
              />
            </div>

            {/* Messaging Sender ID */}
            <div>
              <label htmlFor="messagingSenderId" className="block text-sm font-semibold text-foreground mb-2">
                Messaging Sender ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="messagingSenderId"
                name="messagingSenderId"
                value={config.messagingSenderId}
                onChange={handleChange}
                onPaste={handlePaste}
                required
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 outline-none"
                placeholder="123456789012"
              />
            </div>

            {/* App ID */}
            <div>
              <label htmlFor="appId" className="block text-sm font-semibold text-foreground mb-2">
                App ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="appId"
                name="appId"
                value={config.appId}
                onChange={handleChange}
                onPaste={handlePaste}
                required
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 outline-none"
                placeholder="1:123456789012:web:abc123"
              />
            </div>

            {/* Measurement ID */}
            <div>
              <label htmlFor="measurementId" className="block text-sm font-semibold text-foreground mb-2">
                Measurement ID <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                id="measurementId"
                name="measurementId"
                value={config.measurementId}
                onChange={handleChange}
                onPaste={handlePaste}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 outline-none"
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            {/* VAPID Key */}
            <div>
              <label htmlFor="vapidKey" className="block text-sm font-semibold text-foreground mb-2">
                VAPID Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="vapidKey"
                name="vapidKey"
                value={config.vapidKey}
                onChange={handleChange}
                onPaste={handlePaste}
                required
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 outline-none"
                placeholder="BK..."
              />
              <p className="mt-2 text-xs text-gray-500">
                Find this in Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
              </p>
            </div>

            {/* Service Account JSON */}
            <div>
              <label htmlFor="serviceAccount" className="block text-sm font-semibold text-foreground mb-2">
                Service Account JSON <span className="text-muted-foreground text-xs">(Required for Topics/Messages API)</span>
              </label>
              <textarea
                id="serviceAccount"
                name="serviceAccount"
                value={config.serviceAccount}
                onChange={handleChange}
                onPaste={handlePaste}
                className="w-full h-32 px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 outline-none text-sm font-mono"
                placeholder='{"type": "service_account", "project_id": "...", "private_key": "..."}'
              />
              <p className="mt-2 text-xs text-gray-500">
                Find this in Firebase Console → Project Settings → Service Accounts → Generate new private key. This is kept solely in your browser.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Save Configuration
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-3 bg-destructive text-destructive-foreground font-semibold rounded-lg hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Token Display Area - Moved below buttons */}
          {token && (
            <div className="mt-8 bg-success/10 border border-success/20 rounded-xl p-6 shadow-sm animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                FCM Token Generated
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={token}
                  className="flex-1 px-4 py-2 border border-success/30 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm cursor-text"
                />
                <button
                  type="button"
                  onClick={copyToken}
                  className="px-4 py-2 bg-success text-success-foreground font-semibold rounded-lg hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Use this token in the Firebase Console to send test notifications to this browser.
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-info/10 border border-info/20 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-info mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-1">Where to find these values:</p>
              <p>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-info">Firebase Console</a> → Project Settings → General → Your apps → Web app config</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
