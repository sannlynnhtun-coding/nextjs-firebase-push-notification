import "firebase/messaging";
import firebase from "firebase/app";
import localforage from "localforage";

const firebaseCloudMessaging = {
  init: async () => {
    if (!firebase?.apps?.length) {
      // Initialize the Firebase app with the credentials
      firebase?.initializeApp({
        apiKey: "AIzaSyBHHy68eC-VlbKwc5C853k7GrkvrbjXfx0",
        authDomain: "csharp-firestore-2022.firebaseapp.com",
        projectId: "csharp-firestore-2022",
        storageBucket: "csharp-firestore-2022.appspot.com",
        messagingSenderId: "331246389959",
        appId: "1:331246389959:web:5767805a19cb971e2a8ce2",
        measurementId: "G-PKS62DN4ED"
      });

      try {
        const messaging = firebase.messaging();
        const tokenInLocalForage = await localforage.getItem("fcm_token");

        // Return the token if it is alredy in our local storage
        if (tokenInLocalForage !== null) {
          return tokenInLocalForage;
        }

        // Request the push notification permission from browser
        const status = await Notification.requestPermission();
        if (status && status === "granted") {
          // Get new token from Firebase
          const fcm_token = await messaging.getToken({
            vapidKey: "BJXINwEV_YGUdQ8ZM25UseO15QE6D5q6jUIuoRdAeichZ0VP-i-UmBn4pIH5JzHhQBmYOrI67MIMyzyfUU0Yd08",
          });

          // Set token in our local storage
          if (fcm_token) {
            localforage.setItem("fcm_token", fcm_token);
            return fcm_token;
          }
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  },
};
export { firebaseCloudMessaging };
