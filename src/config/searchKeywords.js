export const COLOR_KEYWORDS = {
  'Blue': ['blue', 'navy', 'royal blue', 'cobalt'],
  'Sky Blue': ['sky blue', 'light blue', 'baby blue'],
  'Dark Blue': ['dark blue', 'navy blue', 'midnight blue'],
  'Black': ['black', 'noir'],
  'Grey': ['grey', 'gray', 'charcoal', 'silver', 'slate'],
  'Beige': ['beige', 'nude', 'sand', 'taupe', 'cream', 'ivory'],
  'White': ['white', 'off-white'],
  'Green': ['green', 'forest green', 'mint'],
  'Brown': ['brown', 'tan', 'khaki', 'camel'],
  'Pink': ['pink', 'rose', 'blush'],
  'Yellow': ['yellow', 'gold', 'mustard'],
  'Red': ['red', 'burgundy', 'crimson', 'wine'],
  'Orange': ['orange', 'rust', 'copper'],
  'Olive Green': ['olive green', 'olive'],
  'Maroon': ['maroon', 'burgundy'],
  'Denim': ['denim', 'denim blue']
};

export const STYLE_KEYWORDS = {
  casual: {
    categories: ['Tshirt', 'Hoodies', 'Jeans', 'Trackpants', 'Shoes'],
    description: 'Casual wear',
    keywords: ['casual', 'everyday', 'relaxed', 'comfortable', 'weekend']
  },
  formal: {
    categories: ['Shirt', 'Mens Accessories', 'Shoes', 'Sweater', 'Office Wear'],
    description: 'Formal wear',
    keywords: ['formal', 'business', 'professional', 'office', 'work', 'dress']
  },
  'smart-casual': {
    categories: ['Shirt', 'Sweater', 'Jeans', 'Shoes'],
    description: 'Smart casual',
    keywords: ['smart casual', 'semi-formal', 'smart', 'classy']
  },
  athletic: {
    categories: ['Tshirt', 'Hoodies', 'Trackpants', 'Shoes', 'Sports Wear'],
    description: 'Athletic wear',
    keywords: ['athletic', 'sport', 'gym', 'workout', 'active', 'fitness']
  },
  streetwear: {
    categories: ['Tshirt', 'Hoodies', 'Jeans', 'Shoes', 'Jacket'],
    description: 'Streetwear',
    keywords: ['streetwear', 'urban', 'street', 'hip hop', 'hype']
  },
  winter: {
    categories: ['Jacket', 'Sweater', 'Hoodies', 'Jeans'],
    description: 'Winter wear',
    keywords: ['winter', 'cold', 'warm', 'cozy']
  },
  summer: {
    categories: ['Tshirt', 'Trackpants', 'Shoes', 'Mens Accessories'],
    description: 'Summer wear',
    keywords: ['summer', 'light', 'breathable', 'cool']
  },
  traditional: {
    categories: ['Traditional', 'Shirt', 'Shoes', 'Mens Accessories'],
    description: 'Traditional / ethnic wear',
    keywords: ['traditional', 'ethnic', 'festive', 'indian', 'kurta', 'sherwani', 'indo western']
  }
};

export const CATEGORY_KEYWORDS = {
  'Tshirt': ['tshirt', 't-shirt', 't shirt', 'tee', 'tees'],
  'Shirt': ['shirt', 'button-up', 'button up', 'dress shirt', 'casual shirt', 'oxford', 'formal shirt'],
  'Jacket': ['jacket', 'coat', 'windbreaker', 'bomber', 'denim jacket', 'leather jacket', 'puffer'],
  'Hoodies': ['hoodie', 'hoodies', 'zip-up hoodie', 'zipper hoodie'],
  'Sweater': ['sweater', 'pullover', 'cardigan', 'knitwear', 'jumper'],
  'Sweatshirt': ['sweatshirt', 'crewneck', 'crew neck', 'fleece', 'sweat shirt'],
  'Jeans': ['jeans', 'denim', 'blue jeans', 'pants', 'trousers'],
  'Trackpants': ['trackpants', 'track pants', 'joggers', 'sweatpants', 'lower', 'bottoms'],
  'Shoes': ['shoes', 'sneakers', 'trainers', 'kicks', 'footwear'],
  'Mens Accessories': ['accessories', 'watch', 'watches', 'bag', 'bags', 'cap', 'caps', 'belt', 'sunglasses', 'ring', 'rings', 'chain', 'chains'],
  'Sports Wear': ['sports', 'gym', 'athletic', 'workout', 'football', 'badminton', 'sports wear'],
  'Office Wear': ['office', 'formal', 'business', 'professional', 'corporate', 'suit', 'blazer', 'tuxedo'],
  'Body Care': ['body care', 'skincare', 'facewash', 'face wash', 'moisturizer', 'moisturiser', 'sunscreen', 'serum', 'shampoo', 'body wash', 'hair oil'],
  'Traditional': ['traditional', 'ethnic', 'festive', 'kurta', 'sherwani', 'dhoti', 'indo western', 'nehru jacket'],
  'Perfume': ['perfume', 'fragrance', 'cologne', 'scent', 'luxurious', 'budget friendly'],
  'Innerwear': ['innerwear', 'inner wear', 'trunks', 'boxers', 'vests', 'thermal', 'thermals', 'underwear', 'undergarments']
};

