# Cloudflare Worker - Edge Cache for megg-api

This Cloudflare Worker provides edge caching in front of your Vercel API, reducing origin requests by up to 90%.

## Free Tier Benefits
- **100,000 requests/day** (unlimited for read-heavy apps)
- **Global edge network** (300+ locations)
- **Zero cold starts** (unlike serverless functions)
- **DDoS protection** included

## Quick Setup

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
# Or use npx
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Configure Your Origin
Edit `wrangler.toml` and set your Vercel URL:
```toml
[vars]
ORIGIN_URL = "https://your-app.vercel.app"
```

### 4. Deploy
```bash
cd cloudflare-worker
npm install
npm run deploy
```

### 5. Update Your Frontend
Point your API calls to the Worker URL:
```javascript
// Before
const API_URL = 'https://your-app.vercel.app/api';

// After
const API_URL = 'https://megg-api-edge-cache.your-subdomain.workers.dev/api';
```

## Custom Domain (Recommended)

1. Add your domain to Cloudflare (free plan works)
2. Update `wrangler.toml`:
```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```
3. Redeploy: `npm run deploy`

## Cache Configuration

| Endpoint | Cache TTL | Stale-While-Revalidate |
|----------|-----------|------------------------|
| `/api/color-combos` | 30 min | 1 hour |
| `/api/categories` | 1 hour | 2 hours |
| `/api/offers` | 5 min | 10 min |
| `/api/reels` | 5 min | 10 min |
| `/api/products` | 1 min | 5 min |
| `/api/trending` | 5 min | 10 min |

## Never Cached Routes
- `/api/auth/*` - Authentication
- `/api/admin/*` - Admin operations
- `/api/wishlist/*` - User-specific data
- `/api/upload/*` - File uploads

## Cache Purge API

When you update data in your admin panel, purge the cache:

```bash
curl -X POST https://your-worker.workers.dev/__worker/purge \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"paths": ["/api/products", "/api/color-combos"]}'
```

Set your purge token in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Settings → Variables
4. Add `PURGE_TOKEN` as a secret

## Monitoring

### Check Worker Health
```bash
curl https://your-worker.workers.dev/__worker/health
```

Response:
```json
{
  "status": "ok",
  "edge": "SIN",
  "timestamp": "2024-12-13T16:00:00.000Z"
}
```

### View Cache Status
Check response headers:
- `X-Cache-Status: HIT` - Served from edge cache
- `X-Cache-Status: MISS` - Fetched from Vercel
- `X-Edge-Location: SIN` - Edge location code

### View Logs
```bash
npm run tail
```

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Vercel Requests | 100% | ~10-20% |
| Response Time | 200-500ms | 10-50ms |
| Supabase Bandwidth | 2 GB | ~200 MB |
| Supported MAU | ~500 | ~5,000+ |

## Troubleshooting

### Cache not working
1. Check route isn't in `NO_CACHE_ROUTES`
2. Verify response status is 200
3. Check for `Cache-Control: no-cache` in origin response

### Origin errors
1. Verify `ORIGIN_URL` is correct
2. Check Vercel deployment is running
3. View worker logs: `npm run tail`

### High latency
1. Ensure you're testing from different regions
2. First request is always a cache miss
3. Check edge location in response headers
