-- Fashion Discovery App Database Schema for Supabase
-- Complete production schema matching actual database structure
-- Last updated: 2025-11-12
-- Run this script in Supabase SQL Editor

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
  'Sports',
  'Office wear',
  'Skin care',
  'Traditional',
  'Perfume'
);

CREATE TYPE product_subcategory AS ENUM (
  'Puffer', 'Leather', 'Varsity', 'Bomber', 'Biker', 'Half Jacket', 'Casual Jacket', 'Denim Jacket', 'Wind-cheater',
  'Zip Hoodie', 'Pullover Hoodie',
  'V Neck Sweater', 'Round Neck Sweater', 'Turtle Neck Sweater', 'Polo Neck Sweater', 'Sweater Vest', 'Cardigan',
  'Oversized Sweatshirt', 'Graphic Sweatshirt', 'Normal Sweatshirt',
  'Check Shirt', 'Striped Shirt', 'Printed Shirt', 'Linen Shirt', 'Textured Shirt', 'Half Shirt', 'Solid Shirt', 'Shacket', 'Formal Shirt', 'Cuban Shirt',
  'Wide Leg Jeans', 'Straight Fit Jeans', 'Cargo Jeans', 'Linen Pants', 'Bootcut Jeans', 'Formal Pants', 'Chinos',
  'Baggy Trackpants', 'Cargo Trackpants', 'Straight Fit Trackpants',
  'Sneakers', 'Sports Shoes', 'Walking Shoes', 'Clogs', 'Boots', 'Formal Shoes', 'Loafers', 'Canvas Shoes',
  'Polo Tshirt', 'Oversized Tshirt', 'Full Sleeve Tshirt', 'Gym Tshirt', 'V Neck Tshirt', 'Round Neck Tshirt', 'Printed Tshirt', 'Normal Tshirt',
  'Bags', 'Caps', 'Watches', 'Tie', 'Belt', 'Sunglasses', 'Rings', 'Lockets',
  'Sports Shorts', 'Sports Jacket', 'Socks', 'Sports Shoes General', 'Football Shoes', 'Badminton Shoes', 'Gym Tee',
  'Formal Pants Office', 'Formal Shirts Office', 'Suits', 'Tuxedo', 'Formal Shoes Office', 'Loafers Office', 'Blazers', 'Ties & Pocket Squares',
  'Face Wash', 'Moisturiser', 'Cleanser', 'Sunscreen', 'Serum',
  'Kurta', 'Koti', 'Pyjama', 'Short Kurta', 'Blazer Traditional', 'Kurta Set', 'Indo-western',
  'EDT', 'EDC', 'EDP'
);

CREATE TYPE combo_group AS ENUM ('summer', 'winter', 'casual', 'formal');

CREATE TYPE video_category AS ENUM (
  'Office fit',
  'Layering outfit',
  'Winter fit',
  'Festive fit',
  'Travel fit',
  'Personality development',
  'Date fit',
  'Colour combo',
  'College fit',
  'Party fit',
  'Airport look'
);

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  suggested_colors TEXT[] DEFAULT '{}',
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

-- Outfits table (simplified)
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  banner_image TEXT NOT NULL,
  affiliate_link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Color combinations table
CREATE TABLE color_combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  combo_colors TEXT[] NOT NULL DEFAULT '{}',
  group_type combo_group NOT NULL,
  model_image TEXT,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  affiliate_link TEXT NOT NULL,
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
  advertisement_link TEXT NOT NULL,
  title TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_brand_trgm ON products USING GIN (brand gin_trgm_ops);
CREATE INDEX idx_products_category_subcategory ON products(category, subcategory);
CREATE INDEX idx_products_category_color ON products(category, color);

-- Outfits indexes
CREATE INDEX idx_outfits_created_at ON outfits(created_at);

-- Color combos indexes
CREATE INDEX idx_color_combos_group_type ON color_combos(group_type);
CREATE INDEX idx_color_combos_product_ids ON color_combos USING GIN(product_ids);

-- Trending clicks indexes
CREATE INDEX idx_trending_clicks_product_id ON trending_clicks(product_id);
CREATE INDEX idx_trending_clicks_clicked_at ON trending_clicks(clicked_at);

-- Category banners indexes
CREATE INDEX idx_category_banners_category ON category_banners(category);
CREATE INDEX idx_category_banners_is_active ON category_banners(is_active);
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

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_banners ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Service role can insert products" ON products
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update products" ON products
  FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can delete products" ON products
  FOR DELETE USING (auth.jwt()->>'role' = 'service_role');

-- Outfits policies
CREATE POLICY "Anyone can view outfits" ON outfits
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage outfits" ON outfits
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Color combos policies
CREATE POLICY "Anyone can view color combos" ON color_combos
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage color combos" ON color_combos
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Trending clicks policies
CREATE POLICY "Anyone can insert clicks" ON trending_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can view all clicks" ON trending_clicks
  FOR SELECT USING (auth.jwt()->>'role' = 'service_role');

-- Offers policies
CREATE POLICY "Anyone can view offers" ON offers
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage offers" ON offers
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Reels policies
CREATE POLICY "Anyone can view reels" ON reels
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage reels" ON reels
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Anyone can update reel views" ON reels
  FOR UPDATE USING (true);

-- Reel likes policies
CREATE POLICY "Users can view their own likes" ON reel_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes" ON reel_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON reel_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Wishlist policies
CREATE POLICY "Users can view own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- Category banners policies
CREATE POLICY "Anyone can view active banners" ON category_banners
  FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage banners" ON category_banners
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- NOTES
-- =============================================================================

-- Storage buckets (create in Supabase Dashboard > Storage):
-- 1. product-images (public) - for product image URLs
-- 2. outfit-banners (public) - for outfit banner images
-- 3. offer-banners (public) - for offer banner images and category banners
-- 4. reel-thumbnails (public) - for reel thumbnail images

-- Storage policies (configure in Dashboard):
-- For all buckets:
--   - Public read access (anyone can view)
--   - Authenticated users can upload
--   - Service role can delete

-- Cloudinary Configuration:
-- Reel videos are hosted on Cloudinary
-- Configure Cloudinary credentials in environment variables:
--   - CLOUDINARY_CLOUD_NAME
--   - CLOUDINARY_API_KEY
--   - CLOUDINARY_API_SECRET

-- Note: Configure Google OAuth in Supabase Dashboard > Authentication > Providers