export const SUBCATEGORY_KEYWORDS = {
  // Jacket subcategories
  'Puffer Jacket': ['puffer', 'puffer jacket', 'padded jacket'],
  'Leather Jacket': ['leather', 'leather jacket'],
  'Varsity Jacket': ['varsity', 'varsity jacket', 'letterman'],
  'Bomber Jacket': ['bomber', 'bomber jacket'],
  'Biker Jacket': ['biker', 'biker jacket', 'motorcycle jacket'],
  'Denim Jacket': ['denim jacket', 'jean jacket'],
  'Windcheater': ['windcheater', 'wind cheater', 'windbreaker'],
  'Suede Jacket': ['suede', 'suede jacket'],
  'Half Jacket': ['half jacket', 'cropped jacket'],
  'Overcoat': ['overcoat', 'trench coat'],

  // Hoodies subcategories
  'Regular Hoodie': ['regular hoodie', 'hoodie', 'pullover hoodie'],
  'Zip Hoodie': ['zip hoodie', 'zipper hoodie', 'full zip'],
  'Printed Hoodie': ['printed hoodie', 'graphic hoodie'],

  // Sweater subcategories
  'Round Neck Sweater': ['round neck', 'crew neck sweater'],
  'V-Neck Sweater': ['v neck', 'v-neck sweater'],
  'Turtleneck Sweater': ['turtle neck', 'turtleneck'],
  'Polo Neck Sweater': ['polo neck sweater'],
  'Sweater Vest': ['sweater vest', 'vest'],
  'Cardigan': ['cardigan'],
  'Zip Sweater': ['zip sweater', 'zipper sweater'],

  // Sweatshirt subcategories
  'Oversized Sweatshirt': ['oversized sweatshirt'],
  'Printed Sweatshirt': ['printed sweatshirt', 'graphic sweatshirt'],
  'Pullover Sweatshirt': ['pullover', 'pullover sweatshirt'],
  'Zip Sweatshirt': ['zip sweatshirt', 'zipper sweatshirt'],

  // Shirt subcategories
  'Checked Shirt': ['check', 'checked', 'plaid', 'checkered'],
  'Striped Shirt': ['stripe', 'striped'],
  'Printed Shirt': ['printed', 'print'],
  'Linen Shirt': ['linen', 'linen shirt'],
  'Textured Shirt': ['textured'],
  'Half-Sleeve Shirt': ['half sleeve', 'short sleeve'],
  'Solid Shirt': ['solid', 'plain'],
  'Shacket': ['shacket', 'shirt jacket'],

  // Jeans subcategories
  'Wide-Leg Jeans': ['wide leg', 'baggy jeans'],
  'Straight Fit Jeans': ['straight', 'straight fit'],
  'Cargo Pants': ['cargo', 'cargo pants'],
  'Bootcut Jeans': ['bootcut', 'boot cut'],
  'Chinos': ['chinos', 'khaki'],
  'Linen Pants': ['linen pants', 'linen trousers'],

  // Trackpants subcategories
  'Baggy Trackpants': ['baggy', 'loose fit'],
  'Cargo Trackpants': ['cargo trackpants'],

  // Shoes subcategories
  'Sneakers': ['sneakers', 'kicks'],
  'Clogs': ['clogs'],
  'Boots': ['boots'],
  'Loafers': ['loafers'],
  'Canvas Shoes': ['canvas', 'canvas shoes'],

  // Tshirt subcategories
  'Regular Fit T-Shirt': ['regular fit', 'regular tshirt', 'basic tshirt', 'plain tshirt', 'tshirt', 'tee'],
  'Oversized T-Shirt': ['oversized tshirt', 'oversized t-shirt', 'oversized tee', 'oversized t shirt', 'oversized'],
  'Polo T-Shirt': ['polo', 'polo shirt', 'polo tshirt'],
  'Full-Sleeve T-Shirt': ['full sleeve', 'long sleeve'],
  'Gym T-Shirt': ['gym tshirt', 'workout tshirt'],

  // Mens_Accessories subcategories
  'Bags': ['bag', 'backpack', 'messenger', 'duffel'],
  'Caps': ['cap', 'hat', 'snapback', 'baseball cap'],
  'Watches': ['watch', 'wristwatch', 'timepiece'],
  'Belts': ['belt', 'belts'],
  'Sunglasses': ['sunglasses', 'shades'],
  'Rings': ['ring', 'rings'],
  'Chains': ['chain', 'chains', 'necklace', 'pendant'],

  // Sports_Wear subcategories
  'Shorts': ['shorts', 'sports shorts'],
  'Sports Jacket': ['sports jacket', 'track jacket'],
  'Socks': ['socks'],
  'Football Shoes': ['football shoes', 'cleats'],
  'Badminton Shoes': ['badminton shoes'],
  'Sports Shoes': ['sports shoes', 'running shoes', 'trainers'],

  // Office_Wear subcategories
  'Formal Shirts': ['formal shirt', 'office shirt', 'dress shirt'],
  'Formal Pants': ['formal pants', 'office pants', 'dress pants', 'trousers'],
  'Formal Shoes': ['formal shoes', 'dress shoes', 'oxford'],
  'Suits': ['suit'],
  'Tuxedo': ['tuxedo', 'tux'],
  'Blazers': ['blazer'],
  'Ties & Pocket Squares': ['tie', 'pocket square', 'necktie'],

  // Body_Care subcategories
  'Face Wash': ['face wash', 'facewash', 'cleanser'],
  'Moisturiser': ['moisturizer', 'moisturiser', 'lotion'],
  'Sunscreen': ['sunscreen', 'spf'],
  'Serum': ['serum'],
  'Underarm Roll-On': ['underarm roll-on', 'roll on', 'deodorant'],
  'Shampoo': ['shampoo'],
  'Body Wash': ['body wash', 'shower gel'],
  'Hair Oil': ['hair oil'],

  // Traditional subcategories
  'Kurta': ['kurta'],
  'Pyjama': ['pyjama', 'pajama'],
  'Short Kurta': ['short kurta'],
  'Kurta Set': ['kurta set', 'kurta pyjama'],
  'Indo-Western Outfit': ['indo western', 'fusion wear'],
  'Nehru Jacket': ['nehru jacket', 'koti'],
  'Ethnic Shoes': ['ethnic shoes', 'mojari', 'juttis'],

  // Perfume subcategories
  'Luxurious': ['luxurious', 'luxury', 'premium', 'expensive', 'edp', 'eau de parfum'],
  'Budget-Friendly': ['budget', 'budget friendly', 'affordable', 'edt', 'edc', 'eau de toilette', 'eau de cologne'],

  // Innerwear subcategories
  'Trunks': ['trunks', 'trunk'],
  'Vests': ['vests', 'vest', 'sleeveless'],
  'Boxers': ['boxers', 'boxer', 'boxer shorts'],
  'Thermal Wear': ['thermal', 'thermals', 'thermal wear', 'thermal set']
};

