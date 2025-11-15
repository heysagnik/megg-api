# MEGG Fashion API - Push Notifications Setup

## Overview

Simplified push notification system using Firebase Cloud Messaging (FCM). Admin can send notifications to all app users, and users can fetch notification history.

## Environment Variable

Add this to your `.env` file:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

## Getting Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click gear icon → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. **Minify the JSON** (remove whitespace/newlines) and paste as single line in `.env`

### Quick minify command:
```bash
# Windows PowerShell
(Get-Content service-account-key.json | ConvertFrom-Json | ConvertTo-Json -Compress) | Set-Clipboard
```

## Database Setup

The `notifications` table is already in `schema.sql`. Just ensure it has the image column:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### 1. Send Notification (Admin Only)

```http
POST /api/fcm/send
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "New Winter Collection",
  "body": "Check out our latest arrivals!",
  "image": "https://example.com/banner.jpg",
  "link": "https://meggfashion.com/winter-sale"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "success": true,
    "notification": {
      "id": "uuid",
      "title": "New Winter Collection",
      "description": "Check out our latest arrivals!",
      "image": "https://example.com/banner.jpg",
      "link": "https://meggfashion.com/winter-sale",
      "created_at": "2025-11-15T10:30:00Z"
    },
    "fcm_message_id": "projects/your-project/messages/0:1234567890"
  }
}
```

### 2. Get Notifications (Public)

```http
GET /api/fcm?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "title": "New Winter Collection",
        "description": "Check out our latest arrivals!",
        "image": "https://example.com/banner.jpg",
        "link": "https://meggfashion.com/winter-sale",
        "created_at": "2025-11-15T10:30:00Z"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

## Client Setup (Important!)

### Subscribe to Topic on App Launch

All users must subscribe to the `all-users` topic to receive notifications:

**Flutter:**
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> setupFCM() async {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  
  // Request permissions (iOS)
  await messaging.requestPermission();
  
  // Subscribe to all-users topic
  await messaging.subscribeToTopic('all-users');
  
  print('Subscribed to notifications');
}

// Call on app start
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await setupFCM();
  runApp(MyApp());
}
```


### Handle Notification Clicks

**Flutter:**
```dart
// Handle notification when app is in background/terminated
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  final link = message.data['link'];
  if (link != null && link.isNotEmpty) {
    // Navigate to link or open in browser
    launchUrl(Uri.parse(link));
  }
});

// Check if app was opened from notification
FirebaseMessaging.instance.getInitialMessage().then((message) {
  if (message != null) {
    final link = message.data['link'];
    if (link != null && link.isNotEmpty) {
      launchUrl(Uri.parse(link));
    }
  }
});
```


## Features

- ✅ Broadcast to all users via FCM topics
- ✅ Automatic notification history storage
- ✅ Image support for rich notifications
- ✅ Deep link support
- ✅ No token management required
- ✅ Works even if FCM fails (saved in DB)
- ✅ Simple 2-endpoint API





## Production Deployment

**Vercel:**
```bash
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
# Paste minified JSON
vercel --prod
```

## Troubleshooting

**"Firebase is not initialized"**
- Check `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env`
- Ensure JSON is valid (use online validator)

**Notifications not received**
- Verify app subscribed to `all-users` topic
- Check Firebase Cloud Messaging enabled
- Test with FCM token directly in Firebase Console

**Image not showing**
- Ensure image URL is publicly accessible
- Use HTTPS URLs only
- Keep image size under 1MB

## Environment Variable

Add this to your `.env` file:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

## Getting Your Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. **Minify the JSON** (remove all whitespace/newlines) and paste as single line in `.env`

### Quick minify command:
```bash
# Linux/Mac
cat service-account-key.json | jq -c . | pbcopy

# Windows PowerShell
(Get-Content service-account-key.json | ConvertFrom-Json | ConvertTo-Json -Compress) | Set-Clipboard
```

