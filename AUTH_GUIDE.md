# Mobile Auth Implementation Guide

## Overview

This API uses **Google Sign-In only** for authentication. Mobile apps should use the Google Sign-In SDK to get an ID token, then exchange it for a session token.

## Base URL
```
https://megg-api.vercel.app
```

## Authentication Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Mobile App     │     │   Google OAuth  │     │   Megg API      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. Sign In with      │                       │
         │     Google SDK        │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │  2. Get ID Token      │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │  3. POST /api/auth/mobile/google              │
         │       { idToken: "..." }                      │
         │──────────────────────────────────────────────>│
         │                       │                       │
         │  4. Returns user + session token              │
         │<──────────────────────────────────────────────│
         │                       │                       │
         │  5. Store session token locally               │
         │  6. Use token for authenticated requests      │
         │                       │                       │
```

## Endpoints

### 1. Google Sign-In (Mobile)

**POST** `/api/auth/mobile/google`

Exchange Google ID token for a session.

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsIn..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@gmail.com",
      "name": "John Doe",
      "avatar_url": "https://..."
    },
    "session": {
      "token": "session-token-uuid",
      "expiresAt": "2025-01-16T14:00:00.000Z"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid Google ID token"
}
```

---

### 2. Check Session

**GET** `/api/auth/check`

Check if a session token is valid.

**Headers:**
```
Authorization: Bearer <session-token>
```

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "John Doe",
    "avatar_url": "https://..."
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

---

### 3. Logout

**POST** `/api/auth/logout`

Invalidate the session.

**Headers:**
```
Authorization: Bearer <session-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out"
}
```

---

## Flutter Implementation

### 1. Dependencies

```yaml
# pubspec.yaml
dependencies:
  google_sign_in: ^6.1.6
  flutter_secure_storage: ^9.0.0
  dio: ^5.4.0
```

### 2. Auth Service

```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

class AuthService {
  static const _baseUrl = 'https://megg-api.vercel.app';
  static const _tokenKey = 'session_token';
  
  final _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);
  final _storage = const FlutterSecureStorage();
  final _dio = Dio();

  // Sign in with Google
  Future<User?> signInWithGoogle() async {
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      
      if (idToken == null) throw Exception('No ID token');

      // Exchange with backend
      final response = await _dio.post(
        '$_baseUrl/api/auth/mobile/google',
        data: {'idToken': idToken},
      );

      if (response.data['success']) {
        final data = response.data['data'];
        
        // Store session token
        await _storage.write(
          key: _tokenKey,
          value: data['session']['token'],
        );

        return User.fromJson(data['user']);
      }
      
      throw Exception(response.data['error']);
    } catch (e) {
      print('Sign in error: $e');
      return null;
    }
  }

  // Check if logged in
  Future<User?> getCurrentUser() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null) return null;

    try {
      final response = await _dio.get(
        '$_baseUrl/api/auth/check',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.data['authenticated']) {
        return User.fromJson(response.data['user']);
      }
      
      // Token expired, clear it
      await _storage.delete(key: _tokenKey);
      return null;
    } catch (e) {
      return null;
    }
  }

  // Get token for API calls
  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  // Logout
  Future<void> logout() async {
    final token = await _storage.read(key: _tokenKey);
    
    if (token != null) {
      try {
        await _dio.post(
          '$_baseUrl/api/auth/logout',
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );
      } catch (_) {}
    }

    await _storage.delete(key: _tokenKey);
    await _googleSignIn.signOut();
  }
}

// User model
class User {
  final String id;
  final String email;
  final String name;
  final String? avatarUrl;

  User({
    required this.id,
    required this.email,
    required this.name,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      avatarUrl: json['avatar_url'],
    );
  }
}
```

### 3. Authenticated API Calls

