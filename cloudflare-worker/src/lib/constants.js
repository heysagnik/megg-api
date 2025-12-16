// Product Categories & Subcategories
export const PRODUCT_CATEGORIES = [
    'Jacket', 'Hoodies', 'Sweater', 'Sweatshirt', 'Shirt', 'Jeans', 'Trackpants', 'Shoes',
    'Tshirt', 'Mens Accessories', 'Sports', 'Office wear', 'Innerwear', 'Daily Essentials',
    'Skin care', 'Traditional', 'Perfume',
];

export const PRODUCT_SUBCATEGORIES = {
    'Jacket': ['Puffer', 'Leather', 'Varsity', 'Bomber', 'Biker', 'Half Jacket', 'Casual Jacket', 'Denim Jacket', 'Wind-cheater'],
    'Hoodies': ['Zip Hoodie', 'Pullover Hoodie'],
    'Sweater': ['V Neck Sweater', 'Round Neck Sweater', 'Turtle Neck Sweater', 'Polo Neck Sweater', 'Sweater Vest', 'Cardigan'],
    'Sweatshirt': ['Oversized Sweatshirt', 'Graphic Sweatshirt', 'Normal Sweatshirt'],
    'Shirt': ['Check Shirt', 'Striped Shirt', 'Printed Shirt', 'Linen Shirt', 'Textured Shirt', 'Half Shirt', 'Solid Shirt', 'Shacket', 'Formal Shirt', 'Cuban Shirt'],
    'Jeans': ['Wide Leg Jeans', 'Straight Fit Jeans', 'Cargo Jeans', 'Linen Pants', 'Bootcut Jeans', 'Formal Pants', 'Chinos'],
    'Trackpants': ['Baggy Trackpants', 'Cargo Trackpants', 'Straight Fit Trackpants'],
    'Shoes': ['Sneakers', 'Sports Shoes', 'Walking Shoes', 'Clogs', 'Boots', 'Formal Shoes', 'Loafers', 'Canvas Shoes'],
    'Tshirt': ['Polo Tshirt', 'Oversized Tshirt', 'Full Sleeve Tshirt', 'Gym Tshirt', 'V Neck Tshirt', 'Round Neck Tshirt', 'Printed Tshirt', 'Normal Tshirt'],
    'Mens Accessories': ['Bags', 'Caps', 'Watches', 'Tie', 'Belt', 'Sunglasses', 'Rings', 'Lockets'],
    'Sports': ['Sports Shorts', 'Sports Jacket', 'Socks', 'Sports Shoes General', 'Football Shoes', 'Badminton Shoes', 'Gym Tee'],
    'Office wear': ['Formal Pants Office', 'Formal Shirts Office', 'Suits', 'Tuxedo', 'Formal Shoes Office', 'Loafers Office', 'Blazers', 'Ties & Pocket Squares'],
    'Innerwear': ['Trunks', 'Boxers', 'Vests', 'Briefs', 'Thermal Top', 'Thermal Bottom', 'Thermal Set'],
    'Daily Essentials': ['Storage & Organizers', 'Travel Essentials', 'Grooming Tools', 'Electronics', 'Cleaning & Care', 'Everyday Carry', 'Home Essentials'],
    'Skin care': ['Face Wash', 'Moisturiser', 'Cleanser', 'Sunscreen', 'Serum'],
    'Traditional': ['Kurta', 'Koti', 'Pyjama', 'Short Kurta', 'Blazer Traditional', 'Kurta Set', 'Indo-western'],
    'Perfume': ['EDT', 'EDC', 'EDP'],
};

export const ALL_SUBCATEGORIES = Object.values(PRODUCT_SUBCATEGORIES).flat();

