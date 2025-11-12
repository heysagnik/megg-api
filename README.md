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

