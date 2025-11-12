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

- Cloudinary SDK## Installation



## 📊 Database Schema### Prerequisites



### Tables (10)- Node.js 18+ installed

- Supabase account and project

1. **users** - User profiles (extends auth.users)- Cloudinary account (for video hosting)

2. **products** - Product catalog (15 categories, 70+ subcategories)

3. **outfits** - Curated outfit collections### Step 1: Clone and Install Dependencies

4. **color_combos** - Color combinations (summer, winter, casual, formal)

5. **trending_clicks** - Click analytics and tracking```bash

6. **offers** - Promotional offersgit clone <repository-url>

7. **reels** - Video content (11 categories)cd megg-api

8. **reel_likes** - User engagement trackingnpm install

9. **wishlist** - User wishlists```

10. **category_banners** - Advertisement banners

### Step 2: Environment Variables

### Product Categories (15)

Create a `.env` file in the root directory:

- Jacket, Hoodies, Sweater, Sweatshirt, Shirt

- Jeans, Trackpants, Shoes, Tshirt```env

- Mens Accessories, Sports, Office wearPORT=3000

- Skin care, Traditional, PerfumeNODE_ENV=development



### Video Categories (11)# Supabase Configuration

SUPABASE_URL=your_supabase_project_url

- Office fit, Layering outfit, Winter fit, Festive fitSUPABASE_ANON_KEY=your_supabase_anon_key

- Travel fit, Personality development, Date fitSUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

- Colour combo, College fit, Party fit, Airport look

# Cloudinary Configuration

### Key FeaturesCLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

CLOUDINARY_API_KEY=your_cloudinary_api_key

✅ Full-text search with tsvector  CLOUDINARY_API_SECRET=your_cloudinary_api_secret

✅ Trigram indexes for fuzzy matching  

✅ 40+ performance indexes  # Application Configuration

✅ CASCADE deletion with auto-cleanup  ADMIN_USER_IDS=uuid1,uuid2,uuid3

✅ Automatic click tracking  FRONTEND_URL=http://localhost:3000

✅ View/like counters for reels  ```



## 🏗 Installation### Step 3: Supabase Setup



### Prerequisites1. **Run Database Schema**

   - Go to Supabase Dashboard → SQL Editor

