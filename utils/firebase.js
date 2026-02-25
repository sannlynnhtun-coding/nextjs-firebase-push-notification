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
      
      // Provide helpful error messages
      if (error.code === 'messaging/token-subscribe-failed') {
        console.error("❌ Failed to subscribe to FCM. Possible causes:");
        console.error("1. Check your internet connection");
        console.error("2. Verify Firebase Cloud Messaging API is enabled in Firebase Console");
        console.error("3. Check if firewall/VPN is blocking fcmregistrations.googleapis.com");
        console.error("4. Verify your Firebase project ID is correct:", config.projectId);
        console.error("5. Make sure you're using the correct Firebase Web App config (not service account)");
      }
      
      throw error; // Re-throw to show toast message
    }
  },

  // Get messaging instance for onMessage listener
  getMessaging: () => {
    return messaging;
  },

  // Topic Management
  getTopics: async () => {
    try {
      const topics = await localforage.getItem("fcm_subscribed_topics");
      return topics || [];
    } catch (error) {
      console.error("Error getting topics:", error);
      return [];
    }
  },

  saveTopics: async (topics) => {
    try {
      await localforage.setItem("fcm_subscribed_topics", topics);
    } catch (error) {
      console.error("Error saving topics:", error);
    }
  }
};

export { firebaseCloudMessaging };