## Database Setup

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_platform ON fcm_tokens(platform);
```

## API Endpoints

### User Endpoints (Require Authentication)

#### Register/Update FCM Token
```http
POST /api/fcm/token
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "token": "fcm-device-token-here",
  "platform": "android",
  "device_info": {
    "model": "Pixel 7",
    "os_version": "Android 14",
    "app_version": "1.0.0",
    "device_name": "My Phone"
  }
}
```

#### Get User's Tokens
```http
GET /api/fcm/tokens
Authorization: Bearer <user-token>
```

#### Delete Specific Token
```http
DELETE /api/fcm/token
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "token": "fcm-device-token-to-delete"
}
```

#### Delete All User Tokens
```http
DELETE /api/fcm/tokens
Authorization: Bearer <user-token>
```

### Admin Endpoints (Require Admin Privileges)

#### Send to Single User
```http
POST /api/fcm/send/user
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "user_id": "uuid-of-user",
  "title": "New Products Available!",
  "body": "Check out our latest collection",
  "image": "https://example.com/notification-image.jpg",
  "data": {
    "screen": "products",
    "category": "Hoodies",
    "link": "https://meggfashion.com/hoodies"
  }
}
```

#### Send to Multiple Users
```http
POST /api/fcm/send/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "user_ids": ["uuid1", "uuid2", "uuid3"],
  "title": "Exclusive Offer",
  "body": "50% off on selected items",
  "image": "https://example.com/offer.jpg",
  "data": {
    "screen": "offers",
    "offer_id": "winter-sale-2025"
  }
}
```

#### Broadcast to All Users
```http
POST /api/fcm/send/all
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "App Update Available",
  "body": "Update now to get the latest features",
  "image": "https://example.com/update.jpg",
  "data": {
    "action": "update"
  }
}
```

#### Get Token Statistics
```http
GET /api/fcm/stats
Authorization: Bearer <admin-token>
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 1523,
    "android": 890,
    "ios": 601,
    "web": 32
  }
}
```

## Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "success": 3,
    "failure": 0,
    "invalidTokensRemoved": 0
  }
}
```

### Multi-user Send Response
```json
{
  "success": true,
  "message": "Notifications sent successfully",
  "data": {
    "success": 245,
    "failure": 5,
    "invalidTokensRemoved": 5,
    "totalUsers": 100,
    "totalTokens": 250
  }
}
```

## Features

- ✅ Automatic invalid token cleanup
- ✅ Batch sending (handles 500+ tokens efficiently)
- ✅ Platform-specific notification settings (Android/iOS/Web)
- ✅ Deep link support via `data` payload
- ✅ Image notifications
- ✅ Unique constraint prevents duplicate tokens
- ✅ Auto-update existing tokens on re-registration
- ✅ Comprehensive error handling
- ✅ Production-ready with input validation

## Client Integration Example

### Flutter/Dart
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> registerFCMToken() async {
  final token = await FirebaseMessaging.instance.getToken();
  
  await http.post(
    Uri.parse('https://api.meggfashion.com/api/fcm/token'),
    headers: {
      'Authorization': 'Bearer $userToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'token': token,
      'platform': 'android', // or 'ios'
      'device_info': {
        'model': await DeviceInfo.model,
        'os_version': await DeviceInfo.osVersion,
        'app_version': '1.0.0',
      }
    }),
  );
}
```

### React Native
```javascript
import messaging from '@react-native-firebase/messaging';

const registerFCMToken = async () => {
  const token = await messaging().getToken();
  
  await fetch('https://api.meggfashion.com/api/fcm/token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      platform: Platform.OS, // 'android' or 'ios'
      device_info: {
        model: DeviceInfo.getModel(),
        os_version: DeviceInfo.getSystemVersion(),
        app_version: DeviceInfo.getVersion(),
      }
    })
  });
};
```

## Security Notes

- Never expose `FIREBASE_SERVICE_ACCOUNT_KEY` in client code
- Store it only in server environment variables
- Rotate service account keys periodically
- Use Vercel/deployment platform's secret management
- Invalid/expired tokens are automatically cleaned up on send failures

## Troubleshooting

### "Firebase is not initialized"
- Verify `FIREBASE_SERVICE_ACCOUNT_KEY` is set in `.env`
- Ensure JSON is valid and properly escaped
- Check server logs for initialization errors

### "No FCM tokens found for this user"
- User needs to register token first via `/api/fcm/token`
- Check if tokens were deleted or expired

### High failure rate
- Tokens may be outdated
- App may be uninstalled
- System automatically cleans up invalid tokens

## Production Deployment

### Vercel
```bash
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
# Paste the minified JSON when prompted
```

### Manual
Add to Vercel dashboard:
- Settings → Environment Variables
- Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
- Value: Minified JSON from service account file
- Environment: Production
