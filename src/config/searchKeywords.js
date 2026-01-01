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
  layering: {
    categories: ['Jacket', 'Hoodies', 'Sweatshirt', 'Shirt'],
    description: 'Layering outfits',
    keywords: ['layering', 'layers', 'versatile', 'stylish', 'multiple']
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
  'Mens Accessories': ['accessories', 'watch', 'watches', 'bag', 'bags', 'cap', 'caps', 'belt', 'sunglasses', 'ring', 'rings', 'chain', 'chains', 'ties', 'pocket squares'],
  'Body Care': ['body care', 'skincare', 'facewash', 'face wash', 'moisturizer', 'moisturiser', 'sunscreen', 'serum', 'shampoo', 'body wash', 'hair oil'],
  'Traditional': ['traditional', 'ethnic', 'festive', 'kurta', 'sherwani', 'dhoti', 'indo western', 'nehru jacket', 'wedding', 'formal', 'suits'],
  'Perfume': ['perfume', 'fragrance', 'cologne', 'scent', 'luxurious', 'budget friendly'],
  'Innerwear': ['innerwear', 'inner wear', 'trunks', 'boxers', 'vests', 'thermal', 'thermals', 'underwear', 'undergarments'],
  'Daily Essentials': ['daily essentials', 'essentials', 'everyday', 'organizers', 'travel', 'grooming tools']
};

export const SUBCATEGORY_KEYWORDS = {
  // Jacket subcategories
  'Puffer Jacket': ['puffer', 'puffer jacket', 'padded jacket'],
  'Leather Jacket': ['leather', 'leather jacket'],
  'Varsity Jacket': ['varsity', 'varsity jacket', 'letterman'],
  'Bomber Jacket': ['bomber', 'bomber jacket'],
  'Biker Jacket': ['biker', 'biker jacket', 'motorcycle jacket'],
  'Denim Jacket': ['denim jacket', 'jean jacket'],
  'Hiking/Trekking Jacket': ['hiking', 'trekking', 'hiking jacket', 'outdoor jacket'],
  'Half Jacket': ['half jacket', 'cropped jacket'],
  'Overcoat': ['overcoat', 'trench coat'],
  'Sports Jacket': ['sports jacket', 'track jacket', 'training jacket'],

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
  'Half Sleeve Shirt': ['half sleeve', 'short sleeve', 'half shirt', 'half sleeves', 'half-sleeve'],
  'Solid Shirt': ['solid', 'plain'],
  'Shacket': ['shacket', 'shirt jacket'],
  'Formal Shirt': ['formal shirt', 'dress shirt'],

  // Jeans subcategories
  'Baggy Jeans': ['baggy', 'wide leg', 'baggy jeans'],
  'Straight Fit Jeans': ['straight', 'straight fit'],
  'Cargo Pants': ['cargo', 'cargos', 'cargo pants'],
  'Bootcut Jeans': ['bootcut', 'boot cut'],
  'Chinos': ['chinos', 'khaki'],
  'Linen Pants': ['linen', 'linen pants', 'linen trousers'],
  'Korean Pants': ['korean pants', 'korean style'],
  'Formal Pants': ['formal pants', 'office pants', 'dress pants', 'trousers'],
  'Corduroy': ['corduroy', 'cord'],

  // Trackpants subcategories
  'Baggy Trackpants': ['baggy', 'loose fit'],
  'Cargo Trackpants': ['cargo trackpants', 'cargos'],
  'Shorts': ['shorts', 'sports shorts'],

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
  'Gym-Tee': ['gym tee', 'gym-tee', 'gym tshirt', 'workout tshirt'],
  'Football Jersey': ['football jersey', 'jersey', 'soccer jersey'],

  // Mens_Accessories subcategories
  'Bags': ['bag', 'backpack', 'messenger', 'duffel'],
  'Caps': ['cap', 'hat', 'snapback', 'baseball cap'],
  'Watches': ['watch', 'wristwatch', 'timepiece'],
  'Belts': ['belt', 'belts'],
  'Sunglasses': ['sunglasses', 'shades'],
  'Rings': ['ring', 'rings'],
  'Chains': ['chain', 'chains', 'necklace', 'pendant'],
  'Ties & Pocket Squares': ['tie', 'ties', 'pocket square', 'necktie', 'bow tie'],
  'Socks': ['socks', 'sock', 'ankle socks'],
  // Shoes subcategories
  'Sports Shoes': ['sports shoes', 'running shoes', 'trainers'],
  'Football Shoes': ['football shoes', 'cleats'],
  'Badminton Shoes': ['badminton shoes', 'court shoes'],
  'Sneakers': ['sneakers', 'kicks'],
  'Clogs': ['clogs'],
  'Boots': ['boots'],
  'Loafers': ['loafers'],
  'Canvas Shoes': ['canvas', 'canvas shoes'],
  'Formal Shoes': ['formal shoes', 'dress shoes', 'oxford'],
  'Ethnic Shoes': ['ethnic shoes', 'mojari', 'juttis'],

  // Body_Care subcategories
  'Face Wash': ['face wash', 'facewash', 'cleanser'],
  'Moisturiser': ['moisturizer', 'moisturiser', 'lotion'],
  'Sunscreen': ['sunscreen', 'spf'],
  'Serum': ['serum'],
  'Underarm Roller': ['underarm roller', 'roll on', 'deodorant'],
  'Shampoo': ['shampoo'],
  'Body Wash': ['body wash', 'shower gel'],
  'Hair Oil': ['hair oil'],

  // Traditional subcategories
  'Kurta': ['kurta'],
  'Pyjama': ['pyjama', 'pajama'],
  'Short Kurta': ['short kurta'],
  'Kurta Set': ['kurta set', 'kurta pyjama'],
  'Blazer': ['blazer'],
  'Indo-Western Outfit': ['indo western', 'fusion wear'],
  'Nehru Jacket': ['nehru jacket', 'koti'],
  'Ethnic Shoes': ['ethnic shoes', 'mojari', 'juttis'],
  'Suits': ['suit', 'suits', 'two piece', 'three piece'],

  // Perfume subcategories
  'Luxurious': ['luxurious', 'luxury', 'premium', 'expensive', 'edp', 'eau de parfum'],
  'Budget-Friendly': ['budget', 'budget friendly', 'affordable', 'edt', 'edc', 'eau de toilette', 'eau de cologne'],

  // Innerwear subcategories
  'Trunks': ['trunks', 'trunk'],
  'Innerwear Vest': ['vests', 'vest', 'sleeveless', 'innerwear vest'],
  'Boxers': ['boxers', 'boxer', 'boxer shorts'],
  'Thermal Wear': ['thermal', 'thermals', 'thermal wear', 'thermal set']
};

