import { PRODUCT_CATEGORIES, PRODUCT_SUBCATEGORIES, PRODUCT_COLORS, PRODUCT_BRANDS } from './constants.js';

const CATEGORY_ALIASES = {
    'Jacket': ['jacket', 'jackets', 'coat', 'coats', 'outerwear'],
    'Hoodies': ['hoodie', 'hoodies', 'hood', 'pullover hoodie'],
    'Sweater': ['sweater', 'sweaters', 'pullover', 'knitwear', 'jumper', 'cardigan'],
    'Sweatshirt': ['sweatshirt', 'sweatshirts', 'crewneck', 'fleece'],
    'Shirt': ['shirt', 'shirts', 'button-up', 'button up', 'oxford'],
    'Jeans': ['jeans', 'denim', 'pants', 'trousers', 'bottoms'],
    'Trackpants': ['trackpants', 'track pants', 'joggers', 'sweatpants', 'lowers'],
    'Shoes': ['shoes', 'shoe', 'footwear', 'sneakers', 'kicks'],
    'Tshirt': ['tshirt', 't-shirt', 't shirt', 'tee', 'tees'],
    'Mens Accessories': ['accessories', 'accessory', 'watch', 'bag', 'cap', 'belt', 'sunglasses', 'ties', 'pocket squares'],
    'Body Care': ['bodycare', 'body care', 'skincare', 'grooming', 'facewash', 'moisturizer'],
    'Traditional': ['traditional', 'ethnic', 'indian', 'kurta', 'festive', 'wedding', 'formal', 'suits'],
    'Perfume': ['perfume', 'fragrance', 'cologne', 'scent', 'deodorant'],
    'Innerwear': ['innerwear', 'underwear', 'undergarments', 'briefs', 'boxers', 'vests'],
    'Daily Essentials': ['essentials', 'daily essentials', 'everyday'],
};