export const BRAND_KEYWORDS = {
  // Traditional
  'Vastramay': ['vastramay'],
  'Invictus': ['invictus'],
  'House of Pataudi': ['house of pataudi', 'pataudi'],
  'Vastrado': ['vastrado'],
  'Kisah': ['kisah'],
  'DiwaS': ['diwas', 'diwas by manyavar'],
  'Tasva': ['tasva'],
  'Jompers': ['jompers'],
  'Anouk': ['anouk'],
  'Fabindia': ['fabindia'],

  // Innerwear
  'Jockey': ['jockey'],
  'XYXX': ['xyxx'],
  'Damensch': ['damensch'],
  'US Polo Assn': ['us polo', 'us polo assn', 'u.s. polo', 'uspa'],
  'H&M': ['h&m', 'hm', 'h & m'],
  'Calvin Klein': ['calvin klein', 'ck'],
  'Van Heusen': ['van heusen'],

  // Perfume
  'Skinn': ['skinn', 'skinn by titan'],
  'WildStone': ['wildstone', 'wild stone'],
  'Ajmal': ['ajmal'],
  'Bella Vita': ['bella vita', 'bellavita'],
  'Nautica': ['nautica'],
  'Jaguar': ['jaguar'],
  'Embark': ['embark'],
  'Guess': ['guess'],
  'Villain': ['villain'],
  'Park Avenue': ['park avenue'],
  'Davidoff': ['davidoff'],
  'Rasasi': ['rasasi'],
  'The Man Company': ['the man company', 'man company'],
  'Adilqadri': ['adilqadri'],

  // Skin Care
  'Minimalist': ['minimalist', 'beminimalist'],
  'Dot & Key': ['dot & key', 'dot and key', 'dot&key'],
  'Deconstruct': ['deconstruct'],
  'Lakmé': ['lakme', 'lakmé'],
  'The Derma Co': ['the derma co', 'derma co'],
  "POND'S": ["pond's", "ponds"],

  // Accessories & Others
  'Nike': ['nike'],
  'Adidas': ['adidas'],
  'Puma': ['puma'],
  'Gear': ['gear'],
  'Allen Solly': ['allen solly'],
  'Tommy Hilfiger': ['tommy hilfiger', 'tommy'],
  'Jack & Jones': ['jack & jones', 'jack and jones', 'jack&jones'],
  'Skybags': ['skybags'],
  'Titan': ['titan'],
  'Sonata': ['sonata'],
  'Fastrack': ['fastrack'],
  'Casio': ['casio'],
  'Timex': ['timex'],
  'Vincent Chase': ['vincent chase'],
  'John Jacobs': ['john jacobs'],
  'Yellow Chimes': ['yellow chimes'],
  'StyleCast': ['stylecast', 'stylecast x revolte'],
  'Salty': ['salty'],
  'Swashaa': ['swashaa'],
  'Voyage': ['voyage'],
  'Fashion Frill': ['fashion frill'],
  'Roadster': ['roadster'],
  'Vivity': ['vivity'],
  'Red Tape': ['red tape', 'redtape'],
  'Woodland': ['woodland'],
  'Provogue': ['provogue'],
  'Peter England': ['peter england'],
  'Asics': ['asics'],
  'Campus': ['campus'],
  'Red Chief': ['red chief'],
  'Thomas Crick': ['thomas crick'],
  'Liberty': ['liberty'],
  'Bata': ['bata'],
  'Converse': ['converse'],
  'Louis Stitch': ['louis stitch'],
  'Trenduty': ['trenduty'],
  'Spade Club': ['spade club'],
  'Hush Puppies': ['hush puppies'],
  'HRX': ['hrx', 'hrx by hrithik roshan'],
  'Maniac': ['maniac'],
  'Nobero': ['nobero'],
  'Bonkers Corner': ['bonkers corner', 'bonkers'],
  'Bene Kleed': ['bene kleed'],
  'Beyoung': ['beyoung'],
  'The Indian Garage Co': ['the indian garage co', 'indian garage co', 'tigc'],
  'Urbano Fashion': ['urbano fashion', 'urbano'],
  'Ben Martin': ['ben martin'],
  'Highlander': ['highlander'],
  'Snitch': ['snitch'],
  'Bewakoof': ['bewakoof'],
  'Pepe Jeans': ['pepe jeans', 'pepe'],
  'Glitchez': ['glitchez'],
  'Arrow': ['arrow'],
  'Studio Nexx': ['studio nexx'],
  'Bershka': ['bershka'],
  'Thomas Scott': ['thomas scott'],
  'Mast & Harbour': ['mast & harbour', 'mast and harbour'],
  'Decathlon': ['decathlon'],
  'Nivia': ['nivia'],
  'Hundred': ['hundred'],
  'Technosport': ['technosport'],
  'The Bear House': ['the bear house', 'bear house'],
  'Mr Bowerbird': ['mr bowerbird', 'bowerbird'],
  'Peluche': ['peluche'],
  'Blackberrys': ['blackberrys', 'blackberry'],
  'Campus Sutra': ['campus sutra'],
  'Powerlook': ['powerlook'],
  'Wrogn': ['wrogn'],
  'Dennis Lingo': ['dennis lingo'],
  'Rare Rabbit': ['rare rabbit'],
  'Banana Club': ['banana club', 'bananna club'],
  'Aeropostale': ['aeropostale'],
  'Zara': ['zara'],
  'Here & Now': ['here & now', 'here and now'],
  'Trendyol': ['trendyol']
};
