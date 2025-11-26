# Next.js Firebase Push Notification Demo

A Next.js application demonstrating Firebase Cloud Messaging (FCM) push notifications with browser-based configuration.

## Features

- ✅ **Browser-based Firebase Configuration** - Configure Firebase settings directly from the browser UI
- ✅ **Firebase v10+ Support** - Uses the latest Firebase modular SDK
- ✅ **Next.js 14** - Upgraded to the latest Next.js version
- ✅ **Push Notifications** - Receive and display push notifications from Firebase Console
- ✅ **Service Worker Support** - Background notifications even when the app is closed
- ✅ **Token Management** - Easy FCM token copying for testing

## Getting Started

### Installation

First, install the dependencies:

```bash
npm install
# or
yarn install
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Configuration

### Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Navigate to **Project Settings** → **General** tab
4. Scroll down to **Your apps** section
5. Click on the **Web app** icon (</>) to add a web app if you haven't already
6. Copy the Firebase configuration values:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
   - Measurement ID (optional)

### Step 2: Get VAPID Key

1. In Firebase Console, go to **Project Settings** → **Cloud Messaging** tab
2. Scroll down to **Web Push certificates** section
3. If no key exists, click **Generate key pair**
4. Copy the **Key pair** value (this is your VAPID key)

### Step 3: Configure in the App

1. Navigate to the **Settings** page (`/settings`) in the app
2. Fill in all the Firebase configuration fields
3. Click **Save Configuration**
4. The app will reload and initialize Firebase with your configuration

## Testing Push Notifications

### Method 1: Using Firebase Console

1. After configuring Firebase, copy your FCM token from the home page
2. Go to Firebase Console → **Cloud Messaging**
3. Click **Send test message**
4. Paste your FCM token in the **FCM registration token** field
5. Enter a notification title and message
6. Click **Test**
7. You should receive the notification in your browser!

### Method 2: Using Firebase Admin SDK

You can also send notifications programmatically using the Firebase Admin SDK from your backend.

## Project Structure

```
├── components/
│   ├── FirebaseConfigForm.js    # Firebase configuration form component
│   └── PushNotificationLayout.js # Push notification handler wrapper
├── pages/
│   ├── index.js                 # Home page
│   ├── settings.js              # Firebase configuration page
│   ├── offers.js                 # Example page with notifications
│   └── _app.js                  # App wrapper
├── public/
│   └── firebase-messaging-sw.js # Service worker for background notifications
├── utils/
│   └── firebase.js              # Firebase initialization utilities
└── next.config.js               # Next.js configuration
```

## Technologies Used

- **Next.js 14** - React framework
- **Firebase 10.7+** - Firebase Cloud Messaging
- **React Toastify** - Toast notifications
- **LocalForage** - Local storage for configuration and tokens
- **next-offline** - Service worker support

## Browser Support

This app requires a browser that supports:
- Service Workers
- Push Notifications API
- IndexedDB (for LocalForage)

Modern browsers (Chrome, Firefox, Edge, Safari 16+) are supported.

## Troubleshooting

### Notifications not working?

1. Make sure you've granted notification permissions in your browser
2. Verify your Firebase configuration is correct
3. Check that your VAPID key is correct
4. Ensure the service worker is registered (check browser DevTools → Application → Service Workers)
5. Check the browser console for any errors

### Service Worker not registering?

1. Make sure you're accessing the app via HTTPS (or localhost for development)
2. Clear your browser cache and reload
3. Check browser DevTools → Application → Service Workers for errors

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)

## License

MIT
