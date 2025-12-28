-- Neon Database Schema for MEGG API
-- Complete production schema compatible with Neon
-- Last updated: 2025-12-14

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE product_category AS ENUM (
  'Jacket',
  'Hoodies',
  'Sweater',
  'Sweatshirt',
  'Shirt',
  'Jeans',
  'Trackpants',
  'Shoes',
  'Tshirt',
  'Mens Accessories',
  'Sports Wear',
  'Office Wear',
  'Body Care',
  'Traditional',
  'Perfume',
  'Innerwear'
);

CREATE TYPE product_subcategory AS ENUM (
  -- Jacket
  'Puffer Jacket', 'Leather Jacket', 'Varsity Jacket', 'Bomber Jacket', 'Biker Jacket', 'Denim Jacket', 'Windcheater', 'Suede Jacket', 'Half Jacket', 'Overcoat',
  -- Hoodies
  'Regular Hoodie', 'Zip Hoodie', 'Printed Hoodie',
  -- Sweater
  'Round Neck Sweater', 'V-Neck Sweater', 'Turtleneck Sweater', 'Polo Neck Sweater', 'Sweater Vest', 'Cardigan', 'Zip Sweater',
  -- Sweatshirt
  'Oversized Sweatshirt', 'Printed Sweatshirt', 'Pullover Sweatshirt', 'Zip Sweatshirt',
  -- Shirt
  'Checked Shirt', 'Striped Shirt', 'Printed Shirt', 'Linen Shirt', 'Textured Shirt', 'Half-Sleeve Shirt', 'Solid Shirt', 'Shacket',
  -- Jeans
  'Wide-Leg Jeans', 'Straight Fit Jeans', 'Cargo Pants', 'Bootcut Jeans', 'Chinos', 'Linen Pants',
  -- Trackpants
  'Baggy Trackpants', 'Cargo Trackpants',
  -- Shoes
  'Sneakers', 'Clogs', 'Boots', 'Loafers', 'Canvas Shoes',
  -- Tshirt
  'Regular Fit T-Shirt', 'Oversized T-Shirt', 'Polo T-Shirt', 'Full-Sleeve T-Shirt', 'Gym T-Shirt',
  -- Mens Accessories
  'Bags', 'Caps', 'Watches', 'Belts', 'Sunglasses', 'Rings', 'Chains',
  -- Sports Wear
  'Shorts', 'Sports Jacket', 'Socks', 'Football Shoes', 'Badminton Shoes', 'Sports Shoes',
  -- Office Wear
  'Formal Shirts', 'Formal Pants', 'Formal Shoes', 'Suits', 'Tuxedo', 'Blazers', 'Ties & Pocket Squares',
  -- Body Care
  'Face Wash', 'Moisturiser', 'Sunscreen', 'Serum', 'Underarm Roll-On', 'Shampoo', 'Body Wash', 'Hair Oil',
  -- Traditional
  'Kurta', 'Pyjama', 'Short Kurta', 'Kurta Set', 'Indo-Western Outfit', 'Nehru Jacket', 'Ethnic Shoes',
  -- Perfume
  'Luxurious', 'Budget-Friendly',
  -- Innerwear
  'Trunks', 'Vests', 'Boxers', 'Thermal Wear'
);

CREATE TYPE combo_group AS ENUM ('layering', 'winter', 'casual', 'formal');

CREATE TYPE video_category AS ENUM (
  'Office',
  'Date',
  'College',
  'Party',
  'Color-combo',
  'Personality development',
  'Old money',
  'Streetwear',
  'Wedding',
  'Winter',
  'Layering',
  'Travel'
);

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (standalone - NOT linked to auth.users like Supabase)
-- Neon Auth stores users in neon_auth.users, this is your app's user data
CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  brand TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  category product_category NOT NULL,
  subcategory product_subcategory,
  color TEXT NOT NULL,
  fabric TEXT[] DEFAULT '{}',
  semantic_tags TEXT[] DEFAULT '{}',
  affiliate_link TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  clicks INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name,'') || ' ' ||
      coalesce(brand,'') || ' ' ||
      coalesce(description,'')
    )
  ) STORED
);

-- Outfits table
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  banner_image TEXT NOT NULL,
  product_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Color combinations table
CREATE TABLE color_combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model_image TEXT,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  color_a TEXT,
  color_b TEXT,
  group_type combo_group
);

-- Trending clicks table
CREATE TABLE trending_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offers table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  banner_image TEXT,
  affiliate_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reels table
CREATE TABLE reels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category video_category NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  product_ids UUID[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reel likes table
CREATE TABLE reel_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reel_id)
);

-- Wishlist table
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Category banners table
CREATE TABLE category_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category product_category NOT NULL,
  banner_image TEXT NOT NULL,
  link TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image TEXT
);

