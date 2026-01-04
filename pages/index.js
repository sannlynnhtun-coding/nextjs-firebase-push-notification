import { useState, useEffect } from "react";
import PushNotificationLayout from "../components/PushNotificationLayout";
import Link from "next/link";
import localforage from "localforage";
import { toast } from "react-toastify";

export default function Home() {
  const [hasConfig, setHasConfig] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    checkConfig();
    loadToken();
  }, []);

  const checkConfig = async () => {
    try {
      const config = await localforage.getItem("firebase_config");
      setHasConfig(!!config);
    } catch (error) {
      console.error("Error checking config:", error);
    }
  };

  const loadToken = async () => {
    try {
      const fcmToken = await localforage.getItem("fcm_token");
      setToken(fcmToken);
    } catch (error) {
      console.error("Error loading token:", error);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard!");
  };

  return (
    <PushNotificationLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Firebase Push Notification Demo
            </h1>
            <p className="text-xl text-gray-600">
              Test and receive push notifications from Firebase Cloud Messaging
            </p>
          </div>

          {/* Configuration Status */}
          {!hasConfig && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-lg p-6 mb-8 animate-fade-in">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Configuration Required
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Please configure your Firebase settings to enable push notifications.
                  </p>
                  <Link href="/settings">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                      Go to Settings
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {hasConfig && (
            <div className="bg-green-50 border-l-4 border-green-400 rounded-lg shadow-lg p-6 mb-8 animate-fade-in">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Firebase Configured ✓
                  </h3>
                  <p className="text-green-700 mb-4">
                    Your Firebase configuration is set up. You can now receive push notifications.
                  </p>
                  
                  {token ? (
                    <div className="bg-white rounded-lg p-5 mt-4 border-2 border-green-300 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-base font-bold text-gray-900 flex items-center">
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Your FCM Token
                        </p>
                      </div>
                      <div
                        onClick={copyToken}
                        className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-green-200 rounded-lg p-4 cursor-pointer hover:from-gray-100 hover:to-blue-100 transition-all duration-200 group shadow-sm"
                        title="Click to copy"
                      >
                        <code className="text-sm text-gray-800 break-all block font-mono leading-relaxed">
                          {token}
                        </code>
                      </div>
                      <div className="mt-4 flex items-start bg-green-50 rounded-lg p-3 border border-green-200">
                        <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-green-800">
                          <strong>Click the token above to copy it.</strong> Use this in Firebase Console → Cloud Messaging → Send test message.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 rounded-lg p-4 mt-4 border border-yellow-300">
                      <p className="text-sm text-yellow-800 flex items-start">
                        <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>
                          <strong>FCM Token not generated yet.</strong> Please refresh the page or check the <Link href="/settings" className="underline font-semibold">Settings page</Link> to view your token.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Test Push Notifications
            </h2>
            <ol className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">1</span>
                <span>Configure Firebase settings in the <Link href="/settings" className="text-blue-600 hover:text-blue-800 underline font-medium">Settings</Link> page</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">2</span>
                <span>Copy your FCM token (shown above after configuration)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">3</span>
                <span>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">Firebase Console</a></span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">4</span>
                <span>Navigate to <strong>Cloud Messaging</strong> → <strong>Send test message</strong></span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">5</span>
                <span>Paste your FCM token and send a test notification</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold mr-3">✓</span>
                <span className="font-semibold">You should receive the notification in this app!</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/settings">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Settings
              </button>
            </Link>
          </div>
        </div>
      </div>
    </PushNotificationLayout>
  );
}