export const PRODUCT_COLORS = [
    'Black', 'Jet Black', 'Charcoal', 'Graphite', 'Gunmetal', 'Onyx', 'Ebony',
    'Gray', 'Light Gray', 'Dark Gray', 'Heather Gray', 'Slate', 'Pewter', 'Steel',
    'Silver', 'White', 'Off-White', 'Ivory', 'Cream', 'Alabaster', 'Bone',
    'Beige', 'Sand', 'Tan', 'Camel', 'Khaki', 'Taupe', 'Stone', 'Oatmeal', 'Mushroom',
    'Brown', 'Mocha', 'Cocoa', 'Chestnut', 'Walnut', 'Mahogany', 'Chocolate',
    'Saddle', 'Sepia', 'Sienna', 'Terracotta', 'Rust', 'Copper', 'Bronze', 'Brass', 'Umber',
    'Red', 'Brick Red', 'Burgundy', 'Maroon', 'Wine', 'Oxblood', 'Crimson', 'Scarlet',
    'Cherry', 'Ruby', 'Garnet', 'Berry', 'Raspberry', 'Coral', 'Salmon', 'Peach',
    'Apricot', 'Blush', 'Rose', 'Dusty Pink', 'Fuchsia', 'Magenta', 'Rosé',
    'Orange', 'Tangerine', 'Amber', 'Ochre', 'Mustard', 'Saffron', 'Gold', 'Metallic Gold',
    'Yellow', 'Canary', 'Dandelion', 'Lemon', 'Marigold',
    'Green', 'Olive', 'Army Green', 'Khaki Green', 'Moss', 'Fern', 'Pistachio', 'Sage',
    'Mint', 'Seafoam', 'Emerald', 'Jade', 'Kelly Green', 'Hunter Green', 'Forest Green',
    'Lime', 'Chartreuse', 'Neon Green',
    'Blue', 'Navy', 'Royal Blue', 'Cobalt', 'Indigo', 'Azure', 'Sky Blue', 'Baby Blue',
    'Cornflower', 'Periwinkle', 'Turquoise', 'Teal', 'Aqua', 'Cyan', 'Sea Blue',
    'Purple', 'Violet', 'Plum', 'Eggplant', 'Aubergine', 'Lavender', 'Lilac', 'Mauve',
    'Metallic Silver', 'Bronzed', 'Copper Metallic', 'Rose Gold',
    'Pastel Blue', 'Pastel Pink', 'Pastel Green', 'Pastel Yellow', 'Pastel Purple',
    'Dusty Blue', 'Dusty Rose', 'Muted Olive', 'Washed Denim', 'Denim Blue', 'Indigo Wash',
    'Neon Pink', 'Neon Yellow', 'Neon Orange', 'Neon Blue', 'Highlighter Green',
    'Off Black', 'Stonewash', 'Vintage Wash', 'Distressed Blue',
    'Chocolate Brown', 'Cocoa Brown', 'Warm Taupe', 'Cool Gray', 'Blue Gray', 'Steel Blue',
    'Charcoal Blue', 'Teal Blue', 'Olive Drab', 'Moss Green', 'Sage Green', 'Khaki Beige',
];

