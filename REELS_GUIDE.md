# Reels Implementation Guide

## Overview

Reels are short-form videos with linked products. The API handles video compression and thumbnail generation automatically.

## Base URL
```
https://megg-api.vercel.app
```

---

# API Endpoints

## Public Endpoints (No Auth Required)

### 1. List All Reels
```
GET /api/reels?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reels": [
      {
        "id": "uuid",
        "category": "fashion",
        "video_url": "https://r2.example.com/reels/uuid/video.mp4",
        "thumbnail_url": "https://r2.example.com/reels/uuid/thumb.jpg",
        "product_ids": ["product-uuid-1", "product-uuid-2"],
        "views": 1234,
        "likes": 567,
        "created_at": "2024-12-17T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 2. List Reels by Category
```
GET /api/reels/category/:category?page=1&limit=20
```

### 3. Get Reel with Products
```
GET /api/reels/:id/products
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "category": "fashion",
    "video_url": "https://...",
    "thumbnail_url": "https://...",
    "views": 1234,
    "likes": 567,
    "products": [
      {
        "id": "product-uuid",
        "name": "Product Name",
        "price": 999,
        "images": ["https://..."],
        "affiliate_link": "https://..."
      }
    ]
  }
}
```

### 4. Track View
```
POST /api/reels/:id/view
```

### 5. Like/Unlike Reel
```
POST /api/reels/:id/like
```

---

## Admin Endpoints (API Key Required)

### 1. Upload Video
```
POST /api/upload/video
Headers: X-Admin-Key: your-api-key
Content-Type: multipart/form-data

Body:
- video: (file) - The video file (mp4, webm, mov)
- reelId: (optional) - UUID, will be generated if not provided
```

**Response:**
```json
{
  "success": true,
  "data": {
    "video_url": "https://r2.example.com/reels/uuid/video.mp4",
    "thumbnail_url": "https://r2.example.com/reels/uuid/thumb.jpg",
    "size": 1234567,
    "compressed": true,
    "reelId": "uuid"
  }
}
```

### 2. Create Reel
```
POST /api/reels
Headers: X-Admin-Key: your-api-key
Content-Type: application/json

Body:
{
  "category": "fashion",
  "video_url": "https://...",
  "thumbnail_url": "https://...",
  "product_ids": ["product-uuid-1", "product-uuid-2"]
}
```

### 3. Update Reel
```
PUT /api/reels/:id
Headers: X-Admin-Key: your-api-key
```

### 4. Delete Reel
```
DELETE /api/reels/:id
Headers: X-Admin-Key: your-api-key
```

---

# Admin Panel Implementation (Next.js)

## 1. Upload Component

```tsx
// components/ReelUploader.tsx
'use client';

import { useState, useRef } from 'react';

interface UploadResult {
  video_url: string;
  thumbnail_url: string | null;
  reelId: string;
}