- Node.js 18+ ([Download](https://nodejs.org/))   - Copy contents of `schema.sql` and execute

- Supabase account ([Sign up](https://supabase.com/))

- Cloudinary account ([Sign up](https://cloudinary.com/))2. **Configure Google OAuth**

   - Go to Authentication → Providers

### Step 1: Clone & Install   - Enable Google provider

   - Add your Google OAuth credentials

```bash

git clone <repository-url>3. **Create Storage Buckets**

cd megg-api   - Go to Storage

npm install   - Create the following public buckets:

```     - `product-images`

     - `outfit-banners`

### Step 2: Environment Setup     - `offer-banners`

     - `reel-thumbnails`

Create `.env` file:   - Set all buckets to public read access



```env4. **Get Your Keys**

# Server Configuration   - Go to Project Settings → API

PORT=3000   - Copy `URL`, `anon/public key`, and `service_role key`

NODE_ENV=development

FRONTEND_URL=http://localhost:3000### Step 4: Cloudinary Setup



# Supabase1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)

SUPABASE_URL=https://your-project.supabase.co2. Go to Dashboard

SUPABASE_ANON_KEY=your_anon_key3. Copy your Cloud Name, API Key, and API Secret

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key4. Add them to your `.env` file



# Cloudinary (for video hosting)### Step 5: Run the Application

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_keyDevelopment mode:

CLOUDINARY_API_SECRET=your_api_secret```bash

npm run dev

# Admin Access (comma-separated UUIDs)```

ADMIN_USER_IDS=uuid1,uuid2,uuid3

```Production mode:

```bash

### Step 3: Database Setupnpm start

```

1. **Create Supabase Project** at [supabase.com](https://supabase.com)

The API will be available at `http://localhost:3000`

2. **Run Schema**

   - Go to SQL Editor in Supabase Dashboard## API Documentation

   - Copy entire `schema.sql` content

   - Execute (creates tables, indexes, functions, triggers, RLS policies)### Base URL

```

3. **Create Storage Buckets**Local: http://localhost:3000/api

   - Go to Storage → Create bucketProduction: https://your-app.vercel.app/api

   - Create public buckets:```

     - `product-images`

     - `outfit-banners`### Authentication

     - `offer-banners`

     - `category-banners`All authenticated endpoints require an `Authorization` header:

     - `color-combo-images````

Authorization: Bearer <supabase_access_token>

4. **Enable Google OAuth**```

   - Go to Authentication → Providers

   - Enable Google### Endpoints

   - Add Client ID and Secret from Google Cloud Console

   - Add authorized redirect URI#### Auth Routes (`/api/auth`)



### Step 4: Run Application| Method | Endpoint | Auth | Description |

|--------|----------|------|-------------|

Development:| POST | `/google` | No | Exchange Google token for user session |

```bash| GET | `/profile` | Yes | Get current user profile |

npm run dev| PUT | `/profile` | Yes | Update user profile |

```

#### Product Routes (`/api/products`)

Production:

```bash| Method | Endpoint | Auth | Description |

npm start|--------|----------|------|-------------|

```| GET | `/` | No | List products (query: category, color, search, page, limit) |

| GET | `/:id` | No | Get single product with recommendations |

API available at: `http://localhost:3000`| GET | `/:id/related` | No | Get related products by category |

| POST | `/` | Admin | Create new product |

## 📚 API Documentation| PUT | `/:id` | Admin | Update product |

| DELETE | `/:id` | Admin | Soft delete product |

### Base URL

#### Outfit Routes (`/api/outfits`)

```

Development: http://localhost:3000/api| Method | Endpoint | Auth | Description |

Production: https://your-app.vercel.app/api|--------|----------|------|-------------|

```| GET | `/` | No | List all outfits (paginated) |

| GET | `/daily` | No | Get today's daily outfit |

### Authentication| GET | `/by-color` | No | Get outfits by color (query: color) |

| GET | `/:id` | No | Get outfit details with products |

Protected endpoints require Bearer token:| POST | `/` | Yes | Create new outfit |



```http#### Color Combo Routes (`/api/color-combos`)

Authorization: Bearer <supabase_access_token>

```| Method | Endpoint | Auth | Description |

|--------|----------|------|-------------|

### API Endpoints| GET | `/` | No | List all color combinations |

| GET | `/:id/outfits` | No | Get outfits for specific combo |

#### 🔐 Authentication (`/api/auth`)

#### Trending Routes (`/api/trending`)

| Method | Endpoint | Auth | Description |

|--------|----------|------|-------------|| Method | Endpoint | Auth | Description |

| POST | `/google` | ❌ | Exchange Google token for session ||--------|----------|------|-------------|

| GET | `/profile` | ✅ | Get current user profile || GET | `/products` | No | Get trending products (top 10) |

| PUT | `/profile` | ✅ | Update user profile || POST | `/click/:productId` | Optional | Track product click |



#### 👕 Products (`/api/products`)#### Offer Routes (`/api/offers`)



| Method | Endpoint | Auth | Description || Method | Endpoint | Auth | Description |

|--------|----------|------|-------------||--------|----------|------|-------------|

| GET | `/` | ❌ | List products (paginated, filterable) || GET | `/` | No | List active offers |

| GET | `/category/:category` | ❌ | Get products by category || GET | `/:id` | No | Get offer details with products |

| GET | `/:id` | ❌ | Get product with recommendations || POST | `/` | Admin | Create new offer |

| POST | `/` | 🔒 Admin | Create product || PUT | `/:id` | Admin | Update offer |

| PUT | `/:id` | 🔒 Admin | Update product || DELETE | `/:id` | Admin | Delete offer |

| DELETE | `/:id` | 🔒 Admin | Delete product |

#### Reel Routes (`/api/reels`)

**Query Parameters:**

- `category` - Filter by category| Method | Endpoint | Auth | Description |

- `subcategory` - Filter by subcategory|--------|----------|------|-------------|

- `color` - Filter by color| GET | `/` | No | List reels (paginated) |

- `sort` - popularity | price_asc | price_desc | newest | oldest | clicks| GET | `/:id` | No | Get reel details with products |

- `page` - Page number (default: 1)| POST | `/:id/view` | No | Increment view count |

- `limit` - Items per page (default: 20, max: 100)| POST | `/` | Admin | Create new reel |

| PUT | `/:id` | Admin | Update reel |

#### 🔍 Search (`/api/search`)| DELETE | `/:id` | Admin | Delete reel |



| Method | Endpoint | Auth | Description |#### Wishlist Routes (`/api/wishlist`)

|--------|----------|------|-------------|

| GET | `/unified` | ❌ | Smart search with auto-filtering || Method | Endpoint | Auth | Description |

| GET | `/suggestions` | ❌ | Search suggestions (autocomplete) ||--------|----------|------|-------------|

| GET | `/` | Yes | Get user's wishlist |

**Unified Search Query:**| POST | `/` | Yes | Add product to wishlist |

- `query` - Text search (optional)| DELETE | `/:productId` | Yes | Remove from wishlist |

- `category` - Category filter (optional)

- `subcategory` - Subcategory filter (optional)#### Admin Routes (`/api/admin`)

- `color` - Color filter (optional)

- `sort` - Sorting method| Method | Endpoint | Auth | Description |

- `page` - Page number|--------|----------|------|-------------|

- `limit` - Results per page| GET | `/analytics/overview` | Admin | Dashboard stats (users, products, clicks) |

| GET | `/analytics/trending` | Admin | Top 20 trending products |

#### 👔 Outfits (`/api/outfits`)| GET | `/analytics/clicks` | Admin | Click analytics with date filters |



| Method | Endpoint | Auth | Description |## Rate Limiting

|--------|----------|------|-------------|

| GET | `/` | ❌ | List all outfits |- **General endpoints**: 100 requests per 15 minutes

| GET | `/:id` | ❌ | Get outfit details |- **Auth endpoints**: 5 requests per 15 minutes

| POST | `/` | 🔒 Admin | Create outfit |- **Admin endpoints**: 10 requests per 15 minutes

| PUT | `/:id` | 🔒 Admin | Update outfit |

| DELETE | `/:id` | 🔒 Admin | Delete outfit |## Database Schema



#### 🎨 Color Combos (`/api/color-combos`)### Main Tables



| Method | Endpoint | Auth | Description |- **users**: User profiles linked to auth.users

|--------|----------|------|-------------|- **products**: Product catalog with 15 menswear categories

| GET | `/` | ❌ | List color combinations (optional: ?group=summer/winter/casual/formal) |- **outfits**: Curated outfit collections

| GET | `/:id/products` | ❌ | Get products for color combo |- **color_combos**: Color combination suggestions

| POST | `/` | 🔒 Admin | Create color combo |- **trending_clicks**: Click tracking for analytics

| PUT | `/:id` | 🔒 Admin | Update color combo |- **offers**: Time-based promotional offers

| DELETE | `/:id` | 🔒 Admin | Delete color combo |- **reels**: Video content with fashion tips

- **wishlist**: User-specific wishlists

#### 📊 Trending (`/api/trending`)

### Product Categories

| Method | Endpoint | Auth | Description |

|--------|----------|------|-------------|1. T-Shirts

| GET | `/products` | ❌ | Get trending products (top 10) |2. Shirts

| POST | `/click/:productId` | ❌ | Track product click |3. Polos

4. Hoodies

#### 🎁 Offers (`/api/offers`)5. Jackets

6. Blazers

| Method | Endpoint | Auth | Description |7. Jeans

|--------|----------|------|-------------|8. Chinos

| GET | `/` | ❌ | List active offers |9. Shorts

| GET | `/:id` | ❌ | Get offer details |10. Sneakers

| POST | `/` | 🔒 Admin | Create offer |11. Formal Shoes

| PUT | `/:id` | 🔒 Admin | Update offer |12. Watches

| DELETE | `/:id` | 🔒 Admin | Delete offer |13. Bags

14. Belts

#### 🎥 Reels (`/api/reels`)15. Sunglasses



| Method | Endpoint | Auth | Description |## Security Features

|--------|----------|------|-------------|

| GET | `/` | ❌ | List all reels |- **Row-Level Security (RLS)**: All tables have RLS policies

| GET | `/category/:category` | ❌ | Filter reels by category |- **JWT Authentication**: Supabase Auth tokens

| GET | `/:id/products` | ❌ | Get reel with product details |- **Admin Authorization**: Specific user IDs for admin access

| GET | `/liked` | ✅ | Get user's liked reels |- **Rate Limiting**: Per-endpoint rate limits

| POST | `/:id/view` | ❌ | Increment view count |- **Helmet.js**: Security headers

| POST | `/:id/like` | ❌ | Toggle like/unlike |- **CORS**: Configurable origin restrictions

| POST | `/` | 🔒 Admin | Create reel |

| PUT | `/:id` | 🔒 Admin | Update reel |## Deployment

| DELETE | `/:id` | 🔒 Admin | Delete reel (removes Cloudinary video) |

### Deploy to Vercel

#### 💝 Wishlist (`/api/wishlist`)

1. **Install Vercel CLI**

| Method | Endpoint | Auth | Description |```bash

|--------|----------|------|-------------|npm i -g vercel

| GET | `/` | ✅ | Get user wishlist |```

| POST | `/` | ✅ | Add to wishlist (body: `{productId}`) |

| DELETE | `/:productId` | ✅ | Remove from wishlist |2. **Login to Vercel**

```bash

#### 📤 Upload (`/api/upload`)vercel login

```

| Method | Endpoint | Auth | Description |

|--------|----------|------|-------------|3. **Deploy**

| POST | `/images` | 🔒 Admin | Upload product images (multipart) |```bash

| POST | `/video` | 🔒 Admin | Upload reel video to Cloudinary |vercel

| DELETE | `/image` | 🔒 Admin | Delete Supabase image |```

| DELETE | `/video` | 🔒 Admin | Delete Cloudinary video |

4. **Add Environment Variables**

#### 📊 Admin Analytics (`/api/admin`)   - Go to your project in Vercel Dashboard

   - Settings → Environment Variables

| Method | Endpoint | Auth | Description |   - Add all variables from your `.env` file

|--------|----------|------|-------------|

| GET | `/analytics/overview` | 🔒 Admin | Dashboard stats |5. **Deploy to Production**

| GET | `/analytics/trending` | 🔒 Admin | Top 20 trending products |```bash

| GET | `/analytics/clicks` | 🔒 Admin | Click analytics (query: startDate, endDate) |vercel --prod

```

### Response Format

### Environment Variables in Vercel

**Success:**

```jsonMake sure to add all these in Vercel Dashboard:

{- `SUPABASE_URL`

  "success": true,- `SUPABASE_ANON_KEY`

  "data": { ... }- `SUPABASE_SERVICE_ROLE_KEY`

}- `CLOUDINARY_CLOUD_NAME`

```- `CLOUDINARY_API_KEY`

- `CLOUDINARY_API_SECRET`

**Error:**- `ADMIN_USER_IDS`

```json- `FRONTEND_URL`

{

  "success": false,## Performance Optimizations

  "error": "Error message",

  "details": [ ... ]- **Pagination**: Default 20 items, max 100

}- **Indexes**: On high-query columns (category, color, user_id, product_id)

```- **Materialized View**: For trending products calculation

- **Caching**: In-memory cache for static data (color combos)

### Rate Limits- **Lightweight SELECTs**: Only necessary columns returned

- **RLS Optimization**: Efficient policies for minimal overhead

- **General**: 100 requests / 15 min

- **Auth**: 5 requests / 15 min## API Response Format

- **Admin**: 10 requests / 15 min

### Success Response

## 🌐 Deployment```json

{

### Deploy to Vercel  "success": true,

  "data": { ... }

1. **Install Vercel CLI**}

```bash```

npm i -g vercel

```### Error Response

```json

2. **Login**{

```bash  "success": false,

vercel login  "error": "Error message",

```  "details": [ ... ]

}

3. **Deploy**```

```bash

vercel## Admin User Setup

```

To make a user an admin:

4. **Add Environment Variables**

   - Go to Vercel Dashboard → Project → Settings → Environment Variables1. Get the user's UUID from Supabase Auth dashboard

   - Add all variables from `.env` file2. Add it to the `ADMIN_USER_IDS` environment variable (comma-separated)

   - Redeploy if needed3. Restart the server or redeploy



5. **Production Deployment**## Troubleshooting

```bash

vercel --prod### Common Issues

```

1. **Supabase Connection Error**

### Post-Deployment   - Verify your Supabase URL and keys

   - Check if your IP is allowed in Supabase settings

1. Update `FRONTEND_URL` in Vercel environment variables

2. Add Vercel URL to Supabase redirect URLs (Authentication → URL Configuration)2. **Cloudinary Upload Fails**

3. Test all endpoints with production URL   - Verify API credentials

   - Check upload preset configuration

## 🔐 Environment Variables

3. **Authentication Fails**

### Required Variables   - Ensure Google OAuth is properly configured in Supabase

   - Check redirect URLs match

```env

# Server4. **RLS Policies Block Requests**

PORT=3000   - Run the complete schema.sql file

NODE_ENV=production   - Verify service role key is correct

FRONTEND_URL=https://your-frontend.com

## Support

# Supabase (from Dashboard → Project Settings → API)

SUPABASE_URL=https://xxxxx.supabase.coFor issues or questions:

SUPABASE_ANON_KEY=eyJhbG...1. Check Supabase logs in Dashboard

SUPABASE_SERVICE_ROLE_KEY=eyJhbG...2. Check Vercel deployment logs

3. Review error messages in API responses

# Cloudinary (from Dashboard → Account Details)

CLOUDINARY_CLOUD_NAME=your_cloud## License

CLOUDINARY_API_KEY=123456789

CLOUDINARY_API_SECRET=abc123...MIT



# Admin Users (comma-separated UUIDs)
ADMIN_USER_IDS=uuid-1,uuid-2,uuid-3
```

### How to Get Keys

**Supabase:**
1. Go to Project Settings → API
2. Copy `URL`, `anon public key`, `service_role key`

**Cloudinary:**
1. Go to Dashboard
2. Copy Cloud Name, API Key, API Secret

**Admin User IDs:**
1. User signs in via Google OAuth
2. Go to Supabase → Authentication → Users
3. Copy their UUID
4. Add to `ADMIN_USER_IDS` (comma-separated)

## 🔧 Project Structure

```
megg-api/
├── src/
│   ├── config/
│   │   ├── cloudinary.js       # Cloudinary setup
│   │   ├── constants.js        # App constants
│   │   └── supabase.js         # Supabase client
│   ├── controllers/            # Request handlers
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── colorCombo.controller.js
│   │   ├── guide.controller.js
│   │   ├── offer.controller.js
│   │   ├── outfit.controller.js
│   │   ├── product.controller.js
│   │   ├── reel.controller.js
│   │   ├── trending.controller.js
│   │   └── wishlist.controller.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verification, admin check
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── rateLimiter.js      # Rate limiting
│   │   ├── upload.js           # Multer config
│   │   └── validate.js         # Zod validation
│   ├── routes/                 # API routes
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── colorCombo.routes.js
│   │   ├── guide.routes.js
│   │   ├── offer.routes.js
│   │   ├── outfit.routes.js
│   │   ├── product.routes.js
│   │   ├── reel.routes.js
│   │   ├── trending.routes.js
│   │   └── wishlist.routes.js
│   ├── services/               # Business logic
│   │   ├── analytics.service.js
│   │   ├── auth.service.js
│   │   ├── colorCombo.service.js
│   │   ├── guide.service.js
│   │   ├── offer.service.js
│   │   ├── outfit.service.js
│   │   ├── product.service.js
│   │   ├── reel.service.js
│   │   ├── trending.service.js
│   │   ├── upload.service.js
│   │   └── wishlist.service.js
│   ├── utils/
│   │   └── errors.js           # Custom error classes
│   ├── validators/             # Zod schemas
│   │   ├── analytics.validators.js
│   │   ├── auth.validators.js
│   │   ├── colorCombo.validators.js
│   │   ├── guide.validators.js
│   │   ├── offer.validators.js
│   │   ├── outfit.validators.js
│   │   ├── product.validators.js
│   │   ├── reel.validators.js
│   │   └── wishlist.validators.js
│   └── index.js                # App entry point
├── migrations/                 # Database migrations (archive)
├── .env                        # Environment variables (create this)
├── .env.example                # Environment template
├── .gitignore
├── package.json
├── schema.sql                  # Complete database schema
├── vercel.json                 # Vercel config
└── README.md
```

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Error**
```
Solution: Verify SUPABASE_URL and keys in .env
Check: Supabase → Settings → API → Copy fresh keys
```

**2. RLS Policy Blocks Request**
```
Solution: Ensure schema.sql was executed completely
Check: Run queries as service_role user in SQL Editor
```

**3. Google OAuth Fails**
```
Solution: Verify redirect URLs match in Google Console and Supabase
Check: Supabase → Authentication → Providers → Google settings
```

**4. Cloudinary Upload Fails**
```
Solution: Verify API credentials and upload preset
Check: Cloudinary → Settings → Upload → Preset configuration
```

**5. Rate Limit Errors (429)**
```
Solution: Wait 15 minutes or adjust rate limits in rateLimiter.js
Check: Response headers for X-RateLimit-* information
```

## 📈 Performance Tips

1. **Use Pagination**: Always use `page` and `limit` query parameters
2. **Filter Wisely**: Combine filters (category + color) for faster queries
3. **Cache Results**: Implement client-side caching for static data
4. **Batch Operations**: Use bulk endpoints when available
5. **Monitor Indexes**: Check query performance in Supabase dashboard

## 🔒 Security Best Practices

- ✅ Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- ✅ Always use HTTPS in production
- ✅ Validate all user inputs with Zod schemas
- ✅ Keep admin user IDs private
- ✅ Regularly rotate API keys
- ✅ Monitor rate limit violations
- ✅ Review RLS policies quarterly

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📧 Support

For issues or questions:
1. Check existing GitHub Issues
2. Review Supabase logs (Dashboard → Logs)
3. Check Vercel deployment logs
4. Create new issue with error details

---

**Built with ❤️ for the fashion community**