const SUBCATEGORY_ALIASES = {
    'Puffer': ['puffer', 'puffer jacket', 'padded', 'quilted'],
    'Leather': ['leather', 'leather jacket', 'biker leather'],
    'Varsity': ['varsity', 'letterman', 'college jacket'],
    'Bomber': ['bomber', 'bomber jacket', 'flight jacket'],
    'Biker': ['biker', 'motorcycle', 'biker jacket'],
    'Half': ['half jacket', 'cropped', 'half sleeve jacket'],
    'Hiking/Trekking': ['hiking', 'trekking', 'hiking jacket', 'trekking jacket', 'outdoor'],
    'Faux': ['faux', 'faux leather'],
    'Overcoat': ['overcoat', 'trench', 'trench coat', 'long coat'],
    'Printed': ['printed', 'graphic'],
    'Reversible': ['reversible'],
    'Cotton': ['cotton jacket'],
    'Tailored': ['tailored', 'fitted'],
    'Sports Jacket': ['sports jacket', 'track jacket', 'training jacket', 'athletic jacket'],
    'Zip Hoodie': ['zip hoodie', 'zipper hoodie', 'full zip'],
    'Regular Fit': ['regular fit', 'regular', 'basic'],
    'V-Neck': ['v neck', 'v-neck', 'vneck'],
    'Round Neck': ['round neck', 'crew neck', 'crewneck'],
    'Turtle Neck': ['turtle neck', 'turtleneck', 'high neck'],
    'Polo Neck': ['polo neck', 'polo'],
    'Sweater Vest': ['sweater vest', 'vest sweater'],
    'Cardigan': ['cardigan', 'open front'],
    'Zipper': ['zipper', 'zip'],
    'Oversized': ['oversized', 'baggy', 'loose fit'],
    'Pullover': ['pullover'],
    'Check': ['check', 'checked', 'plaid', 'checkered'],
    'Striped': ['striped', 'stripe', 'stripes'],
    'Linen': ['linen'],
    'Textured': ['textured'],
    'Half': ['half sleeve', 'short sleeve', 'half shirt', 'half sleeves', 'half-sleeve'],
    'Solid': ['solid', 'plain'],
    'Shacket': ['shacket', 'shirt jacket'],
    'Formal Shirt': ['formal shirt', 'dress shirt'],
    'Baggy': ['baggy', 'wide leg', 'wide-leg', 'baggy jeans', 'loose fit', 'relaxed'],
    'Straight Fit': ['straight', 'straight fit', 'regular fit jeans'],
    'Cargos': ['cargo', 'cargos', 'cargo pants', 'cargo jeans'],
    'Linen': ['linen', 'linen pants', 'linen trousers'],
    'Bootcut': ['bootcut', 'boot cut'],
    'Chinos': ['chinos', 'chino', 'khaki pants'],
    'Korean Pants': ['korean pants', 'korean style'],
    'Formal Pants': ['formal pants', 'dress pants', 'office pants'],
    'Corduroy': ['corduroy', 'cord'],
    'Shorts': ['shorts', 'short', 'sports shorts'],
    'Sneakers': ['sneakers', 'sneaker', 'trainers'],
    'Clogs': ['clogs', 'clog'],
    'Boots': ['boots', 'boot', 'ankle boots'],
    'Loafers': ['loafers', 'loafer', 'slip-on', 'moccasin'],
    'Canvas': ['canvas', 'canvas shoes'],
    'Formal Shoes': ['formal shoes', 'dress shoes', 'oxford'],
    'Ethnic Shoes': ['ethnic shoes', 'mojari', 'jutis', 'kolhapuri'],
    'Sports Shoes': ['sports shoes', 'running shoes', 'athletic shoes'],
    'Football Shoes': ['football shoes', 'cleats', 'studs', 'football boots'],
    'Badminton Shoes': ['badminton shoes', 'court shoes'],
    'Polo': ['polo', 'polo shirt', 'polo tshirt'],
    'Full Sleeve': ['full sleeve', 'long sleeve'],
    'Gym-Tee': ['gym tee', 'gym-tee', 'gym tshirt', 'workout tshirt', 'dri-fit'],
    'Football Jersey': ['football jersey', 'jersey', 'soccer jersey'],
    'Bags': ['bag', 'bags', 'backpack', 'messenger', 'duffel', 'sling'],
    'Caps': ['cap', 'caps', 'hat', 'snapback', 'baseball cap'],
    'Watches': ['watch', 'watches', 'wristwatch', 'timepiece'],
    'Belts': ['belt', 'belts', 'waist belt'],
    'Sunglasses': ['sunglasses', 'shades', 'aviator', 'wayfarers'],
    'Rings': ['ring', 'rings', 'finger ring'],
    'Chains': ['chain', 'chains', 'necklace', 'pendant'],
    'Ties & Pocket Squares': ['tie', 'ties', 'pocket square', 'necktie', 'bow tie'],
    'Socks': ['socks', 'sock', 'ankle socks'],
    'Suits': ['suit', 'suits', 'two piece', 'three piece'],
    'Blazer': ['blazer', 'blazers', 'sport coat'],
    'Ethnic Shoes': ['ethnic shoes', 'mojari', 'jutis', 'kolhapuri'],
    'Face Wash': ['face wash', 'facewash', 'cleanser'],
    'Moisturiser': ['moisturizer', 'moisturiser', 'lotion', 'cream'],
    'Sunscreen': ['sunscreen', 'spf', 'sun protection'],
    'Serum': ['serum', 'face serum'],
    'Underarm Roller': ['underarm roller', 'roll-on', 'deodorant', 'underarm'],
    'Body Wash': ['body wash', 'shower gel'],
    'Hair Oil': ['hair oil', 'oil'],
    'Shampoo': ['shampoo', 'hair wash'],
    'Kurta': ['kurta', 'kurtas'],
    'Nehru Jacket': ['nehru jacket', 'nehru', 'bundi', 'koti'],
    'Pyjama': ['pyjama', 'pajama', 'pyjamas'],
    'Short Kurta': ['short kurta'],
    'Indo-Western': ['indo western', 'indo-western', 'fusion'],
    'Blazer': ['blazer traditional', 'ethnic blazer'],
    'Luxurious': ['luxurious', 'luxury', 'premium', 'expensive', 'edp', 'eau de parfum'],
    'Under Budget': ['budget', 'affordable', 'cheap', 'edt', 'eau de toilette', 'under budget'],
    'Trunks': ['trunks', 'trunk'],
    'Innerwear Vest': ['vest', 'vests', 'sleeveless', 'innerwear vest'],
    'Boxers': ['boxer', 'boxers', 'boxer shorts'],
    'Thermal Wear': ['thermal', 'thermals', 'thermal wear', 'winter innerwear'],
};

