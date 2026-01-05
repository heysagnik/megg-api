-- Migration: Dynamic Subcategories
-- Creates a subcategories table and converts products.subcategory from ENUM to TEXT

-- Step 1: Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, category)
);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category);

-- Step 3: Convert products.subcategory from ENUM to TEXT (if not already TEXT)
ALTER TABLE products ALTER COLUMN subcategory TYPE TEXT;

-- Step 4: Seed with existing subcategories
INSERT INTO subcategories (name, category) VALUES
  -- Jacket
  ('Puffer', 'Jacket'), ('Leather', 'Jacket'), ('Varsity', 'Jacket'), ('Bomber', 'Jacket'),
  ('Biker', 'Jacket'), ('Half', 'Jacket'), ('Hiking', 'Jacket'), ('Faux', 'Jacket'),
  ('Overcoat', 'Jacket'), ('Printed', 'Jacket'), ('Reversible', 'Jacket'), ('Cotton', 'Jacket'),
  ('Tailored', 'Jacket'), ('Sports Jacket', 'Jacket'),
  -- Hoodies
  ('Zip Hoodie', 'Hoodies'), ('Regular Fit', 'Hoodies'), ('Printed', 'Hoodies'),
  -- Sweater
  ('V-Neck', 'Sweater'), ('Round Neck', 'Sweater'), ('Turtle Neck', 'Sweater'),
  ('Polo Neck', 'Sweater'), ('Sweater Vest', 'Sweater'), ('Cardigan', 'Sweater'),
  ('Zipper', 'Sweater'), ('Printed', 'Sweater'),
  -- Sweatshirt
  ('Oversized', 'Sweatshirt'), ('Printed', 'Sweatshirt'), ('Pullover', 'Sweatshirt'), ('Zipper', 'Sweatshirt'),
  -- Shirt
  ('Check', 'Shirt'), ('Striped', 'Shirt'), ('Printed', 'Shirt'), ('Linen', 'Shirt'),
  ('Textured', 'Shirt'), ('Half', 'Shirt'), ('Solid', 'Shirt'), ('Shacket', 'Shirt'), ('Formal Shirt', 'Shirt'),
  -- Jeans
  ('Baggy', 'Jeans'), ('Straight Fit', 'Jeans'), ('Cargos', 'Jeans'), ('Linen', 'Jeans'),
  ('Bootcut', 'Jeans'), ('Chinos', 'Jeans'), ('Korean Pants', 'Jeans'), ('Formal Pants', 'Jeans'), ('Corduroy', 'Jeans'),
  -- Trackpants
  ('Baggy', 'Trackpants'), ('Cargos', 'Trackpants'), ('Shorts', 'Trackpants'),
  -- Shoes
  ('Sneakers', 'Shoes'), ('Clogs', 'Shoes'), ('Boots', 'Shoes'), ('Loafers', 'Shoes'),
  ('Canvas', 'Shoes'), ('Formal Shoes', 'Shoes'), ('Sports Shoes', 'Shoes'),
  ('Football Shoes', 'Shoes'), ('Badminton Shoes', 'Shoes'), ('Socks', 'Shoes'),
  -- Tshirt
  ('Polo', 'Tshirt'), ('Oversized', 'Tshirt'), ('Full Sleeve', 'Tshirt'),
  ('Regular Fit', 'Tshirt'), ('Gym-Tee', 'Tshirt'), ('Football Jersey', 'Tshirt'),
  -- Mens Accessories
  ('Bags', 'Mens Accessories'), ('Caps', 'Mens Accessories'), ('Watches', 'Mens Accessories'),
  ('Belts', 'Mens Accessories'), ('Sunglasses', 'Mens Accessories'), ('Rings', 'Mens Accessories'),
  ('Chains', 'Mens Accessories'), ('Ties & Pocket Squares', 'Mens Accessories'),
  -- Body Care
  ('Face Wash', 'Body Care'), ('Moisturiser', 'Body Care'), ('Sunscreen', 'Body Care'),
  ('Serum', 'Body Care'), ('Underarm Roller', 'Body Care'), ('Body Wash', 'Body Care'),
  ('Hair Oil', 'Body Care'), ('Shampoo', 'Body Care'),
  -- Traditional
  ('Kurta', 'Traditional'), ('Nehru Jacket', 'Traditional'), ('Pyjama', 'Traditional'),
  ('Short Kurta', 'Traditional'), ('Blazer', 'Traditional'), ('Indo-Western', 'Traditional'),
  ('Suits', 'Traditional'), ('Ethnic Shoes', 'Traditional'),
  -- Perfume
  ('Luxurious', 'Perfume'), ('Under Budget', 'Perfume'),
  -- Innerwear
  ('Trunks', 'Innerwear'), ('Innerwear Vest', 'Innerwear'), ('Boxers', 'Innerwear'), ('Thermal Wear', 'Innerwear'),
  -- Daily Essentials
  ('Storage & Organizers', 'Daily Essentials'), ('Travel Essentials', 'Daily Essentials'),
  ('Grooming Tools', 'Daily Essentials'), ('Electronics', 'Daily Essentials'),
  ('Cleaning & Care', 'Daily Essentials'), ('Everyday Carry', 'Daily Essentials'), ('Home Essentials', 'Daily Essentials')
ON CONFLICT (name, category) DO NOTHING;