export const BRAND_KEYWORDS = {
  // A
  'Adidas': ['adidas', 'addidas'],
  'ADILQADRI': ['adilqadri', 'adil qadri'],
  'Aeropostale': ['aeropostale', 'aero'],
  'Ahmed Al Maghribi': ['ahmed al maghribi', 'ahmed maghribi'],
  'Ajmal': ['ajmal'],
  'Allen Solly': ['allen solly'],
  'Anouk': ['anouk'],
  'Arrow': ['arrow'],
  'Armani': ['armani', 'giorgio armani'],
  'Armani Beauty': ['armani beauty'],
  'Asics': ['asics'],
  'Azzaro': ['azzaro'],

  // B
  'Bajaj': ['bajaj'],
  'Bata': ['bata'],
  'Bewakoof': ['bewakoof'],
  'Bene Kleed': ['bene kleed'],
  'Bershka': ['bershka'],
  'Beyoung': ['beyoung'],
  'Bella Vita': ['bella vita', 'bellavita'],
  'Being Human': ['being human'],
  'Blackberrys': ['blackberrys', 'blackberry'],

  // C
  'Campus': ['campus'],
  'Campus Sutra': ['campus sutra'],
  'Cantabil': ['cantabil'],
  'Casio': ['casio'],
  'Cetaphil': ['cetaphil'],
  'Chemist at Play': ['chemist at play'],
  'Columbia': ['columbia'],
  'Converse': ['converse'],
  'Creed': ['creed'],
  'Crocs': ['crocs'],

  // D
  'Damensch': ['damensch'],
  'Davidoff': ['davidoff'],
  'Decathlon': ['decathlon'],
  'Denver': ['denver'],
  'Dior': ['dior', 'christian dior'],
  'Dolce & Gabbana': ['dolce & gabbana', 'dolce and gabbana', 'd&g', 'dg'],
  'Dot & Key': ['dot & key', 'dot and key', 'dot&key'],
  'DRIP SPOILER': ['drip spoiler'],
  'Ducati': ['ducati'],

  // E-F
  'Embark': ['embark'],
  'Fastrack': ['fastrack'],
  'Fashion Frill': ['fashion frill'],
  'French Connection': ['french connection', 'fcuk'],
  'Fuaark': ['fuaark'],

  // G
  'Gap': ['gap'],
  'Gear': ['gear'],
  'Glitchez': ['glitchez'],
  'Goatter': ['goatter'],
  'Guess': ['guess'],

  // H
  'H&M': ['h&m', 'hm', 'h & m', 'handm'],
  'Here & Now': ['here & now', 'here and now', 'here&now'],
  'Hermès': ['hermes', 'hermès'],
  'Highlander': ['highlander'],
  'House of Pataudi': ['house of pataudi', 'pataudi'],
  'HRX by Hrithik Roshan': ['hrx', 'hrx by hrithik roshan', 'hrx by hrithik'],
  'Hundred': ['hundred'],

  // I-J
  'Indulekha': ['indulekha'],
  'Invictus': ['invictus'],
  'Jack & Jones': ['jack & jones', 'jack and jones', 'jack&jones', 'j&j'],
  'Jean Paul Gaultier': ['jean paul gaultier', 'jpg', 'gaultier'],
  'Jockey': ['jockey'],

  // K-L
  'Kalpraag': ['kalpraag'],
  'KISAH': ['kisah'],
  'Lakmé': ['lakme', 'lakmé'],
  'Lattafa': ['lattafa'],
  'Leather Retail': ['leather retail'],
  "Levi's": ['levis', "levi's", 'levi'],
  'Liberty': ['liberty'],
  'Louis Philippe': ['louis philippe', 'lp'],
  'Louis Stitch': ['louis stitch'],
  "L'Oréal": ["l'oreal", 'loreal', "l'oréal"],

  // M
  'Maniac': ['maniac'],
  'Marks & Spencer': ['marks & spencer', 'marks and spencer', 'm&s'],
  'Mast & Harbour': ['mast & harbour', 'mast and harbour'],
  'Minimalist': ['minimalist', 'beminimalist'],
  'Monkstory': ['monkstory'],
  'Monte Carlo': ['monte carlo'],
  'Mr Bowerbird': ['mr bowerbird', 'bowerbird'],
  'Mutaqinoti': ['mutaqinoti'],

  // N
  'Navratna': ['navratna'],
  'Nautica': ['nautica'],
  'Nike': ['nike'],
  'Nivia': ['nivia'],
  'Nobero': ['nobero'],

  // P
  'Paco Rabanne': ['paco rabanne', 'rabanne'],
  'Parachute': ['parachute'],
  'Park Avenue': ['park avenue'],
  'PELUCHE': ['peluche'],
  'Peter England': ['peter england'],
  'Peter England Elite': ['peter england elite'],
  "Pond's": ["pond's", 'ponds'],
  'Powerlook': ['powerlook'],
  'Provogue': ['provogue'],
  'PUMA': ['puma'],
  'PUMA Motorsport': ['puma motorsport'],

  // R
  'Rare Rabbit': ['rare rabbit'],
  'Raymond': ['raymond'],
  'Red Tape': ['red tape', 'redtape'],
  'Replica (Maison Margiela)': ['replica', 'maison margiela', 'margiela'],
  'Roadster': ['roadster'],
  'Royal Enfield': ['royal enfield'],

  // S
  'Salty': ['salty'],
  'Selected': ['selected'],
  'See Designs': ['see designs'],
  'Skinn by Titan': ['skinn', 'skinn by titan'],
  'Skybags': ['skybags'],
  'Snitch': ['snitch'],
  'Sonata': ['sonata'],
  'Spade Club': ['spade club'],
  'StyleCast x Revolte': ['stylecast', 'stylecast x revolte', 'revolte'],
  'Studio Nexx': ['studio nexx'],
  'Supersox': ['supersox'],
  'Swashaa': ['swashaa'],

  // T
  'The Bear House': ['the bear house', 'bear house'],
  'The Derma Co': ['the derma co', 'derma co'],
  'The Ethnic Co': ['the ethnic co', 'theethnic.co', 'ethnic co'],
  'The Indian Garage Co': ['the indian garage co', 'indian garage co', 'tigc'],
  'The Man Company': ['the man company', 'man company'],
  'The Souled Store': ['the souled store', 'souled store', 'tss'],
  'Thomas Crick': ['thomas crick'],
  'Titan': ['titan'],
  'Tommy Hilfiger': ['tommy hilfiger', 'tommy'],
  'Trendyol': ['trendyol'],
  'Trenduty': ['trenduty'],
  'TBOJ (The Bar of Jackets)': ['tboj', 'the bar of jackets'],

  // U
  'U.S. Polo Assn.': ['us polo', 'us polo assn', 'u.s. polo', 'uspa', 'us polo assn.'],
  'United Colors of Benetton': ['united colors of benetton', 'benetton', 'ucb'],
  'Urbano Fashion': ['urbano fashion', 'urbano'],
  'Ustraa': ['ustraa'],

  // V
  'Van Heusen': ['van heusen'],
  'Vastrado': ['vastrado'],
  'Vastramay': ['vastramay'],
  'Vector X': ['vector x', 'vectorx'],
  'Versace': ['versace'],
  'Vincent Chase': ['vincent chase'],
  'Vivity': ['vivity'],
  'Voyage': ['voyage'],

  // W-Y
  'Wild Stone': ['wild stone', 'wildstone'],
  'Wrogn': ['wrogn'],
  'XYXX': ['xyxx'],
  'Yellow Chimes': ['yellow chimes'],
  'Yoho': ['yoho'],
  'Yves Saint Laurent': ['yves saint laurent', 'ysl', 'saint laurent'],

  // Additional brands from subcategories
  'Manyavar': ['manyavar'],
  'Diwas by Manyavar': ['diwas', 'diwas by manyavar'],
  'TheEthnic.Co': ['theethnic.co', 'theethnic'],
  'Pepe Jeans': ['pepe jeans', 'pepe'],
  'Beardo': ['beardo'],
  'Villain': ['villain'],
  'Deconstruct': ['deconstruct'],
  'Nivea': ['nivea'],
  'Dove': ['dove'],
  'Lux': ['lux'],
  'Pears': ['pears'],
  'Woodland': ['woodland'],
  'Timex': ['timex'],
  'Dennison': ['dennison'],
  'Banana Club': ['banana club'],
  'StyleCast': ['stylecast'],
  'Tortoise': ['tortoise'],
  'Pierre Carlo': ['pierre carlo'],
  'MAX': ['max']
};
