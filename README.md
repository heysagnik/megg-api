# MEGG Fashion API

Modern backend API for MEGG Fashion built with Node.js, Express, Neon PostgreSQL, Cloudflare R2, and Upstash Redis.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Neon PostgreSQL (serverless)
- **Storage**: Cloudflare R2 (media files)
- **Cache**: Upstash Redis + Cloudflare KV (dual-layer)
- **Auth**: Better Auth (Google OAuth)
- **Edge**: Cloudflare Workers (load distribution)
- **Deployment**: Vercel (origin) + Cloudflare Workers (edge)

## Features

- Product catalog with advanced search
- User authentication (Google OAuth)
- Wishlist management
- Video reels with product tagging
- Color combinations & outfit recommendations
- Push notifications (Firebase FCM)
- Admin analytics dashboard
- Dual-layer caching for optimal performance
- Rate limiting with Redis persistence

## Prerequisites

- Node.js 18+
- Neon PostgreSQL database
- Cloudflare R2 bucket
- Upstash Redis instance
- Firebase project (for FCM)
- Google OAuth credentials

## Installation

```bash
git clone <repository-url>
cd megg-api
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

See `.env.example` for all required environment variables.

## Database Setup

Run the schema in your Neon database:

```bash
psql $DATABASE_URL < neon-schema.sql
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

Test endpoints:
```bash
npm run test:endpoints
```

## API Endpoints

### Public Routes
- `GET /api/health` - Health check
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `GET /api/search` - Search products
- `GET /api/trending/products` - Trending products
- `GET /api/reels` - List video reels
- `GET /api/color-combos` - Color combinations
- `GET /api/outfits` - Outfit suggestions
- `GET /api/banners` - Category banners
- `GET /api/offers` - Active offers

### Protected Routes (Require Auth)
- `GET /api/wishlist` - User's wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:id` - Remove from wishlist

### Admin Routes (Require API Key)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/admin/analytics/*` - Analytics endpoints

## Architecture

### Dual-Layer Caching
1. **Edge Layer**: Cloudflare KV cache at edge locations
2. **Origin Layer**: Upstash Redis for fallback caching
3. **Cache Invalidation**: Synchronized across both layers

### Load Distribution
- Cloudflare Worker handles read operations at edge
- Vercel backend handles writes and fallback reads
- Automatic failover between layers

## Project Structure

```
src/
  config/          # Database, R2, Redis, Firebase
  controllers/     # Route handlers
  middleware/      # Auth, validation, rate limiting
  routes/          # API routes
  services/        # Business logic with caching
  utils/           # Cache, logger, queue
  validators/      # Zod input validation
scripts/           # Utility scripts
cloudflare-worker/ # Edge worker code
```

## Performance

- Average response time: 10-50ms (with cache)
- Cache hit rate: 90%+
- Daily capacity: 5000+ users on free tier
- Session caching reduces auth queries by 90%

## Scripts

- `npm run test:endpoints` - Test all public endpoints
- `npm run cleanup:r2-reels` - Clean R2 reel videos

## Deployment

### Vercel (Origin)
```bash
vercel deploy
```

### Cloudflare Worker (Edge)
```bash
cd cloudflare-worker
wrangler deploy
```

## Troubleshooting

- **401 errors**: Check auth configuration and token validity
- **Cache issues**: Verify Redis and KV credentials
- **Rate limiting**: Check Redis connection for persistence
- **Slow queries**: Verify database connection pooling
- **Media uploads**: Check R2 credentials and bucket permissions

## License

MIT

## Support

Open an issue with reproduction steps and logs.
