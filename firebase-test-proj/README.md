# Firebase Push Notification Test Console (.NET 8)

A .NET 8 console application for testing Firebase Cloud Messaging (FCM) push notifications using Firebase Admin SDK.

## Prerequisites

- .NET 8 SDK installed
- Firebase project with Cloud Messaging enabled
- Firebase service account JSON file (see below for how to get it)

## Firebase Service Account Setup

### Already Configured! ✓

The project already includes `serviceAccountKey.json` with your Firebase credentials. The app will automatically detect and use it.

### To Update or Replace:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) next to "Project Overview" → "Project settings"
4. Go to the "Service accounts" tab
5. Click "Generate new private key" button
6. Replace the existing `serviceAccountKey.json` file in this directory

## Setup

1. Navigate to the project directory:
   ```bash
   cd firebase-test-proj
   ```

2. Restore NuGet packages:
   ```bash
   dotnet restore
   ```

3. Build the project:
   ```bash
   dotnet build
   ```

## Running the Application

Run the console app:
```bash
dotnet run
```

The application will:

1. **Auto-detect serviceAccountKey.json** - Automatically uses the service account file in the project directory
2. **Prompt for Notification Details**:
   - **Notification Title**: The title of the push notification
   - **Notification Content/Body**: The message content
   - **Device FCM Token**: The target device's FCM token (from your web app)
   - **Image URL (Optional)**: URL to an image to display in the notification
   - **Click Action URL (Optional)**: URL to open when notification is clicked

## Getting the Device FCM Token

You can get the FCM token from your Next.js web application:

1. Open your Next.js app in the browser
2. Open browser console (F12)
3. The token should be displayed when you request notification permission
4. Or check the `PushNotificationLayout.js` component logs

## Example Usage

```
===========================================
Firebase Push Notification Test Console
===========================================

Step 1: Firebase Service Account Configuration
----------------------------------------------
✓ Found serviceAccountKey.json in project directory
  Using: D:\slh\proj\nextjs-firebase-push-notification\firebase-test-proj\serviceAccountKey.json

Initializing Firebase Admin SDK...
✓ Firebase Admin SDK initialized successfully!

Step 2: Notification Details
----------------------------------------------
Enter notification title: Hello from .NET!
Enter notification content/body: This is a test notification sent from .NET 8 console app

Step 3: Target Device
----------------------------------------------
Enter the device FCM token: dKzY8m4r3L...

Step 4: Additional Options (Optional)
----------------------------------------------
Enter image URL (press Enter to skip): https://example.com/image.png
Enter click action URL (press Enter to skip): https://example.com

===========================================
Notification Summary
===========================================
Title: Hello from .NET!
Body: This is a test notification sent from .NET 8 console app
Token: dKzY8m4r3L...
Image: https://example.com/image.png
Click Action: https://example.com
===========================================

Send this notification? (Y/N): Y

Sending notification...

✓ SUCCESS! Notification sent successfully!
Message ID: projects/your-project/messages/0:1234567890
Timestamp: 2026-01-05 10:30:45
```

## Error Handling

The application handles common Firebase errors:

- **InvalidArgument**: Invalid FCM token format or expired token
- **Unregistered**: Device token is no longer valid (app uninstalled, data cleared, etc.)
- Other Firebase and general exceptions

## Features

- Interactive console interface with step-by-step prompts
- Firebase Admin SDK integration
- Custom notification title, body, image, and click action
- Comprehensive error handling
- Confirmation before sending
- Success/failure feedback with message ID

## NuGet Packages Used

- `FirebaseAdmin` (v3.0.0) - Firebase Admin SDK for .NET
- `Google.Apis.Auth` (v1.68.0) - Google authentication library

## Troubleshooting

### "Service account file not found"
- Ensure the path to your service account JSON file is correct
- Use absolute path or relative path from the project directory

### "Invalid token" error
- Verify the FCM token is correct and not expired
- Get a fresh token from your web application

### "Permission denied" error
- Ensure your Firebase service account has the correct permissions
- Check that Cloud Messaging API is enabled in your Firebase project

## Project Structure

```
firebase-test-proj/
├── FirebaseTestApp.csproj    # Project file with dependencies
├── Program.cs                # Main console application code
└── README.md                 # This file
```

## License

This is a test utility for the Next.js Firebase Push Notification project.