-- FCM Tokens table (for push notifications)
CREATE TABLE fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gemini API Usage table (for tracking API usage and rate limiting)
CREATE TABLE gemini_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_hash VARCHAR NOT NULL UNIQUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE gemini_api_usage IS 'Tracks Gemini API key usage for rate limiting (250 RPD per key)';
COMMENT ON COLUMN gemini_api_usage.api_key_hash IS 'SHA256 hash prefix of the API key (first 16 chars)';
COMMENT ON COLUMN gemini_api_usage.usage_count IS 'Number of API calls made since last_reset';
COMMENT ON COLUMN gemini_api_usage.last_reset IS 'When the usage count was last reset (resets every 24h)';
COMMENT ON COLUMN gemini_api_usage.is_valid IS 'Whether the API key is still valid (false if permanently failed)';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Products indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_subcategory ON products(subcategory);
CREATE INDEX idx_products_color ON products(color);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_clicks ON products(clicks DESC);
CREATE INDEX idx_products_popularity ON products(popularity DESC);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_search_vector ON products USING GIN (search_vector);
CREATE INDEX idx_products_semantic_tags ON products USING GIN (semantic_tags);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_brand_trgm ON products USING GIN (brand gin_trgm_ops);
CREATE INDEX idx_products_category_subcategory ON products(category, subcategory);
CREATE INDEX idx_products_category_color ON products(category, color);

-- Outfits indexes
CREATE INDEX idx_outfits_created_at ON outfits(created_at);
CREATE INDEX idx_outfits_product_ids ON outfits USING GIN(product_ids);

-- Color combos indexes
CREATE INDEX idx_color_combos_group_type ON color_combos(group_type);
CREATE INDEX idx_color_combos_product_ids ON color_combos USING GIN(product_ids);

-- Trending clicks indexes
CREATE INDEX idx_trending_clicks_product_id ON trending_clicks(product_id);
CREATE INDEX idx_trending_clicks_clicked_at ON trending_clicks(clicked_at);

-- Category banners indexes
CREATE INDEX idx_category_banners_category ON category_banners(category);
CREATE INDEX idx_category_banners_display_order ON category_banners(display_order);

-- Reels indexes
CREATE INDEX idx_reels_category ON reels(category);
CREATE INDEX idx_reels_created_at ON reels(created_at);
CREATE INDEX idx_reels_product_ids ON reels USING GIN(product_ids);

-- Reel likes indexes
CREATE INDEX idx_reel_likes_user_id ON reel_likes(user_id);
CREATE INDEX idx_reel_likes_reel_id ON reel_likes(reel_id);

-- Wishlist indexes
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);

-- =============================================================================
-- MATERIALIZED VIEW
-- =============================================================================

CREATE MATERIALIZED VIEW trending_products AS
SELECT 
  product_id,
  COUNT(*) as click_count,
  MAX(clicked_at) as last_clicked
FROM trending_clicks
WHERE clicked_at > NOW() - INTERVAL '7 days'
GROUP BY product_id
ORDER BY click_count DESC;

CREATE INDEX idx_trending_products_click_count ON trending_products(click_count DESC);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_product_clicks(product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET clicks = clicks + 1,
      popularity = clicks + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_product_view()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM increment_product_clicks(NEW.product_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_reel_views(reel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reels SET views = views + 1 WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_reel_likes(reel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reels SET likes = likes + 1 WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_reel_likes(reel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reels SET likes = GREATEST(likes - 1, 0) WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_product_from_arrays()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE color_combos
  SET product_ids = array_remove(product_ids, OLD.id)
  WHERE OLD.id = ANY(product_ids);

  UPDATE reels
  SET product_ids = array_remove(product_ids, OLD.id)
  WHERE OLD.id = ANY(product_ids);

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_trending_products()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_products;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER trigger_track_product_view
  AFTER INSERT ON trending_clicks
  FOR EACH ROW
  EXECUTE FUNCTION track_product_view();

CREATE TRIGGER trigger_cleanup_product_references
  BEFORE DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION remove_product_from_arrays();

CREATE TRIGGER trigger_color_combos_updated_at
  BEFORE UPDATE ON color_combos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_category_banners_updated_at
  BEFORE UPDATE ON category_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- NOTES
-- =============================================================================
-- 
-- REMOVED FROM SUPABASE SCHEMA:
-- 1. auth.users references - Neon Auth handles this separately in neon_auth schema
-- 2. Row Level Security (RLS) - API handles auth, not needed at DB level
-- 3. on_auth_user_created trigger - Neon Auth works differently
-- 4. handle_new_user() function - Not needed for Neon Auth
--
-- The users table is standalone - your app creates users when they
-- first authenticate via Neon Auth, using the user ID from neon_auth.users