```dart
class ApiClient {
  final AuthService _auth;
  final Dio _dio = Dio();

  ApiClient(this._auth);

  Future<Response> get(String path) async {
    final token = await _auth.getToken();
    return _dio.get(
      'https://megg-api.vercel.app$path',
      options: Options(
        headers: token != null ? {'Authorization': 'Bearer $token'} : null,
      ),
    );
  }

  Future<Response> post(String path, dynamic data) async {
    final token = await _auth.getToken();
    return _dio.post(
      'https://megg-api.vercel.app$path',
      data: data,
      options: Options(
        headers: token != null ? {'Authorization': 'Bearer $token'} : null,
      ),
    );
  }
}
```

### 4. Usage in Widgets

```dart
class LoginScreen extends StatelessWidget {
  final authService = AuthService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ElevatedButton.icon(
          icon: Image.asset('assets/google_logo.png', height: 24),
          label: Text('Continue with Google'),
          onPressed: () async {
            final user = await authService.signInWithGoogle();
            if (user != null) {
              Navigator.pushReplacementNamed(context, '/home');
            }
          },
        ),
      ),
    );
  }
}
```

---

## Session Details

- **Duration:** 30 days
- **Storage:** Sessions are stored in the database
- **Format:** UUID token
- **Renewal:** Sessions are not auto-renewed; user must re-authenticate after expiry

---

## Error Handling

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Invalid Google ID token | The Google token is invalid or expired |
| 429 | Too many requests | Rate limit exceeded (100 requests/minute) |
| 500 | Server error | Internal server error |

---

## Security Notes

1. **Store tokens securely** - Use `flutter_secure_storage` on mobile
2. **Don't log tokens** - Never print session tokens to console
3. **Handle expiry** - Check auth status on app resume
4. **Logout properly** - Call `/logout` endpoint to invalidate server session

---

# Admin Panel Authentication

The admin panel uses **API Key authentication** instead of OAuth. This is simpler and more suitable for internal admin tools.

## Setup

1. Set the `ADMIN_API_KEY` environment variable on your backend
2. Pass this key in the `X-Admin-Key` header for all admin requests

## Admin Routes

All routes that modify data (create, update, delete) require the API key:

| Route | Method | Description |
|-------|--------|-------------|
| `/api/products` | POST | Create product |
| `/api/products/:id` | PUT | Update product |
| `/api/products/:id` | DELETE | Delete product |
| `/api/reels` | POST | Create reel |
| `/api/offers` | POST | Create offer |
| `/api/banners` | POST | Create banner |
| `/api/color-combos` | POST | Create color combo |
| `/api/notifications` | POST | Send notification |

## React/Next.js Implementation

### 1. Environment Setup

```env
# .env.local
NEXT_PUBLIC_API_URL=https://megg-api.vercel.app
ADMIN_API_KEY=your-secret-api-key-here
```

### 2. API Client

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.ADMIN_API_KEY;

export async function adminFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': API_KEY!,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// For form data (file uploads)
export async function adminUpload(path: string, formData: FormData) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'X-Admin-Key': API_KEY!,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload error: ${response.status}`);
  }

  return response.json();
}
```

### 3. Usage Examples

```typescript
// Create product
const createProduct = async (data: ProductData) => {
  return adminFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Update product
const updateProduct = async (id: string, data: Partial<ProductData>) => {
  return adminFetch(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Delete product
const deleteProduct = async (id: string) => {
  return adminFetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
};

// Upload product with images
const createProductWithImages = async (data: ProductData, images: File[]) => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  });
  
  images.forEach((file) => {
    formData.append('images', file);
  });

  return adminUpload('/api/products', formData);
};
```

### 4. Server-Side API Route (Next.js)

For security, keep the API key on the server side:

```typescript
// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.ADMIN_API_KEY;

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': API_KEY!,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

## Security Notes

1. **Never expose the API key to the client** - Keep it in server-side environment variables only
2. **Use HTTPS** - Always use HTTPS in production
3. **Rotate keys periodically** - Change the API key regularly
4. **Limit access** - Only deploy admin panel to authorized domains

