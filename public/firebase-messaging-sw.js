// importScripts("https://www.gstatic.com/firebasejs/7.9.1/firebase-app.js");
// importScripts("https://www.gstatic.com/firebasejs/7.9.1/firebase-messaging.js");

// eslint-disable-next-line no-undef
importScripts('https://www.gstatic.com/firebasejs/8.8.0/firebase-app.js');
// eslint-disable-next-line no-undef
importScripts('https://www.gstatic.com/firebasejs/8.8.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyBHHy68eC-VlbKwc5C853k7GrkvrbjXfx0",
  authDomain: "csharp-firestore-2022.firebaseapp.com",
  projectId: "csharp-firestore-2022",
  storageBucket: "csharp-firestore-2022.appspot.com",
  messagingSenderId: "331246389959",
  appId: "1:331246389959:web:5767805a19cb971e2a8ce2",
  measurementId: "G-PKS62DN4ED"
});

const messaging = firebase.messaging();
// firebase.messaging().getToken({
//   vapidKey: 'BJXINwEV_YGUdQ8ZM25UseO15QE6D5q6jUIuoRdAeichZ0VP-i-UmBn4pIH5JzHhQBmYOrI67MIMyzyfUU0Yd08'
//     }).then(token=>{
//       console.log(token);
// });

messaging.onBackgroundMessage((payload) => {
  console.log(
      '[firebase-messaging-sw.js] Received background message ',
      payload
  );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: './logo.png',
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});