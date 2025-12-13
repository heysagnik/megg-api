# megg-api Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                        │
│                    ┌──────────────┐  ┌──────────────┐                       │
│                    │  Mobile App  │  │ Web Admin    │                       │
│                    └──────┬───────┘  └──────┬───────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                            │                  │
                            ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EDGE LAYER                                          │
│                 ┌─────────────────────────────┐                             │
│                 │   Cloudflare Worker         │                             │
│                 │   api.megg.workers.dev      │                             │
│                 │   (Edge Cache + CDN)        │                             │
│                 └──────────────┬──────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPUTE LAYER                                       │
│                 ┌─────────────────────────────┐                             │
│                 │   Vercel Serverless         │                             │
│                 │   megg-api.vercel.app       │                             │
│                 │   (Express.js API)          │                             │
│                 └──────────────┬──────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Upstash Redis   │  │    Supabase      │  │   Cloudinary     │
│  (App Cache)     │  │   (PostgreSQL)   │  │  (Media Storage) │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Directory Structure

```
megg-api/
├── src/
│   ├── config/           # External service configs
│   │   ├── supabase.js   # Database client
│   │   ├── cloudinary.js # Media storage
│   │   ├── firebase.js   # Push notifications
│   │   └── constants.js  # App constants & enums
│   │
│   ├── controllers/      # Request handlers (14 files)
│   ├── services/         # Business logic (14 files)
│   ├── routes/           # API endpoints (15 files)
│   │
│   ├── middleware/
│   │   ├── auth.js       # JWT authentication
│   │   ├── rateLimiter.js
│   │   ├── upload.js     # Multer config
│   │   └── validate.js   # Zod validation
│   │
│   ├── utils/
│   │   ├── cache.js      # Upstash Redis
│   │   ├── cloudinary.js # URL transformations
│   │   └── errors.js     # Custom errors
│   │
│   └── index.js          # Express app entry
│
├── cloudflare-worker/    # Edge cache layer
│   ├── src/index.js
│   └── wrangler.toml
│
└── schema.sql            # Database schema
```

---

## API Endpoints

| Route | Purpose | Auth | Cache TTL |
|-------|---------|------|-----------|
| `GET /api/products` | Product catalog | Optional | 60s |
| `GET /api/products/:id` | Product details | Optional | 60s |
| `GET /api/color-combos` | Color combinations | No | 30 min |
| `GET /api/reels` | Video content | No | 5 min |
| `GET /api/offers` | Promotional banners | No | 5 min |
| `GET /api/trending` | Popular products | No | 5 min |
| `GET /api/search` | Smart search | No | 60s |
| `GET /api/wishlist` | User favorites | Required | None |
| `POST /api/auth/*` | Authentication | No | None |
| `* /api/admin/*` | Admin operations | Admin | None |

---

## Data Flow

```
Request Flow:
═════════════

1. Client Request
       │
       ▼
2. Cloudflare Worker (Edge Cache)
       │
       ├── Cache HIT → Return immediately (10-50ms)
       │
       └── Cache MISS
              │
              ▼
3. Vercel Serverless Function
       │
       ▼
4. Redis Cache Check (Upstash)
       │
       ├── Cache HIT → Return data
       │
       └── Cache MISS
              │
              ▼
5. Database Query (Supabase)
       │
       ▼
6. Response + Cache Update
```

---

## Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `products` | Product catalog | id, name, price, brand, images[], category |
| `reels` | Video content | id, video_url, thumbnail_url, views, likes |
| `color_combos` | Color pairings | id, name, color_a, color_b, product_ids[] |
| `users` | User profiles | id, full_name, avatar_url |
| `wishlist` | Saved products | user_id, product_id |
| `trending_clicks` | Click tracking | product_id, clicked_at |
| `offers` | Promotional banners | id, title, banner_image, affiliate_link |
| `category_banners` | Category headers | category, banner_image |

---

## Caching Strategy

| Layer | Technology | TTL | Purpose |
|-------|------------|-----|---------|
| Edge | Cloudflare Workers | 1-30 min | Global latency (10-50ms) |
| App | Upstash Redis | 5-30 min | Reduce DB queries |
| CDN | Vercel Edge | 60s | HTTP response caching |

---

## Authentication

```
Auth Flow:
══════════
User → Google OAuth → Supabase Auth → JWT Token
                                          │
                                          ▼
                           ┌──────────────────────────┐
                           │  Bearer Token in Header  │
                           └──────────────────────────┘
                                          │
                                          ▼
                           ┌──────────────────────────┐
                           │  Middleware Verification │
                           │  • authenticate          │
                           │  • optionalAuth          │
                           │  • requireAdmin          │
                           └──────────────────────────┘
```

---

## Technology Stack

| Component | Technology | Free Tier Limit |
|-----------|------------|-----------------|
| API Hosting | Vercel | 100 GB bandwidth |
| Database | Supabase PostgreSQL | 500 MB storage, 2 GB bandwidth |
| App Cache | Upstash Redis | 10K requests/day |
| Edge Cache | Cloudflare Workers | 100K requests/day |
| Media Storage | Cloudinary | 25 credits/month |
| Push Notifications | Firebase FCM | Unlimited |
| Auth | Supabase Auth | 50K MAU |