const COLOR_ALIASES = {
    'Black': ['black', 'jet black', 'noir', 'ebony', 'onyx'],
    'White': ['white', 'off-white', 'ivory', 'cream', 'pearl', 'off white'],
    'Blue': ['blue', 'royal blue', 'cobalt', 'azure'],
    'Navy': ['navy', 'navy blue', 'midnight blue', 'dark blue'],
    'Sky Blue': ['sky blue', 'light blue', 'baby blue', 'powder blue'],
    'Grey': ['grey', 'gray', 'silver', 'slate', 'ash', 'smoke', 'charcoal'],
    'Red': ['red', 'crimson', 'ruby', 'scarlet'],
    'Maroon': ['maroon', 'burgundy', 'wine', 'bordeaux', 'oxblood'],
    'Green': ['green', 'forest green', 'hunter green', 'emerald'],
    'Olive': ['olive', 'olive green', 'army green', 'military green', 'khaki green'],
    'Brown': ['brown', 'chocolate', 'coffee', 'mocha', 'chestnut'],
    'Beige': ['beige', 'tan', 'khaki', 'camel', 'sand', 'nude', 'taupe', 'cream'],
    'Pink': ['pink', 'rose', 'blush', 'coral', 'salmon', 'dusty pink'],
    'Yellow': ['yellow', 'mustard', 'gold', 'amber', 'lemon', 'canary'],
    'Orange': ['orange', 'rust', 'copper', 'tangerine', 'peach', 'terracotta'],
    'Purple': ['purple', 'violet', 'lavender', 'plum', 'magenta', 'lilac'],
    'Teal': ['teal', 'turquoise', 'aqua', 'cyan'],
    'Denim': ['denim', 'denim blue', 'washed blue', 'indigo'],
};

const BRAND_ALIASES = {};
PRODUCT_BRANDS.forEach(brand => {
    const key = brand.toLowerCase();
    BRAND_ALIASES[brand] = [key];
    if (brand.includes('&')) BRAND_ALIASES[brand].push(brand.replace('&', 'and').toLowerCase());
    if (brand.includes(' ')) BRAND_ALIASES[brand].push(brand.replace(/\s+/g, '').toLowerCase());
});
Object.assign(BRAND_ALIASES, {
    // Common brands with variations
    'Nike': ['nike', 'nke'],
    'Adidas': ['adidas', 'addidas', 'adiddas'],
    'Puma': ['puma'],
    'PUMA': ['puma'],
    'H&M': ['h&m', 'hm', 'h and m', 'h & m', 'handm'],
    'Tommy Hilfiger': ['tommy hilfiger', 'tommy', 'hilfiger'],
    'Calvin Klein': ['calvin klein', 'ck', 'calvin'],
    'U.S. Polo Assn.': ['us polo', 'uspa', 'us polo assn', 'u.s. polo'],
    "Levi's": ['levis', "levi's", 'levi'],
    'Jack & Jones': ['jack & jones', 'jack and jones', 'j&j', 'jackandjones'],
    'HRX by Hrithik Roshan': ['hrx', 'hrx by hrithik'],
    'HRX': ['hrx'],
    // Luxury & Premium brands
    'Hermès': ['hermes', 'hermès'],
    'Yves Saint Laurent': ['yves saint laurent', 'ysl', 'saint laurent'],
    'Dior': ['dior', 'christian dior'],
    'Versace': ['versace'],
    'Dolce & Gabbana': ['dolce & gabbana', 'dolce and gabbana', 'd&g', 'dg'],
    'Jean Paul Gaultier': ['jean paul gaultier', 'jpg', 'gaultier'],
    'Armani': ['armani', 'giorgio armani'],
    'Paco Rabanne': ['paco rabanne', 'rabanne'],
    'Creed': ['creed'],
    // Indian & Traditional brands
    'House of Pataudi': ['house of pataudi', 'pataudi'],
    'Manyavar': ['manyavar'],
    'Diwas by Manyavar': ['diwas', 'diwas by manyavar'],
    'TheEthnic.Co': ['theethnic.co', 'theethnic', 'the ethnic co'],
    'KISAH': ['kisah'],
    'Vastramay': ['vastramay'],
    'Kalpraag': ['kalpraag'],
    // Multi-word brands
    'Allen Solly': ['allen solly'],
    'Peter England': ['peter england'],
    'Peter England Elite': ['peter england elite'],
    'Van Heusen': ['van heusen'],
    'Louis Philippe': ['louis philippe', 'lp'],
    'Red Tape': ['red tape', 'redtape'],
    'United Colors of Benetton': ['united colors of benetton', 'benetton', 'ucb'],
    'The Indian Garage Co': ['the indian garage co', 'indian garage co', 'tigc'],
    'The Bear House': ['the bear house', 'bear house'],
    'The Souled Store': ['the souled store', 'souled store', 'tss'],
    'The Man Company': ['the man company', 'man company'],
    'The Derma Co': ['the derma co', 'derma co'],
    'Mast & Harbour': ['mast & harbour', 'mast and harbour'],
    'Campus Sutra': ['campus sutra'],
    'Rare Rabbit': ['rare rabbit'],
    'Monte Carlo': ['monte carlo'],
    'Marks & Spencer': ['marks & spencer', 'marks and spencer', 'm&s'],
    'French Connection': ['french connection', 'fcuk'],
    'Mr Bowerbird': ['mr bowerbird', 'bowerbird'],
    'Here & Now': ['here & now', 'here and now', 'here&now'],
    'Dot & Key': ['dot & key', 'dot and key', 'dot&key'],
    'Skinn by Titan': ['skinn', 'skinn by titan'],
    'Wild Stone': ['wild stone', 'wildstone'],
    'Bella Vita': ['bella vita', 'bellavita'],
    'Royal Enfield': ['royal enfield'],
    'TBOJ (The Bar of Jackets)': ['tboj', 'the bar of jackets'],
    'StyleCast x Revolte': ['stylecast', 'stylecast x revolte', 'revolte'],
    'PUMA Motorsport': ['puma motorsport'],
    'Replica (Maison Margiela)': ['replica', 'maison margiela', 'margiela'],
    'Urbano Fashion': ['urbano fashion', 'urbano'],
    'Yellow Chimes': ['yellow chimes'],
    'Chemist at Play': ['chemist at play'],
    'Ahmed Al Maghribi': ['ahmed al maghribi', 'ahmed maghribi'],
    'ADILQADRI': ['adilqadri', 'adil qadri'],
    "L'Oréal": ["l'oreal", 'loreal', "l'oréal"],
    'Pepe Jeans': ['pepe jeans', 'pepe'],
    'See Designs': ['see designs'],
    'Leather Retail': ['leather retail'],
    'Vector X': ['vector x', 'vectorx'],
    'DRIP SPOILER': ['drip spoiler'],
    'Banana Club': ['banana club'],
    'Pierre Carlo': ['pierre carlo'],
    'Being Human': ['being human'],
    'Bene Kleed': ['bene kleed'],
    'Fashion Frill': ['fashion frill'],
    'Park Avenue': ['park avenue'],
    'Vincent Chase': ['vincent chase'],
    'Thomas Crick': ['thomas crick'],
    'Louis Stitch': ['louis stitch'],
    'Spade Club': ['spade club'],
    'Studio Nexx': ['studio nexx'],
});