export const BRAND_CATEGORIES = {
    'Traditional': ['Vastramay', 'Invictus', 'House of Pataudi', 'Vastrado', 'Kisah', 'DiwaS by Manyavar', 'Tasva', 'Jompers', 'Anouk', 'Fabindia'],
    'Innerwear': ['Jockey', 'XYXX', 'Damensch', 'US Polo', 'H&M', 'Calvin Klein', 'Van Heusen'],
    'Perfume': ['Skinn', 'WildStone', 'Ajmal', 'Bella Vita', 'Nautica', 'Jaguar', 'Embark', 'Guess', 'Villain', 'Park Avenue', 'Davidoff', 'Rasasi', 'The Man Company', 'Adilqadri'],
    'Skin care': ['Minimalist', 'Dot & Key', 'Deconstruct', 'Lakmé', 'The Derma Co', "POND'S", 'Cetaphil', 'Nivea', 'Mamaearth'],
    'Mens Accessories': ['Nike', 'Adidas', 'Puma', 'Gear', 'Allen Solly', 'Tommy Hilfiger', 'Jack & Jones', 'Skybags', 'Titan', 'Sonata', 'Fastrack', 'Casio', 'Timex', 'Van Heusen', 'Vincent Chase', 'John Jacobs', 'Yellow Chimes', 'StyleCast x Revolte', 'Salty', 'Swashaa', 'H&M', 'Voyage', 'Fashion Frill', 'Roadster', 'Vivity', 'RED TAPE', 'WOODLAND', 'PROVOGUE', 'PETER ENGLAND'],
    'Shoes': ['Nike', 'Adidas', 'Puma', 'Asics', 'Red Tape', 'Campus', 'Red Chief', 'Thomas Crick', 'Liberty', 'Bata', 'Converse', 'Louis Stitch', 'Woodland', 'US Polo', 'TRENDUTY', 'SPADE CLUB', 'Roadster', 'Hush Puppies'],
    'Trackpants': ['HRX', 'Maniac', 'NOBERO', 'H&M', 'Bonkers Corner', 'Bene Kleed'],
    'Jeans': ['Roadster', 'Beyoung', 'The Indian Garage Co.', 'Urbano Fashion', 'Ben Martin', 'Highlander', 'Snitch', 'Peter England', 'Allen Solly', 'Bewakoof', 'Pepe Jeans', 'Glitchez', 'Arrow', 'Bene Kleed', 'Studio Nexx', 'H&M', 'Bershka', 'Thomas Scott', 'Mast & Harbour'],
    'Sports': ['Nike', 'Adidas', 'Puma', 'Asics', 'HRX', 'Decathlon', 'XYXX', 'Nivia', 'Hundred', 'Jockey', 'US Polo', 'The Indian Garage Co', 'Pepe Jeans', 'Technosport'],
    'Office wear': ['Arrow', 'Peter England', 'Allen Solly', 'Louis Stitch', 'Tommy Hilfiger', 'Jack & Jones', 'Invictus', 'The Bear House', 'Mr Bowerbird', 'H&M', 'PELUCHE', 'Tasva', 'Blackberrys', 'Park Avenue'],
    'Tshirt': ['Nike', 'Adidas', 'Puma', 'HRX', 'Roadster', 'The Indian Garage Co.', 'Urbano Fashion', 'Ben Martin', 'Highlander', 'Thomas Scott', 'Snitch', 'Campus Sutra', 'Tommy Hilfiger', 'Jack & Jones', 'Peter England', 'Allen Solly', 'Powerlook', 'Bewakoof', 'US Polo', 'Pepe Jeans', 'Mr Bowerbird', 'Wrogn', 'Dennis Lingo', 'Decathlon', 'H&M'],
    'Shirt': ['Louis Stitch', 'Rare Rabbit', 'Arrow', 'Maniac', 'The Indian Garage Co.', 'Highlander', 'Snitch', 'Campus Sutra', 'Roadster', 'Bananna Club', 'Tommy Hilfiger', 'Jack & Jones', 'Peter England', 'Allen Solly', 'Invictus', 'Powerlook', 'The Bear House', 'Aeropostale', 'Bershka', 'US Polo', 'Pepe Jeans', 'Mr Bowerbird', 'Wrogn', 'Dennis Lingo', 'H&M', 'ZARA'],
    'Sweatshirt': ['Nike', 'Adidas', 'Puma', 'HRX', 'Roadster', 'Mr Bowerbird', 'Here & Now', 'Highlander', 'Snitch', 'Campus Sutra', 'Tommy Hilfiger', 'Jack & Jones', 'Bewakoof', 'US Polo', 'Pepe Jeans', 'Wrogn', 'Trendyol', 'H&M', 'ZARA', 'Glitchez'],
    'Sweater': ['Roadster', 'Arrow', 'Rare Rabbit', 'Tommy Hilfiger', 'Jack & Jones', 'Peter England', 'Allen Solly', 'US Polo', 'Pepe Jeans', 'Wrogn', 'Here & Now', 'Dennis Lingo', 'H&M', 'ZARA', 'Invictus', 'Trendyol', 'Mr Bowerbird', 'Glitchez'],
    'Hoodies': ['Nike', 'Adidas', 'Puma', 'Campus', 'HRX', 'Roadster', 'Arrow', 'Maniac', 'The Indian Garage Co.', 'Urbano Fashion', 'Highlander', 'Snitch', 'Campus Sutra', 'Tommy Hilfiger', 'Jack & Jones', 'Peter England', 'Allen Solly', 'Bewakoof', 'US Polo', 'Pepe Jeans', 'Wrogn', 'Dennis Lingo', 'Decathlon', 'H&M', 'ZARA'],
    'Jacket': ['Nike', 'Adidas', 'Puma', 'Red Tape', 'Campus', 'HRX', 'Roadster', 'Louis Stitch', 'Red Chief', 'Rare Rabbit', 'Arrow', 'The Indian Garage Co.', 'Highlander', 'Studio Nexx', 'Snitch', 'Campus Sutra', 'Tommy Hilfiger', 'Jack & Jones', 'Peter England', 'Allen Solly', 'Woodland', 'Bershka', 'Trendyol', 'US Polo', 'Pepe Jeans', 'Wrogn', 'Dennis Lingo', 'Decathlon', 'H&M', 'ZARA'],
};

export const PRODUCT_BRANDS = [...new Set(Object.values(BRAND_CATEGORIES).flat())].sort();
