# MEGG Fashion Discovery API# Fashion Discovery API



A production-ready RESTful API for a men's fashion discovery platform. Built with Node.js, Express, Supabase (PostgreSQL), and Cloudinary for scalable fashion e-commerce.A production-ready backend API for a men's fashion discovery application built with Node.js, Express.js, Supabase, and Cloudinary.



## 🚀 Features## Features



- **🔐 Authentication**: Google OAuth via Supabase Auth- **Authentication**: Google OAuth via Supabase Auth

- **👕 Product Catalog**: 15 categories, 70+ subcategories with full-text search- **Product Management**: CRUD operations with filtering, search, and recommendations

- **🎨 Color Combinations**: AI-powered color matching with seasonal grouping- **Outfits**: Daily outfits, color-based outfit suggestions, and user-created outfits

- **👔 Outfits**: Curated outfit collections with affiliate links- **Trending Products**: Click tracking and analytics

- **📊 Analytics**: Product click tracking and trending algorithms- **Offers & Promotions**: Time-based offers with product associations

- **🎥 Reels**: Short video content (11 categories) hosted on Cloudinary- **Reels & Tips**: Video content with fashion tips and product tagging

- **💝 Wishlist**: User-specific product wishlists- **Wishlist**: User-specific product wishlists

- **🎁 Offers**: Promotional banners and category advertisements- **Admin Dashboard**: Analytics, trending data, and click tracking

- **🔒 Security**: Row-level security, JWT auth, rate limiting, Helmet.js- **Security**: Row-level security, JWT authentication, rate limiting

- **⚡ Performance**: Optimized for Vercel free tier with smart caching- **Optimized**: Free tier optimized for Vercel and Supabase



## 📋 Table of Contents## Tech Stack



- [Tech Stack](#-tech-stack)- **Runtime**: Node.js

- [Database Schema](#-database-schema)- **Framework**: Express.js

- [Installation](#-installation)- **Database**: Supabase (PostgreSQL)

- [API Documentation](#-api-documentation)- **Authentication**: Supabase Auth

- [Deployment](#-deployment)- **Storage**: Supabase Storage + Cloudinary

- [Environment Variables](#-environment-variables)- **Validation**: Zod

- **Security**: Helmet, CORS, Rate Limiting

## 🛠 Tech Stack

## Project Structure

**Backend**

- Node.js 18+```

- Express.js 4.xmegg-api/

- Supabase (PostgreSQL 15)├── src/

│   ├── config/          # Configuration files (Supabase, Cloudinary)

**Authentication & Storage**│   ├── controllers/     # Request handlers

- Supabase Auth (Google OAuth)│   ├── middleware/      # Auth, validation, error handling, rate limiting

- Supabase Storage (images)│   ├── routes/          # API route definitions

- Cloudinary (video hosting)│   ├── services/        # Business logic layer

│   ├── utils/           # Helper functions and custom errors

**Validation & Security**│   ├── validators/      # Zod validation schemas

- Zod (schema validation)│   └── index.js         # Main application entry point

- Helmet.js (security headers)├── schema.sql           # Database schema and RLS policies

- Express Rate Limit├── package.json

- Row-Level Security (RLS)├── vercel.json          # Vercel deployment configuration

└── README.md

**File Upload**```

- Multer (multipart/form-data)

# MEGG Fashion API

Minimal backend API for MEGG Fashion built with Node.js, Express, Supabase (PostgreSQL) and Cloudinary.

## Overview
Provides authentication (Google OAuth via Supabase Auth), product catalog, outfits, color combos, reels, offers, wishlist, and basic analytics (click tracking). Full database schema with RLS is in `schema.sql`.

## Prerequisites
- Node.js 18+
- Supabase project (URL, anon key, service role key)
- Cloudinary account (Cloud name, API key, API secret)

## Installation
```bash
git clone <repository-url>
cd megg-api
npm install
```

## Environment Variables (`.env`)
```
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ADMIN_USER_IDS=uuid1,uuid2
```

## Running
Development (auto-reload):
```bash
npm run dev
```
Production:
```bash
npm start
```
Local base URL: `http://localhost:3000/api`

## Database Setup
Run the contents of `schema.sql` in the Supabase SQL Editor before starting the API.

## Authentication
All protected routes require:
```
Authorization: Bearer <supabase_access_token>
```
Google OAuth must be enabled in Supabase Authentication → Providers.

## Key Endpoints (summary)
- `GET /api/products` list/filter products
- `GET /api/outfits` list outfits
- `GET /api/color-combos` list color combos
- `GET /api/reels` list reels
- `GET /api/trending/products` trending products
- `GET /api/wishlist` user wishlist (auth)
- `POST /api/auth/google` exchange Google token

Refer to `postman_collection.json` for full request examples.

## Deployment (Vercel)
1. Run locally and verify.
2. Deploy with `vercel` (ensure environment variables set in dashboard).
3. Update `FRONTEND_URL` to production URL.

## Project Structure
```
src/
  config/        # Supabase, Cloudinary
  controllers/   # Route handlers
  middleware/    # Auth, validation, error, rate limiting
  routes/        # Express route definitions
  services/      # Business logic
  utils/         # Errors
  validators/    # Zod schemas
schema.sql       # Database schema + RLS
```

## Troubleshooting
- 401 / auth errors: check Supabase keys and OAuth configuration.
- RLS blocks: confirm `schema.sql` executed fully (service role key required for server).
- Cloudinary failures: verify credentials.
- Missing data: ensure initial products inserted (not included in schema).

## License
MIT

## Contributing
Pull requests welcome. Keep changes small and documented.

## Support
Open an issue with reproduction steps and relevant logs.

