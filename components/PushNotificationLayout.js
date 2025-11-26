import React, { useEffect, useState } from "react";
import { onMessage } from "firebase/messaging";
import { firebaseCloudMessaging } from "../utils/firebase";
import { ToastContainer, toast } from "react-toastify";
import { useRouter } from "next/router";
import Link from "next/link";

function PushNotificationLayout({ children }) {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    checkConfigAndInit();
  }, []);

  const sendConfigToServiceWorker = async (config) => {
    if ("serviceWorker" in navigator) {
      try {
        // Wait for service worker to be ready (next-offline handles registration)
        const registration = await navigator.serviceWorker.ready;
        
        // Send config to service worker
        if (registration.active) {
          registration.active.postMessage({
            type: "FIREBASE_CONFIG",
            config: config,
          });
          console.log("Firebase config sent to service worker");
        } else {
          // If service worker is installing, wait for it to activate
          const sw = registration.installing || registration.waiting;
          if (sw) {
            sw.addEventListener('statechange', (e) => {
              if (e.target.state === 'activated' && registration.active) {
                registration.active.postMessage({
                  type: "FIREBASE_CONFIG",
                  config: config,
                });
                console.log("Firebase config sent to service worker");
              }
            });
          }
        }
      } catch (error) {
        console.error("Error sending config to service worker:", error);
        // Service worker will try to load config from IndexedDB as fallback
      }
    }
  };

  const checkConfigAndInit = async () => {
    try {
      const localforage = (await import("localforage")).default;
      const config = await localforage.getItem("firebase_config");
      
      if (!config) {
        setHasConfig(false);
        // Only show toast if not on settings page to avoid annoyance
        if (router.pathname !== '/settings') {
          toast(
            <div>
              <h5>Firebase Configuration Required</h5>
              <h6>Please configure Firebase in <Link href="/settings" style={{color: '#0070f3', textDecoration: 'underline'}}>Settings</Link></h6>
            </div>,
            {
              closeOnClick: false,
              autoClose: false,
            }
          );
        }
        return;
      }

      setHasConfig(true);
      
      // Send config to service worker
      await sendConfigToServiceWorker(config);
      
      await initializeToken();

      // Event listener that listens for the push notification event in the background
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          console.log("event for the service worker", event);
          if (event.data && event.data.firebaseMessaging) {
            const message = event.data.firebaseMessaging.payload;
            toast(
              <div onClick={() => handleClickPushNotification(message?.data?.url)}>
                <h5>{message?.notification?.title}</h5>
                <h6>{message?.notification?.body}</h6>
              </div>,
              {
                closeOnClick: false,
              }
            );
          }
        });
      }
    } catch (error) {
      console.error("Error initializing:", error);
    }
  };

  // Calls the getMessage() function if the token is there
  async function initializeToken() {
    try {
      const fcmToken = await firebaseCloudMessaging.init();
      if (fcmToken) {
        console.log("FCM Token:", fcmToken);
        setToken(fcmToken);

        getMessage();

        // Optional: toast the token (keeping existing behavior but maybe making it less intrusive if we have it in UI now)
        // toast(
        //   <div onClick={() => {copiedMessageToast(fcmToken)}} style={{cursor: 'pointer'}}>
        //     <h5>FCM Token (Click to Copy)</h5>
        //     <h6 style={{fontSize: '12px', wordBreak: 'break-all'}}>{fcmToken}</h6>
        //   </div>,
        //   {
        //     closeOnClick: false,
        //     autoClose: 10000,
        //   }
        // );
      }
    } catch (error) {
      console.error("Error getting token:", error);
      toast.error("Failed to get FCM token. Please check your Firebase configuration.");
    }
  }

  function copiedMessageToast(token){
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard!");
  }

  // Handles the click function on the toast showing push notification
  const handleClickPushNotification = (url) => {
    if (url) {
      router.push(url);
    }
  };

  // Get the push notification message and triggers a toast to show it
  function getMessage() {
    const messaging = firebaseCloudMessaging.getMessaging();
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("Message received:", payload);
        toast(
          <div onClick={() => handleClickPushNotification(payload?.data?.url)}>
            <h5>{payload?.notification?.title}</h5>
            <h6>{payload?.notification?.body}</h6>
          </div>,
          {
            closeOnClick: false,
          }
        );
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-blue-600">PushDemo</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${router.pathname === '/' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                  Home
                </Link>
                <Link href="/settings" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${router.pathname === '/settings' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                  Settings
                </Link>
              </div>
            </div>
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <div className="space-x-4">
                <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
                <Link href="/settings" className="text-gray-500 hover:text-gray-700">Settings</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-grow">
        <ToastContainer />
        {children}
      </main>
    </div>
  );
}

export default PushNotificationLayout;
