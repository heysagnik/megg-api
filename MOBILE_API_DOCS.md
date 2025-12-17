# MEGG API Documentation for Flutter Mobile App

## Overview

This document provides a comprehensive guide for implementing the MEGG API in your Flutter mobile application. The API is split across two services:

- **Cloudflare Workers (Primary)**: `https://api.megg.workers.dev` - Fast, edge-cached public endpoints
- **Vercel (Secondary)**: `https://megg-api.vercel.app` - Auth, uploads, and admin endpoints

---

## Base URL Strategy

```dart
class ApiConfig {
  // Primary API - Fast, edge-cached endpoints (use for most requests)
  static const String baseUrl = 'https://api.megg.workers.dev';
  
  // Secondary API - For auth and user-specific operations
  static const String vercelUrl = 'https://megg-api.vercel.app';
}
```

---

## Authentication

The API uses **Bearer token authentication** for user-specific endpoints. The token is obtained after Google OAuth login.

### Authentication Flow (Flutter)

1. User signs in with Google using `google_sign_in` package
2. Get the ID token from Google
3. Exchange it with the backend for a session token
4. Use the session token for all authenticated requests

```dart
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile', 'openid'],
  );
  
  String? _sessionToken;
  
  Future<bool> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account == null) return false;
      
      final GoogleSignInAuthentication auth = await account.authentication;
      final String? idToken = auth.idToken;
      
      if (idToken == null) return false;
      
      // Exchange ID token for session token
      final response = await http.post(
        Uri.parse('${ApiConfig.vercelUrl}/api/account/mobile/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'idToken': idToken}),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _sessionToken = data['session']['token'];
        // Store token securely using flutter_secure_storage
        await _secureStorage.write(key: 'session_token', value: _sessionToken);
        return true;
      }
      return false;
    } catch (e) {
      print('Sign in error: $e');
      return false;
    }
  }
  
  Map<String, String> get authHeaders => {
    'Authorization': 'Bearer $_sessionToken',
    'Content-Type': 'application/json',
  };
}
```

---

## API Endpoints Reference

### 🏠 Health Check

| Endpoint | Method | Auth | Caching |
|----------|--------|------|---------|
| `/api/health` | GET | No | - |

```dart
Future<bool> checkHealth() async {
  final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/health'));
  return response.statusCode == 200;
}
```

---

## 📦 Products

### List Products

| Endpoint | Method | Auth | Caching | TTL |
|----------|--------|------|---------|-----|
| `/api/products` | GET | No | Yes | 15 min |

**Query Parameters:**
- `page` (int, default: 1) - Page number
- `limit` (int, default: 20, max: 100) - Items per page
- `category` (string, optional) - Filter by category
- `subcategory` (string, optional) - Filter by subcategory
- `sort` (string, optional) - `popularity`, `newest`, `price_low`, `price_high`

```dart
class ProductService {
  Future<ProductListResponse> getProducts({
    int page = 1,
    int limit = 20,
    String? category,
    String? subcategory,
    String sort = 'popularity',
  }) async {
    final queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
      'sort': sort,
      if (category != null) 'category': category,
      if (subcategory != null) 'subcategory': subcategory,
    };
    
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/products')
        .replace(queryParameters: queryParams);
    
    final response = await http.get(uri);
    return ProductListResponse.fromJson(jsonDecode(response.body));
  }
}
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 1999,
      "brand": "Brand Name",
      "images": ["url1", "url2"],
      "category": "men",
      "subcategory": "shirts",
      "color": "blue",
      "affiliate_link": "https://...",
      "popularity": 100
    }
  ],
  "page": 1,
  "limit": 20
}
```

### Get Single Product

| Endpoint | Method | Auth | 
|----------|--------|------|
| `/api/products/:id` | GET | No |

```dart
Future<Product> getProduct(String id) async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/api/products/$id'),
  );
  return Product.fromJson(jsonDecode(response.body));
}
```

---

## 🔍 Search

### Unified Search