export const OCCASION_MAP = {
    'wedding': {
        categories: ['Traditional', 'Shirt', 'Shoes', 'Mens Accessories'],
        tags: ['wedding', 'marriage', 'shaadi', 'festive', 'ethnic', 'celebration'],
    },
    'party': {
        categories: ['Traditional', 'Shirt', 'Shoes', 'Mens Accessories', 'Jacket'],
        tags: ['party', 'club', 'night out', 'celebration', 'event'],
    },
    'gym': {
        categories: ['Tshirt', 'Trackpants', 'Shoes'],
        tags: ['gym', 'workout', 'fitness', 'training', 'exercise', 'athletic'],
    },
    'office': {
        categories: ['Traditional', 'Shirt', 'Shoes', 'Mens Accessories'],
        tags: ['office', 'formal', 'professional', 'business', 'work', 'corporate', 'meeting'],
    },
    'casual': {
        categories: ['Tshirt', 'Jeans', 'Hoodies', 'Shoes', 'Trackpants', 'Sweatshirt'],
        tags: ['casual', 'everyday', 'relaxed', 'comfortable', 'weekend', 'daily'],
    },
    'winter': {
        categories: ['Jacket', 'Sweater', 'Hoodies', 'Sweatshirt', 'Innerwear'],
        tags: ['winter', 'warm', 'cold', 'thermal', 'cozy', 'layering', 'snow'],
    },
    'summer': {
        categories: ['Tshirt', 'Shirt', 'Jeans', 'Shoes'],
        tags: ['summer', 'light', 'breathable', 'cool', 'airy', 'cotton', 'linen'],
    },
    'streetwear': {
        categories: ['Hoodies', 'Tshirt', 'Jacket', 'Shoes', 'Jeans'],
        tags: ['streetwear', 'urban', 'street', 'hip', 'trendy', 'modern', 'hypebeast'],
    },
    'minimalist': {
        categories: ['Tshirt', 'Shirt', 'Jeans', 'Shoes'],
        tags: ['minimalist', 'minimal', 'simple', 'clean', 'basic', 'plain', 'solid'],
    },
    'luxury': {
        categories: ['Perfume', 'Mens Accessories', 'Shoes', 'Jacket', 'Traditional'],
        tags: ['luxury', 'premium', 'expensive', 'designer', 'high-end', 'exclusive'],
    },
    'grooming': {
        categories: ['Body Care', 'Perfume'],
        tags: ['grooming', 'skincare', 'care', 'hygiene', 'wellness'],
    },
    'running': {
        categories: ['Tshirt', 'Shoes', 'Trackpants'],
        tags: ['running', 'jogging', 'marathon', 'sprint', 'cardio', 'athletic'],
    },
};

