-- Migration: Update product_category and product_subcategory enums
-- Date: 2025-12-22
-- IMPORTANT: Run this in a transaction. Backup your data first!

BEGIN;

-- ============================================================================
-- STEP 1: Create new enum types with updated values
-- ============================================================================

CREATE TYPE product_category_new AS ENUM (
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
  'Office Wear',
  'Body Care',
  'Traditional',
  'Perfume',
  'Innerwear',
  'Daily Essentials'
);

CREATE TYPE product_subcategory_new AS ENUM (
  -- Jacket
  'Puffer', 'Leather', 'Varsity', 'Bomber', 'Biker', 'Half', 'Denim', 'Hiking', 'Faux', 'Overcoat', 'Printed', 'Reversible', 'Tailored', 'Cotton',
  -- Hoodies
  'Zip Hoodie', 'Regular Fit', 'Printed Hoodie',
  -- Sweater
  'V-Neck', 'Round Neck', 'Turtle Neck', 'Polo Neck', 'Sweater Vest', 'Cardigan', 'Zipper', 'Printed Sweater',
  -- Sweatshirt
  'Oversized', 'Printed Sweatshirt', 'Pullover', 'Zipper Sweatshirt',
  -- Shirt
  'Check', 'Striped', 'Printed Shirt', 'Linen', 'Textured', 'Half Sleeve', 'Solid', 'Shacket', 'Formal Shirt',
  -- Jeans
  'Wide Leg', 'Straight Fit', 'Cargo', 'Linen Pants', 'Bootcut', 'Chinos', 'Korean Pants', 'Formal Pants', 'Corduroy', 'Baggy',
  -- Trackpants
  'Baggy Trackpants', 'Cargo Trackpants',
  -- Shoes
  'Sneakers', 'Clogs', 'Boots', 'Loafers', 'Canvas', 'Formal Shoes', 'Ethnic Shoes', 'Sports Shoes', 'Football Shoes', 'Badminton Shoes',
  -- Tshirt
  'Polo', 'Oversized Tshirt', 'Full Sleeve', 'Regular Fit Tshirt', 'Gym Tee', 'Football Jersey',
  -- Mens Accessories
  'Bags', 'Caps', 'Watches', 'Belts', 'Sunglasses', 'Rings', 'Chains',
  -- Sports
  'Shorts', 'Sports Jacket', 'Socks',
  -- Office Wear
  'Formal Shirts', 'Suits', 'Blazers', 'Ties & Pocket Squares',
  -- Body Care
  'Face Wash', 'Moisturiser', 'Sunscreen', 'Serum', 'Roll-On', 'Body Wash', 'Hair Oil', 'Shampoo',
  -- Traditional
  'Kurta', 'Nehru Jacket', 'Pyjama', 'Short Kurta', 'Blazer Traditional', 'Indo-Western',
  -- Perfume
  'Luxurious', 'Under Budget',
  -- Innerwear
  'Trunks', 'Vests', 'Boxers', 'Thermal Wear',
  -- Daily Essentials
  'Storage & Organizers', 'Travel Essentials', 'Grooming Tools', 'Electronics', 'Cleaning & Care', 'Everyday Carry', 'Home Essentials'
);

-- ============================================================================
-- STEP 2: Update the products table to use new enums
-- ============================================================================

-- Add temporary columns with new types
ALTER TABLE products ADD COLUMN category_new product_category_new;
ALTER TABLE products ADD COLUMN subcategory_new product_subcategory_new;

-- Migrate data - map old values to new values
-- For categories that haven't changed, direct mapping works
UPDATE products SET category_new = category::text::product_category_new
WHERE category::text IN (
  'Jacket', 'Hoodies', 'Sweater', 'Sweatshirt', 'Shirt', 'Jeans', 'Trackpants', 
  'Shoes', 'Tshirt', 'Mens Accessories', 'Traditional', 'Perfume', 'Innerwear'
);

-- Map old categories to new names
UPDATE products SET category_new = 'Sports'::product_category_new WHERE category::text = 'Sports Wear';
UPDATE products SET category_new = 'Office Wear'::product_category_new WHERE category::text IN ('Office Wear', 'Office wear');
UPDATE products SET category_new = 'Body Care'::product_category_new WHERE category::text IN ('Body Care', 'Skin care');

-- For subcategories - try direct mapping first, NULL for unmapped ones
UPDATE products SET subcategory_new = subcategory::text::product_subcategory_new
WHERE subcategory IS NOT NULL 
AND subcategory::text IN (
  SELECT unnest(enum_range(NULL::product_subcategory_new))::text
);

-- ============================================================================
-- STEP 3: Drop old columns and rename new ones
-- ============================================================================

-- Drop the old category column and rename new one
ALTER TABLE products DROP COLUMN category;
ALTER TABLE products RENAME COLUMN category_new TO category;

-- Drop the old subcategory column and rename new one  
ALTER TABLE products DROP COLUMN subcategory;
ALTER TABLE products RENAME COLUMN subcategory_new TO subcategory;

-- ============================================================================
-- STEP 4: Update category_banners table
-- ============================================================================

-- Drop any triggers that reference this table before modifying columns
DROP TRIGGER IF EXISTS trigger_category_banners_updated_at ON category_banners;

ALTER TABLE category_banners ADD COLUMN category_new product_category_new;

UPDATE category_banners SET category_new = category::text::product_category_new
WHERE category::text IN (
  SELECT unnest(enum_range(NULL::product_category_new))::text
);

UPDATE category_banners SET category_new = 'Sports'::product_category_new WHERE category::text = 'Sports Wear';
UPDATE category_banners SET category_new = 'Office Wear'::product_category_new WHERE category::text IN ('Office Wear', 'Office wear');
UPDATE category_banners SET category_new = 'Body Care'::product_category_new WHERE category::text IN ('Body Care', 'Skin care');

ALTER TABLE category_banners DROP COLUMN category;
ALTER TABLE category_banners RENAME COLUMN category_new TO category;

-- ============================================================================
-- STEP 5: Drop old enum types
-- ============================================================================

DROP TYPE IF EXISTS product_category;
DROP TYPE IF EXISTS product_subcategory;

-- Rename new types to original names
ALTER TYPE product_category_new RENAME TO product_category;
ALTER TYPE product_subcategory_new RENAME TO product_subcategory;

-- ============================================================================
-- STEP 6: Recreate indexes that depend on these columns
-- ============================================================================

DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_subcategory;
DROP INDEX IF EXISTS idx_products_category_subcategory;
DROP INDEX IF EXISTS idx_products_category_color;
DROP INDEX IF EXISTS idx_category_banners_category;

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_subcategory ON products(subcategory);
CREATE INDEX idx_products_category_subcategory ON products(category, subcategory);
CREATE INDEX idx_products_category_color ON products(category, color);
CREATE INDEX idx_category_banners_category ON category_banners(category);

COMMIT;

-- ============================================================================
-- VERIFICATION: Run these queries to verify the migration
-- ============================================================================

-- Check new enum values
-- SELECT unnest(enum_range(NULL::product_category));
-- SELECT unnest(enum_range(NULL::product_subcategory));

-- Check for any NULL categories after migration (investigate these)
-- SELECT id, name FROM products WHERE category IS NULL;

-- Check category distribution
-- SELECT category, COUNT(*) FROM products GROUP BY category ORDER BY COUNT(*) DESC;