| Endpoint | Method | Auth | Caching | TTL |
|----------|--------|------|---------|-----|
| `/api/search` | GET | No | Yes | 15 min |

**Query Parameters:**
- `q` (string, required) - Search query
- `page` (int, default: 1)
- `limit` (int, default: 20)
- `category` (string, optional)
- `minPrice` (number, optional)
- `maxPrice` (number, optional)

```dart
class SearchService {
  Future<SearchResponse> search({
    required String query,
    int page = 1,
    int limit = 20,
    String? category,
    double? minPrice,
    double? maxPrice,
  }) async {
    final queryParams = {
      'q': query,
      'page': page.toString(),
      'limit': limit.toString(),
      if (category != null) 'category': category,
      if (minPrice != null) 'minPrice': minPrice.toString(),
      if (maxPrice != null) 'maxPrice': maxPrice.toString(),
    };
    
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/search')
        .replace(queryParameters: queryParams);
    
    final response = await http.get(uri);
    return SearchResponse.fromJson(jsonDecode(response.body));
  }
}
```


---

## 🔥 Trending

| Endpoint | Method | Auth | Caching | TTL |
|----------|--------|------|---------|-----|
| `/api/trending` | GET | No | Yes | 5 min |

**Query Parameters:**
- `limit` (int, default: 10, max: 50)

```dart
Future<List<Product>> getTrendingProducts({int limit = 10}) async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/api/trending?limit=$limit'),
  );
  final List<dynamic> data = jsonDecode(response.body);
  return data.map((json) => Product.fromJson(json)).toList();
}
```

---

## 📱 Reels (Short Videos)

### List Reels

| Endpoint | Method | Auth | Caching | TTL |
|----------|--------|------|---------|-----|
| `/api/reels` | GET | No | Yes | 15 min |

**Query Parameters:**
- `category` (string, optional) - Filter by category

```dart
Future<List<Reel>> getReels({String? category}) async {
  final uri = Uri.parse('${ApiConfig.baseUrl}/api/reels')
      .replace(queryParameters: category != null ? {'category': category} : null);
  
  final response = await http.get(uri);
  final List<dynamic> data = jsonDecode(response.body);
  return data.map((json) => Reel.fromJson(json)).toList();
}
```

### Get Reel with Products

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/reels/:id` | GET | No |

```dart
Future<ReelWithProducts> getReelWithProducts(String id) async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/api/reels/$id'),
  );
  return ReelWithProducts.fromJson(jsonDecode(response.body));
}
```

**Response:**
```json
{
  "reel": {
    "id": "uuid",
    "category": "fashion",
    "video_url": "https://...",
    "thumbnail_url": "https://...",
    "product_ids": ["uuid1", "uuid2"],
    "views": 1500,
    "likes": 200
  },
  "products": [...]
}
```

---

## 🎨 Color Combos

### List Color Combos

| Endpoint | Method | Auth | Caching | TTL |
|----------|--------|------|---------|-----|
| `/api/color-combos` | GET | No | Yes | 1 hour |

```dart
Future<List<ColorCombo>> getColorCombos({String? groupType}) async {
  final uri = Uri.parse('${ApiConfig.baseUrl}/api/color-combos')
      .replace(queryParameters: groupType != null ? {'group_type': groupType} : null);
  
  final response = await http.get(uri);
  final List<dynamic> data = jsonDecode(response.body);
  return data.map((json) => ColorCombo.fromJson(json)).toList();
}
```

### Get Color Combo with Products

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/color-combos/:id` | GET | No |

---

## 👗 Outfits

| Endpoint | Method | Auth | Caching |
|----------|--------|------|---------|
| `/api/outfits` | GET | No | No |
| `/api/outfits/:id` | GET | No | No |

```dart
Future<List<Outfit>> getOutfits() async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/api/outfits'),
  );
  final List<dynamic> data = jsonDecode(response.body);
  return data.map((json) => Outfit.fromJson(json)).toList();
}
```

---

## 🏷️ Offers & Banners

### Offers