export function ReelUploader({ onUpload }: { onUpload: (result: UploadResult) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    setPreview(URL.createObjectURL(file));
    
    // Upload
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/admin/upload/video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      onUpload(data.data);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="reel-uploader">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleFileSelect}
        hidden
      />
      
      {preview ? (
        <div className="preview">
          <video src={preview} controls width={300} />
          {uploading && (
            <div className="progress-bar">
              <div style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}>
          Select Video
        </button>
      )}

      {uploading && <p>Processing video... (compressing & generating thumbnail)</p>}
    </div>
  );
}
```

## 2. Server-Side API Route

```ts
// app/api/admin/upload/video/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.ADMIN_API_KEY;

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const response = await fetch(`${API_URL}/api/upload/video`, {
    method: 'POST',
    headers: {
      'X-Admin-Key': API_KEY!,
    },
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

## 3. Create Reel Form

```tsx
// components/CreateReelForm.tsx
'use client';

import { useState } from 'react';
import { ReelUploader } from './ReelUploader';

export function CreateReelForm() {
  const [videoData, setVideoData] = useState<{
    video_url: string;
    thumbnail_url: string | null;
  } | null>(null);
  const [category, setCategory] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!videoData || !category) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          video_url: videoData.video_url,
          thumbnail_url: videoData.thumbnail_url,
          product_ids: productIds,
        }),
      });

      if (!response.ok) throw new Error('Failed to create reel');
      
      alert('Reel created successfully!');
      // Reset form
      setVideoData(null);
      setCategory('');
      setProductIds([]);
    } catch (error) {
      console.error(error);
      alert('Failed to create reel');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-reel-form">
      <h2>Create New Reel</h2>

      {/* Video Upload */}
      <ReelUploader onUpload={setVideoData} />

      {videoData && (
        <>
          {/* Category */}
          <label>
            Category:
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              <option value="fashion">Fashion</option>
              <option value="beauty">Beauty</option>
              <option value="lifestyle">Lifestyle</option>
            </select>
          </label>

          {/* Product Selection - implement product picker */}
          <ProductPicker 
            selected={productIds} 
            onChange={setProductIds} 
          />

          <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Reel'}
          </button>
        </>
      )}
    </div>
  );
}
```

---

# Mobile App Implementation (Flutter)

## 1. Reel Model

```dart
class Reel {
  final String id;
  final String category;
  final String videoUrl;
  final String? thumbnailUrl;
  final List<String> productIds;
  final int views;
  final int likes;
  final DateTime createdAt;
  final List<Product>? products;

  Reel({
    required this.id,
    required this.category,
    required this.videoUrl,
    this.thumbnailUrl,
    required this.productIds,
    required this.views,
    required this.likes,
    required this.createdAt,
    this.products,
  });

  factory Reel.fromJson(Map<String, dynamic> json) {
    return Reel(
      id: json['id'],
      category: json['category'],
      videoUrl: json['video_url'],
      thumbnailUrl: json['thumbnail_url'],
      productIds: List<String>.from(json['product_ids'] ?? []),
      views: json['views'] ?? 0,
      likes: json['likes'] ?? 0,
      createdAt: DateTime.parse(json['created_at']),
      products: json['products'] != null
          ? List<Product>.from(json['products'].map((p) => Product.fromJson(p)))
          : null,
    );
  }
}
```

## 2. Reel Service

```dart
import 'package:dio/dio.dart';

class ReelService {
  static const _baseUrl = 'https://megg-api.vercel.app';
  final _dio = Dio();

  Future<List<Reel>> getReels({int page = 1, int limit = 20}) async {
    final response = await _dio.get(
      '$_baseUrl/api/reels',
      queryParameters: {'page': page, 'limit': limit},
    );

    if (response.data['success']) {
      final reels = response.data['data']['reels'] as List;
      return reels.map((r) => Reel.fromJson(r)).toList();
    }
    throw Exception('Failed to load reels');
  }

  Future<List<Reel>> getReelsByCategory(String category) async {
    final response = await _dio.get('$_baseUrl/api/reels/category/$category');
    
    if (response.data['success']) {
      final reels = response.data['data']['reels'] as List;
      return reels.map((r) => Reel.fromJson(r)).toList();
    }
    throw Exception('Failed to load reels');
  }

  Future<Reel> getReelWithProducts(String id) async {
    final response = await _dio.get('$_baseUrl/api/reels/$id/products');
    
    if (response.data['success']) {
      return Reel.fromJson(response.data['data']);
    }
    throw Exception('Failed to load reel');
  }

  Future<void> trackView(String id) async {
    await _dio.post('$_baseUrl/api/reels/$id/view');
  }

  Future<void> likeReel(String id) async {
    await _dio.post('$_baseUrl/api/reels/$id/like');
  }
}
```

## 3. Reels Feed Widget (TikTok-style)

```dart
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ReelsFeed extends StatefulWidget {
  @override
  _ReelsFeedState createState() => _ReelsFeedState();
}

class _ReelsFeedState extends State<ReelsFeed> {
  final _reelService = ReelService();
  final _pageController = PageController();
  List<Reel> _reels = [];
  int _currentPage = 0;
  VideoPlayerController? _videoController;

  @override
  void initState() {
    super.initState();
    _loadReels();
  }

  Future<void> _loadReels() async {
    final reels = await _reelService.getReels();
    setState(() => _reels = reels);
    if (reels.isNotEmpty) {
      _initializeVideo(0);
    }
  }

  void _initializeVideo(int index) async {
    _videoController?.dispose();
    
    _videoController = VideoPlayerController.network(_reels[index].videoUrl);
    await _videoController!.initialize();
    _videoController!.setLooping(true);
    _videoController!.play();
    
    // Track view after 3 seconds
    Future.delayed(Duration(seconds: 3), () {
      _reelService.trackView(_reels[index].id);
    });
    
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        itemCount: _reels.length,
        onPageChanged: (index) {
          _initializeVideo(index);
          setState(() => _currentPage = index);
        },
        itemBuilder: (context, index) {
          final reel = _reels[index];
          final isActive = index == _currentPage;

          return Stack(
            fit: StackFit.expand,
            children: [
              // Video or Thumbnail
              if (isActive && _videoController?.value.isInitialized == true)
                FittedBox(
                  fit: BoxFit.cover,
                  child: SizedBox(
                    width: _videoController!.value.size.width,
                    height: _videoController!.value.size.height,
                    child: VideoPlayer(_videoController!),
                  ),
                )
              else if (reel.thumbnailUrl != null)
                CachedNetworkImage(
                  imageUrl: reel.thumbnailUrl!,
                  fit: BoxFit.cover,
                ),

              // Overlay - Actions
              Positioned(
                right: 16,
                bottom: 100,
                child: Column(
                  children: [
                    // Like
                    IconButton(
                      icon: Icon(Icons.favorite_border, color: Colors.white, size: 32),
                      onPressed: () => _reelService.likeReel(reel.id),
                    ),
                    Text('${reel.likes}', style: TextStyle(color: Colors.white)),
                    
                    SizedBox(height: 16),
                    
                    // Products
                    IconButton(
                      icon: Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 32),
                      onPressed: () => _showProducts(reel.id),
                    ),
                    Text('${reel.productIds.length}', style: TextStyle(color: Colors.white)),
                  ],
                ),
              ),

              // Category badge
              Positioned(
                left: 16,
                bottom: 100,
                child: Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    '#${reel.category}',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showProducts(String reelId) async {
    final reel = await _reelService.getReelWithProducts(reelId);
    
    showModalBottomSheet(
      context: context,
      builder: (context) => ProductsSheet(products: reel.products ?? []),
    );
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _pageController.dispose();
    super.dispose();
  }
}
```

## 4. Products Bottom Sheet

```dart
class ProductsSheet extends StatelessWidget {
  final List<Product> products;

  ProductsSheet({required this.products});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 300,
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Products in this Reel',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: products.length,
              itemBuilder: (context, index) {
                final product = products[index];
                return ProductCard(
                  product: product,
                  onTap: () => launchUrl(Uri.parse(product.affiliateLink)),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## Video Specs

The API automatically:
- **Compresses** videos to 720p, ~1Mbps bitrate
- **Generates** thumbnails at 480p
- **Optimizes** for mobile streaming (faststart enabled)

**Recommended Upload:**
- Format: MP4, WebM, MOV
- Max size: 100MB
- Duration: 15-60 seconds recommended