const NORMALIZE_REGEX = /[^a-z0-9\s&-]/g;

function normalizeText(text) {
    return text.toLowerCase().trim().replace(NORMALIZE_REGEX, '');
}

function findMatch(query, aliasMap, originalList) {
    const q = normalizeText(query);
    const words = q.split(/\s+/);

    for (const [key, aliases] of Object.entries(aliasMap)) {
        if (aliases.includes(q)) {
            return key;
        }
    }


    const sortedEntries = Object.entries(aliasMap).map(([key, aliases]) => ({
        key,
        aliases: [...aliases].sort((a, b) => b.length - a.length)
    }));

    // Check longer aliases first across all categories
    const allAliasesWithKeys = [];
    for (const { key, aliases } of sortedEntries) {
        for (const alias of aliases) {
            allAliasesWithKeys.push({ key, alias });
        }
    }
    // Sort by alias length descending
    allAliasesWithKeys.sort((a, b) => b.alias.length - a.alias.length);

    for (const { key, alias } of allAliasesWithKeys) {
        if (q === alias || q.includes(alias)) {
            return key;
        }
    }

    // Third pass: check individual words
    for (const word of words) {
        for (const [key, aliases] of Object.entries(aliasMap)) {
            if (aliases.includes(word)) {
                return key;
            }
        }
    }

    // Final pass: check original list
    for (const item of originalList) {
        if (q.includes(item.toLowerCase())) {
            return item;
        }
    }

    return null;
}

function findAllColors(query) {
    const q = normalizeText(query);
    const found = [];

    const multiWordColors = ['sky blue', 'light blue', 'baby blue', 'navy blue', 'dark blue',
        'olive green', 'army green', 'forest green', 'dusty pink', 'royal blue', 'off white'];

    for (const color of multiWordColors) {
        if (q.includes(color)) {
            for (const [key, aliases] of Object.entries(COLOR_ALIASES)) {
                if (aliases.includes(color)) {
                    found.push(key);
                    break;
                }
            }
        }
    }

    if (found.length === 0) {
        const words = q.split(/\s+/);
        for (const word of words) {
            for (const [key, aliases] of Object.entries(COLOR_ALIASES)) {
                if (aliases.includes(word)) {
                    found.push(key);
                    break;
                }
            }
        }
    }

    return [...new Set(found)];
}

function findBrand(query) {
    const q = normalizeText(query);
    const words = q.split(/\s+/);

    const multiWordBrands = [
        // Common multi-word brands
        'tommy hilfiger', 'calvin klein', 'jack & jones', 'jack and jones', 'us polo', 'us polo assn',
        'h&m', 'allen solly', 'peter england', 'peter england elite', 'van heusen', 'louis philippe',
        'red tape', 'hrx by hrithik', 'united colors of benetton', 'the indian garage co', 'indian garage co',
        'the bear house', 'bear house', 'the souled store', 'souled store', 'rare rabbit', 'campus sutra',
        'mast & harbour', 'mast and harbour',
        // Premium & Luxury
        'yves saint laurent', 'saint laurent', 'jean paul gaultier', 'dolce & gabbana', 'dolce and gabbana',
        'paco rabanne', 'giorgio armani', 'armani beauty', 'ahmed al maghribi', 'adil qadri',
        // Indian & Traditional
        'house of pataudi', 'diwas by manyavar', 'the ethnic co', 'see designs', 'leather retail',
        // More multi-word brands
        'marks & spencer', 'marks and spencer', 'french connection', 'mr bowerbird', 'here & now', 'here and now',
        'dot & key', 'dot and key', 'skinn by titan', 'wild stone', 'bella vita', 'royal enfield',
        'the bar of jackets', 'stylecast x revolte', 'puma motorsport', 'maison margiela',
        'urbano fashion', 'yellow chimes', 'chemist at play', 'the man company', 'the derma co', 'derma co',
        'monte carlo', 'bene kleed', 'being human', 'banana club', 'pierre carlo', 'fashion frill',
        'park avenue', 'vincent chase', 'thomas crick', 'louis stitch', 'spade club', 'studio nexx',
        'vector x', 'drip spoiler', 'pepe jeans'
    ];

    for (const brand of multiWordBrands) {
        if (q.includes(brand)) {
            for (const [key, aliases] of Object.entries(BRAND_ALIASES)) {
                if (aliases.some(a => a === brand || brand.includes(a))) {
                    return key;
                }
            }
        }
    }

    for (const word of words) {
        if (word.length < 2) continue;
        for (const [key, aliases] of Object.entries(BRAND_ALIASES)) {
            if (aliases.includes(word)) {
                return key;
            }
        }
    }

    return null;
}