| Endpoint | Method | Auth | Caching | TTL |
|----------|--------|------|---------|-----|
| `/api/offers` | GET | No | Yes | 15 min |

```dart
Future<List<Offer>> getOffers() async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/api/offers'),
  );
  final List<dynamic> data = jsonDecode(response.body);
  return data.map((json) => Offer.fromJson(json)).toList();
}
```

### Banners

| Endpoint | Method | Auth | Caching | TTL |
|----------|--------|------|---------|-----|
| `/api/banners` | GET | No | Yes | 1 hour |

**Query Parameters:**
- `category` (string, optional) - Filter by category

```dart
Future<List<Banner>> getBanners({String? category}) async {
  final uri = Uri.parse('${ApiConfig.baseUrl}/api/banners')
      .replace(queryParameters: category != null ? {'category': category} : null);
  
  final response = await http.get(uri);
  final List<dynamic> data = jsonDecode(response.body);
  return data.map((json) => Banner.fromJson(json)).toList();
}
```

---

## ❤️ Wishlist (Requires Auth)

All wishlist endpoints require authentication via Bearer token.

### Get Wishlist

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/wishlist` | GET | ✅ Required |

```dart
Future<WishlistResponse> getWishlist() async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/api/wishlist'),
    headers: authService.authHeaders,
  );
  return WishlistResponse.fromJson(jsonDecode(response.body));
}
```

### Add to Wishlist

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/wishlist/:productId` | POST | ✅ Required |

```dart
Future<bool> addToWishlist(String productId) async {
  final response = await http.post(
    Uri.parse('${ApiConfig.baseUrl}/api/wishlist/$productId'),
    headers: authService.authHeaders,
  );
  return response.statusCode == 201 || response.statusCode == 200;
}
```

### Remove from Wishlist

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/wishlist/:productId` | DELETE | ✅ Required |

```dart
Future<bool> removeFromWishlist(String productId) async {
  final response = await http.delete(
    Uri.parse('${ApiConfig.baseUrl}/api/wishlist/$productId'),
    headers: authService.authHeaders,
  );
  return response.statusCode == 200;
}
```

### Check if Product in Wishlist

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/wishlist/check/:productId` | GET | ✅ Required |

```dart
Future<bool> isInWishlist(String productId) async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/api/wishlist/check/$productId'),
    headers: authService.authHeaders,
  );
  final data = jsonDecode(response.body);
  return data['inWishlist'] == true;
}
```

---

## 👤 User Profile (Requires Auth)

### Get Profile

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/auth/profile` | GET | ✅ Required |

```dart
Future<UserProfile> getProfile() async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/api/auth/profile'),
    headers: authService.authHeaders,
  );
  return UserProfile.fromJson(jsonDecode(response.body));
}
```

### Sync User (Call after first login)

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/auth/sync` | POST | ✅ Required |

```dart
Future<void> syncUser() async {
  await http.post(
    Uri.parse('${ApiConfig.baseUrl}/api/auth/sync'),
    headers: authService.authHeaders,
  );
}
```

---

## 📂 Categories

| Endpoint | Method | Auth | Caching | TTL |
|----------|--------|------|---------|-----|
| `/api/categories` | GET | No | Yes | 1 hour |

```dart
Future<List<String>> getCategories() async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/api/categories'),
  );
  final List<dynamic> data = jsonDecode(response.body);
  return data.map((item) => item['category'] as String).toList();
}
```

---

## 🔔 Push Notifications (FCM)

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/fcm` | GET | No |

```dart
Future<List<Notification>> getNotifications() async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/api/fcm'),
  );
  final List<dynamic> data = jsonDecode(response.body);
  return data.map((json) => Notification.fromJson(json)).toList();
}
```

---

## 🚀 Optimization Tips for Flutter

### 1. Use Dio for HTTP Requests

```dart
// pubspec.yaml
dependencies:
  dio: ^5.4.0
  dio_cache_interceptor: ^3.5.0

// api_client.dart
class ApiClient {
  late Dio _dio;
  late CacheOptions _cacheOptions;

