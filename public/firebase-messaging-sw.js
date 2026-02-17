// Import Firebase v9+ modules
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

let firebaseConfig = null;
let messaging = null;

// Listen for config from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

// Try to get config from IndexedDB on service worker activation
async function getConfigFromIndexedDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open('localforage', 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['keyvaluepairs'], 'readonly');
      const store = transaction.objectStore('keyvaluepairs');
      const getRequest = store.get('firebase_config');

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };

      getRequest.onerror = () => {
        resolve(null);
      };
    };

    request.onerror = () => {
      resolve(null);
    };
  });
}

// Initialize Firebase with config
async function initializeFirebase() {
  if (!firebaseConfig) {
    // Try to get from IndexedDB
    const config = await getConfigFromIndexedDB();
    if (config) {
      firebaseConfig = config;
    } else {
      console.warn('[firebase-messaging-sw.js] Firebase config not found');
      return;
    }
  }

  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket || `${firebaseConfig.projectId}.appspot.com`,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
      measurementId: firebaseConfig.measurementId
    });
  }

  messaging = firebase.messaging();

  // Save message to history in IndexedDB (same as localforage)
  async function saveMessageToIndexedDB(payload) {
    return new Promise((resolve) => {
      const request = indexedDB.open('localforage', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['keyvaluepairs'], 'readwrite');
        const store = transaction.objectStore('keyvaluepairs');
        const getRequest = store.get('notification_history');

        getRequest.onsuccess = () => {
          const history = getRequest.result || [];
          const newMessage = {
            id: Date.now(),
            title: payload.notification?.title || "No Title",
            body: payload.notification?.body || "No Body",
            data: payload.data || {},
            timestamp: new Date().toISOString(),
            receivedAt: "Background"
          };

          const updatedHistory = [newMessage, ...history].slice(0, 50);
          const putRequest = store.put(updatedHistory, 'notification_history');
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => resolve();
        };

        getRequest.onerror = () => resolve();
      };

      request.onerror = () => resolve();
    });
  }

  messaging.onBackgroundMessage((payload) => {
    console.log(
      '[firebase-messaging-sw.js] Received background message ',
      payload
    );

    // Save to IndexedDB
    saveMessageToIndexedDB(payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: payload.notification?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {},
      tag: payload.data?.tag || 'notification',
      requireInteraction: false,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);

    // Notify all active clients (tabs) to show a toast
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        client.postMessage({
          firebaseMessaging: {
            payload: payload
          }
        });
      }
    });
  });

  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    event.notification.close();

    if (event.notification.data && event.notification.data.url) {
      event.waitUntil(
        clients.openWindow(event.notification.data.url)
      );
    }
  });
}

// Try to initialize on service worker activation
getConfigFromIndexedDB().then((config) => {
  if (config) {
    firebaseConfig = config;
    initializeFirebase();
  }
});