export function expandQuery(query) {
    if (!query?.trim()) {
        return { original: '', category: null, subcategory: null, color: null, brand: null, occasion: null, semanticTags: [], searchTerms: [], confidence: 0 };
    }

    const q = normalizeText(query);
    const words = q.split(/\s+/).filter(w => w.length > 1);

    const result = {
        original: query,
        category: null,
        subcategory: null,
        color: null,
        brand: null,
        occasion: null,
        semanticTags: new Set(),
        searchTerms: [],
        confidence: 0,
    };

    const colors = findAllColors(q);
    if (colors.length > 0) {
        result.color = colors[0];
        result.confidence++;
    }

    result.brand = findBrand(q);
    if (result.brand) result.confidence++;

    result.category = findMatch(q, CATEGORY_ALIASES, PRODUCT_CATEGORIES);
    if (result.category) result.confidence++;

    if (result.category && PRODUCT_SUBCATEGORIES[result.category]) {
        const subs = PRODUCT_SUBCATEGORIES[result.category];
        for (const sub of subs) {
            const subAliases = SUBCATEGORY_ALIASES[sub] || [sub.toLowerCase()];
            for (const alias of subAliases) {
                if (q.includes(alias)) {
                    result.subcategory = sub;
                    result.confidence++;
                    break;
                }
            }
            if (result.subcategory) break;
        }
    }

    if (!result.subcategory) {
        for (const [sub, aliases] of Object.entries(SUBCATEGORY_ALIASES)) {
            for (const alias of aliases) {
                if (q.includes(alias)) {
                    result.subcategory = sub;
                    for (const [cat, subs] of Object.entries(PRODUCT_SUBCATEGORIES)) {
                        if (subs.includes(sub)) {
                            if (!result.category) {
                                result.category = cat;
                                result.confidence++;
                            }
                            break;
                        }
                    }
                    result.confidence++;
                    break;
                }
            }
            if (result.subcategory) break;
        }
    }

    for (const [occasion, config] of Object.entries(OCCASION_MAP)) {
        if (config.tags.some(tag => q.includes(tag))) {
            result.occasion = occasion;
            if (!result.category && config.categories.length > 0) {
                result.semanticTags.add(occasion);
                config.tags.forEach(t => result.semanticTags.add(t));
            }
            result.confidence++;
            break;
        }
    }

    if (result.category) result.semanticTags.add(result.category.toLowerCase());
    if (result.subcategory) result.semanticTags.add(result.subcategory.toLowerCase());
    if (result.color) result.semanticTags.add(result.color.toLowerCase());
    if (result.brand) result.semanticTags.add(result.brand.toLowerCase());

    const stopWords = ['for', 'the', 'and', 'with', 'men', 'mens', 'man', 'male', 'buy', 'shop', 'best', 'new', 'latest'];
    result.searchTerms = words.filter(w =>
        w.length >= 3 &&
        !stopWords.includes(w) &&
        !result.semanticTags.has(w)
    );

    return {
        ...result,
        semanticTags: Array.from(result.semanticTags),
        isCompound: result.confidence >= 2,
        hasColorCategory: !!(result.color && result.category),
        hasBrandCategory: !!(result.brand && result.category),
    };
}

export function getRelatedColors(color) {
    if (!color) return [];
    const aliases = COLOR_ALIASES[color] || [];
    return aliases.filter(a => a !== color.toLowerCase());
}

export { OCCASION_MAP as OCCASION_MAPPINGS, COLOR_ALIASES, CATEGORY_ALIASES, SUBCATEGORY_ALIASES, BRAND_ALIASES };