  ApiClient() {
    _cacheOptions = CacheOptions(
      store: MemCacheStore(),
      maxStale: const Duration(minutes: 15),
    );
    
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ))
      ..interceptors.add(DioCacheInterceptor(options: _cacheOptions));
  }
}
```

### 2. Implement Local Caching with Hive

```dart
// pubspec.yaml
dependencies:
  hive: ^2.2.3
  hive_flutter: ^1.1.0

// cache_service.dart
class CacheService {
  late Box _cacheBox;

  Future<void> init() async {
    await Hive.initFlutter();
    _cacheBox = await Hive.openBox('api_cache');
  }

  Future<T?> getCached<T>(String key, Duration maxAge) async {
    final cached = _cacheBox.get(key);
    if (cached == null) return null;
    
    final cachedAt = DateTime.parse(cached['timestamp']);
    if (DateTime.now().difference(cachedAt) > maxAge) {
      await _cacheBox.delete(key);
      return null;
    }
    
    return cached['data'] as T;
  }

  Future<void> setCache(String key, dynamic data) async {
    await _cacheBox.put(key, {
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }
}
```

### 3. Prefetch Data on App Start

```dart
class AppStartupService {
  Future<void> prefetchData() async {
    await Future.wait([
      productService.getTrendingProducts(),
      categoryService.getCategories(),
      bannerService.getBanners(),
      offerService.getOffers(),
    ]);
  }
}
```

### 4. Implement Infinite Scroll with Pagination

```dart
class ProductListController {
  int _currentPage = 1;
  bool _hasMore = true;
  bool _isLoading = false;
  List<Product> products = [];

  Future<void> loadMore() async {
    if (_isLoading || !_hasMore) return;
    
    _isLoading = true;
    final response = await productService.getProducts(page: _currentPage);
    
    products.addAll(response.products);
    _hasMore = response.products.length >= 20;
    _currentPage++;
    _isLoading = false;
  }
}
```

### 5. Use Riverpod for State Management

```dart
// providers.dart
final productListProvider = FutureProvider.family<List<Product>, String?>((ref, category) async {
  return ref.read(productServiceProvider).getProducts(category: category);
});

final wishlistProvider = StateNotifierProvider<WishlistNotifier, Set<String>>((ref) {
  return WishlistNotifier(ref.read(wishlistServiceProvider));
});
```

---

## Error Handling

```dart
class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);
}

Future<T> handleApiCall<T>(Future<http.Response> Function() call, T Function(Map<String, dynamic>) parser) async {
  try {
    final response = await call();
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return parser(jsonDecode(response.body));
    }
    
    final error = jsonDecode(response.body);
    throw ApiException(response.statusCode, error['error'] ?? 'Unknown error');
  } on SocketException {
    throw ApiException(0, 'No internet connection');
  } on TimeoutException {
    throw ApiException(0, 'Request timeout');
  }
}
```

---

## Required Flutter Packages

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP & Networking
  dio: ^5.4.0
  dio_cache_interceptor: ^3.5.0
  
  # Auth
  google_sign_in: ^6.2.1
  flutter_secure_storage: ^9.0.0
  
  # State Management
  flutter_riverpod: ^2.4.10
  
  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  
  # UI Helpers
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0
  
  # Video Playback (for Reels)
  video_player: ^2.8.3
  chewie: ^1.7.4
```

---

## Summary: Which Base URL to Use

| Feature | Base URL | Why |
|---------|----------|-----|
| Products, Search, Reels, Banners | `api.megg.workers.dev` | Edge-cached, fastest |
| Trending | `api.megg.workers.dev` | Short TTL cache (5 min) |
| Auth (Google Login) | `megg-api.vercel.app` | Contains auth logic |
| Wishlist | `api.megg.workers.dev` | Optimized for user data |
| Profile | `api.megg.workers.dev` | Synced with Workers |

---

## Contact & Support

For API issues or questions, check the API health endpoint first:
- Workers: `https://api.megg.workers.dev/api/health`
- Vercel: `https://megg-api.vercel.app/api/health`
