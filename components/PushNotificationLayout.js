import React, { useEffect, useState } from "react";
import { onMessage } from "firebase/messaging";
import { firebaseCloudMessaging } from "../utils/firebase";
import { ToastContainer, toast } from "react-toastify";
import { useRouter } from "next/router";
import Link from "next/link";

function PushNotificationLayout({ children, onNotificationReceived }) {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [hasConfig, setHasConfig] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    checkConfigAndInit();
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("theme");
      const root = document.documentElement;

      if (stored === "light") root.classList.remove("dark");
      else root.classList.add("dark");

      setIsDark(root.classList.contains("dark"));
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextIsDark);
    setIsDark(nextIsDark);

    try {
      window.localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    } catch {
      // ignore
    }
  };

  const sendConfigToServiceWorker = async (config) => {
    if ("serviceWorker" in navigator) {
      try {
        // Register service worker explicitly
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // Wait for service worker to be ready
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
      }
    }
  };

  const checkConfigAndInit = async () => {
    try {
      const localforage = (await import("localforage")).default;
      const config = await localforage.getItem("firebase_config");

      if (!config) {
        setHasConfig(false);
        if (router.pathname !== '/settings') {
          toast(
            <div>
              <h5>Firebase Configuration Required</h5>
              <h6>Please configure Firebase in <Link href="/settings" style={{ color: '#0070f3', textDecoration: 'underline' }}>Settings</Link></h6>
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
      await sendConfigToServiceWorker(config);
      await initializeToken();

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.firebaseMessaging) {
            const message = event.data.firebaseMessaging.payload;
            saveMessageToHistory(message, "Background");
            if (onNotificationReceived) onNotificationReceived(message);
            toast(
              <CustomToast
                title={message?.notification?.title}
                body={message?.notification?.body}
                url={message?.data?.url}
                icon={message?.notification?.icon}
                type="Background"
              />,
              {
                closeOnClick: false,
                className: "rounded-xl shadow-2xl border border-gray-100",
                bodyClassName: "p-0",
              }
            );
          }
        });
      }
    } catch (error) {
      console.error("Error initializing:", error);
    }
  };

  async function initializeToken() {
    try {
      const fcmToken = await firebaseCloudMessaging.init();
      if (fcmToken) {
        setToken(fcmToken);
        getMessage();
      }
    } catch (error) {
      console.error("Error getting token:", error);
      toast.error("Failed to get FCM token. Please check your Firebase configuration.");
    }
  }

  const handleClickPushNotification = (url) => {
    if (url) {
      router.push(url);
    }
  };

  const saveMessageToHistory = async (message, type = "Foreground") => {
    try {
      const localforage = (await import("localforage")).default;
      const history = (await localforage.getItem("notification_history")) || [];

      const newMessage = {
        id: Date.now(),
        title: message?.notification?.title || "No Title",
        body: message?.notification?.body || "No Body",
        data: message?.data || {},
        timestamp: new Date().toISOString(),
        receivedAt: type
      };

      await localforage.setItem("notification_history", [newMessage, ...history].slice(0, 50));
      console.log(`Message saved to history (${type})`);
    } catch (error) {
      console.error("Error saving message to history:", error);
    }
  };

  const CustomToast = ({ title, body, url, icon, type }) => (
    <div
      onClick={() => handleClickPushNotification(url)}
      className="flex items-start gap-4 p-1 cursor-pointer group"
    >
      <div className="flex-shrink-0 mt-1">
        {icon ? (
          <img src={icon} alt="" className="w-10 h-10 rounded-lg shadow-sm" />
        ) : (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${type === 'Background' ? 'bg-info/10' : 'bg-primary/10'}`}>
            <svg className={`w-6 h-6 ${type === 'Background' ? 'text-info' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-bold text-gray-900 truncate">
            {title}
          </p>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter ${type === 'Background' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}>
            {type}
          </span>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
          {body}
        </p>
        {url && (
          <p className="text-[10px] text-primary mt-1 font-medium group-hover:underline">
            Click to view details →
          </p>
        )}
      </div>
    </div>
  );

  function getMessage() {
    const messaging = firebaseCloudMessaging.getMessaging();
    if (messaging) {
      onMessage(messaging, (payload) => {
        saveMessageToHistory(payload, "Foreground");
        if (onNotificationReceived) onNotificationReceived(payload);
        toast(
          <CustomToast
            title={payload?.notification?.title}
            body={payload?.notification?.body}
            url={payload?.data?.url}
            icon={payload?.notification?.icon}
            type="Foreground"
          />,
          {
            closeOnClick: false,
            className: "rounded-xl shadow-2xl border border-gray-100",
            bodyClassName: "p-0",
          }
        );
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-background shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="inline-flex items-center gap-2">
                  <img src="/logo.svg" alt="FPND logo" className="h-7 w-7" />
                  <span className="font-bold text-xl tracking-tight text-primary">
                    FPND
                  </span>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${router.pathname === '/' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`}>
                  Home
                </Link>
                <Link href="/settings" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${router.pathname === '/settings' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`}>
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center rounded-md border border-border bg-muted/40 hover:bg-muted px-2.5 py-2 text-sm font-medium text-foreground transition-colors"
                aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                title={isDark ? "Light mode" : "Dark mode"}
              >
                {isDark ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M12 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 20v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4.93 4.93l1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M17.66 17.66l1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M2 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M20 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4.93 19.07l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>

              <div className="sm:hidden space-x-4">
                <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
                <Link href="/settings" className="text-muted-foreground hover:text-foreground">Settings</Link>
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
