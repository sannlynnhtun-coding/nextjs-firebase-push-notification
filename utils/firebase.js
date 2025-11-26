import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import localforage from "localforage";

let app = null;
let messaging = null;

const firebaseCloudMessaging = {
  init: async () => {
    try {
      // Load Firebase config from localStorage
      const config = await localforage.getItem("firebase_config");
      
      if (!config) {
        console.warn("Firebase configuration not found. Please configure Firebase in Settings page.");
        return null;
      }

      // Initialize Firebase app if not already initialized
      if (!app) {
        if (getApps().length === 0) {
          app = initializeApp({
            apiKey: config.apiKey,
            authDomain: config.authDomain,
            projectId: config.projectId,
            storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
            messagingSenderId: config.messagingSenderId,
            appId: config.appId,
            measurementId: config.measurementId
          });
        } else {
          app = getApp();
        }
      }

      // Check if browser supports messaging
      if (typeof window === "undefined" || !("Notification" in window)) {
        console.warn("This browser does not support notifications");
        return null;
      }

      // Initialize messaging
      if (!messaging && "serviceWorker" in navigator) {
        messaging = getMessaging(app);
      }

      if (!messaging) {
        console.warn("Messaging not available");
        return null;
      }

      const tokenInLocalForage = await localforage.getItem("fcm_token");

      // Return the token if it is already in our local storage
      if (tokenInLocalForage !== null) {
        return tokenInLocalForage;
      }

      // Request the push notification permission from browser
      const status = await Notification.requestPermission();
      if (status && status === "granted") {
        
        let serviceWorkerRegistration = null;
        if ('serviceWorker' in navigator) {
             try {
                serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('Service Worker registered with scope:', serviceWorkerRegistration.scope);
             } catch (err) {
                console.error('Service Worker registration failed:', err);
             }
        }

        // Get new token from Firebase
        const tokenOptions = {
          vapidKey: config.vapidKey,
        };
        
        if (serviceWorkerRegistration) {
          tokenOptions.serviceWorkerRegistration = serviceWorkerRegistration;
        }

        const fcm_token = await getToken(messaging, tokenOptions);

        // Set token in our local storage
        if (fcm_token) {
          await localforage.setItem("fcm_token", fcm_token);
          return fcm_token;
        }
      } else {
        console.warn("Notification permission denied");
        return null;
      }
    } catch (error) {
      console.error("Firebase initialization error:", error);
      return null;
    }
  },

  // Get messaging instance for onMessage listener
  getMessaging: () => {
    return messaging;
  },
};

export { firebaseCloudMessaging };
