import { PRODUCT_CATEGORIES, PRODUCT_SUBCATEGORIES } from './constants.js';

export const CATEGORY_MAP = {
    'Jacket': ['jacket', 'jackets', 'coat', 'coats', 'outerwear', 'blazer'],
    'Hoodies': ['hoodie', 'hoodies', 'hood', 'pullover'],
    'Sweater': ['sweater', 'sweaters', 'pullover', 'knitwear', 'jumper', 'cardigan'],
    'Sweatshirt': ['sweatshirt', 'sweatshirts', 'crewneck', 'fleece'],
    'Shirt': ['shirt', 'shirts', 'button-up', 'button up', 'oxford'],
    'Jeans': ['jeans', 'denim', 'pants', 'trousers', 'bottoms'],
    'Trackpants': ['trackpants', 'track pants', 'joggers', 'sweatpants', 'lowers'],
    'Shoes': ['shoes', 'shoe', 'footwear', 'sneakers', 'kicks'],
    'Tshirt': ['tshirt', 't-shirt', 't shirt', 'tee', 'tees'],
    'Mens Accessories': ['accessories', 'accessory', 'watch', 'bag', 'cap', 'belt', 'sunglasses'],
    'Sports Wear': ['sports', 'sportswear', 'athletic', 'gym', 'workout', 'fitness', 'activewear'],
    'Office Wear': ['office', 'formal', 'business', 'professional', 'corporate', 'work'],
    'Body Care': ['bodycare', 'body care', 'skincare', 'grooming', 'facewash', 'moisturizer'],
    'Traditional': ['traditional', 'ethnic', 'indian', 'kurta', 'festive'],
    'Perfume': ['perfume', 'fragrance', 'cologne', 'scent', 'deodorant'],
    'Innerwear': ['innerwear', 'underwear', 'undergarments', 'briefs', 'boxers', 'vests'],
};

export const SUBCATEGORY_MAP = {
    'Puffer Jacket': ['puffer', 'puffer jacket', 'padded', 'quilted'],
    'Leather Jacket': ['leather', 'leather jacket', 'biker'],
    'Varsity Jacket': ['varsity', 'letterman', 'college jacket'],
    'Bomber Jacket': ['bomber', 'bomber jacket', 'flight jacket'],
    'Biker Jacket': ['biker', 'motorcycle'],
    'Denim Jacket': ['denim jacket', 'jean jacket'],
    'Windcheater': ['windcheater', 'windbreaker', 'rain jacket'],
    'Suede Jacket': ['suede', 'suede jacket'],
    'Overcoat': ['overcoat', 'trench', 'trench coat', 'long coat'],
    'Regular Hoodie': ['regular hoodie', 'pullover hoodie', 'basic hoodie'],
    'Zip Hoodie': ['zip hoodie', 'zipper hoodie', 'full zip'],
    'Printed Hoodie': ['printed hoodie', 'graphic hoodie'],
    'Round Neck Sweater': ['round neck', 'crew neck sweater'],
    'V-Neck Sweater': ['v neck', 'v-neck'],
    'Turtleneck Sweater': ['turtleneck', 'turtle neck', 'high neck'],
    'Cardigan': ['cardigan', 'open front'],
    'Oversized Sweatshirt': ['oversized sweatshirt', 'baggy sweatshirt'],
    'Printed Sweatshirt': ['printed sweatshirt', 'graphic sweatshirt'],
    'Checked Shirt': ['checked', 'check', 'plaid', 'checkered'],
    'Striped Shirt': ['striped', 'stripe', 'stripes'],
    'Printed Shirt': ['printed shirt', 'print'],
    'Linen Shirt': ['linen', 'linen shirt'],
    'Half-Sleeve Shirt': ['half sleeve', 'short sleeve'],
    'Solid Shirt': ['solid', 'plain'],
    'Shacket': ['shacket', 'shirt jacket'],
    'Wide-Leg Jeans': ['wide leg', 'wide-leg', 'baggy jeans'],
    'Straight Fit Jeans': ['straight', 'straight fit', 'regular fit'],
    'Cargo Pants': ['cargo', 'cargo pants'],
    'Bootcut Jeans': ['bootcut', 'boot cut'],
    'Chinos': ['chinos', 'chino', 'khaki'],
    'Linen Pants': ['linen pants', 'linen trousers'],
    'Baggy Trackpants': ['baggy', 'loose fit', 'relaxed'],
    'Cargo Trackpants': ['cargo trackpants', 'cargo joggers'],
    'Sneakers': ['sneakers', 'sneaker', 'trainers', 'kicks'],
    'Boots': ['boots', 'boot', 'ankle boots'],
    'Loafers': ['loafers', 'loafer', 'slip-on', 'moccasin'],
    'Canvas Shoes': ['canvas', 'canvas shoes'],
    'Clogs': ['clogs', 'clog'],
    'Regular Fit T-Shirt': ['regular fit', 'regular tshirt', 'basic tshirt', 'classic fit'],
    'Oversized T-Shirt': ['oversized', 'oversized tshirt', 'baggy tshirt', 'loose fit'],
    'Polo T-Shirt': ['polo', 'polo shirt', 'collar tshirt'],
    'Full-Sleeve T-Shirt': ['full sleeve', 'long sleeve'],
    'Gym T-Shirt': ['gym tshirt', 'workout tshirt', 'sports tshirt', 'dri-fit'],
    'Bags': ['bag', 'bags', 'backpack', 'messenger', 'duffel', 'sling'],
    'Caps': ['cap', 'caps', 'hat', 'snapback', 'baseball cap'],
    'Watches': ['watch', 'watches', 'wristwatch', 'timepiece'],
    'Belts': ['belt', 'belts', 'waist belt'],
    'Sunglasses': ['sunglasses', 'shades', 'aviator', 'wayfarers'],
    'Rings': ['ring', 'rings', 'finger ring'],
    'Chains': ['chain', 'chains', 'necklace', 'pendant'],
    'Shorts': ['shorts', 'short'],
    'Sports Jacket': ['sports jacket', 'track jacket', 'training jacket'],
    'Socks': ['socks', 'sock', 'ankle socks'],
    'Football Shoes': ['football shoes', 'cleats', 'studs'],
    'Badminton Shoes': ['badminton shoes', 'court shoes'],
    'Sports Shoes': ['sports shoes', 'running shoes', 'athletic shoes', 'trainers'],
    'Formal Shirts': ['formal shirt', 'dress shirt', 'office shirt'],
    'Formal Pants': ['formal pants', 'dress pants', 'office pants', 'trousers'],
    'Formal Shoes': ['formal shoes', 'dress shoes', 'oxford', 'derby'],
    'Suits': ['suit', 'suits', 'two piece', 'three piece'],
    'Tuxedo': ['tuxedo', 'tux', 'dinner jacket'],
    'Blazers': ['blazer', 'blazers', 'sport coat'],
    'Ties & Pocket Squares': ['tie', 'ties', 'pocket square', 'necktie', 'bow tie'],
    'Face Wash': ['face wash', 'facewash', 'cleanser', 'face cleanser'],
    'Moisturiser': ['moisturizer', 'moisturiser', 'lotion', 'cream'],
    'Sunscreen': ['sunscreen', 'spf', 'sun protection'],
    'Serum': ['serum', 'face serum'],
    'Underarm Roll-On': ['roll-on', 'deodorant', 'underarm'],
    'Shampoo': ['shampoo', 'hair wash'],
    'Body Wash': ['body wash', 'shower gel'],
    'Hair Oil': ['hair oil', 'oil'],
    'Kurta': ['kurta', 'kurtas'],
    'Pyjama': ['pyjama', 'pajama', 'pyjamas'],
    'Short Kurta': ['short kurta'],
    'Kurta Set': ['kurta set', 'kurta pyjama', 'kurta pajama'],
    'Indo-Western Outfit': ['indo western', 'fusion', 'indo-western'],
    'Nehru Jacket': ['nehru jacket', 'nehru', 'bundi', 'waistcoat'],
    'Ethnic Shoes': ['ethnic shoes', 'mojari', 'jutis', 'kolhapuri'],
    'Luxurious': ['luxurious', 'luxury', 'premium', 'expensive', 'edp', 'eau de parfum'],
    'Budget-Friendly': ['budget', 'affordable', 'cheap', 'edt', 'eau de toilette'],
    'Trunks': ['trunks', 'trunk'],
    'Vests': ['vest', 'vests', 'sleeveless'],
    'Boxers': ['boxer', 'boxers', 'boxer shorts'],
    'Thermal Wear': ['thermal', 'thermals', 'thermal wear', 'winter innerwear'],
};

export const COLOR_MAP = {
    'Black': ['black', 'noir', 'jet', 'ebony', 'charcoal'],
    'White': ['white', 'off-white', 'ivory', 'cream', 'pearl'],
    'Blue': ['blue', 'navy', 'royal blue', 'cobalt', 'azure', 'indigo'],
    'Sky Blue': ['sky blue', 'light blue', 'baby blue', 'powder blue'],
    'Dark Blue': ['dark blue', 'navy blue', 'midnight blue', 'deep blue'],
    'Grey': ['grey', 'gray', 'silver', 'slate', 'ash', 'smoke'],
    'Red': ['red', 'crimson', 'ruby', 'scarlet'],
    'Maroon': ['maroon', 'burgundy', 'wine', 'bordeaux'],
    'Green': ['green', 'forest green', 'hunter green', 'emerald'],
    'Olive Green': ['olive', 'olive green', 'army green', 'military green'],
    'Brown': ['brown', 'chocolate', 'coffee', 'mocha'],
    'Beige': ['beige', 'tan', 'khaki', 'camel', 'sand', 'nude', 'taupe'],
    'Pink': ['pink', 'rose', 'blush', 'coral', 'salmon'],
    'Yellow': ['yellow', 'mustard', 'gold', 'amber', 'lemon'],
    'Orange': ['orange', 'rust', 'copper', 'tangerine', 'peach'],
    'Purple': ['purple', 'violet', 'lavender', 'plum', 'magenta'],
    'Denim': ['denim', 'denim blue', 'washed blue'],
};

export const OCCASION_MAP = {
    'wedding': {
        categories: ['Traditional', 'Office Wear', 'Shoes', 'Mens Accessories'],
        tags: ['wedding', 'party', 'festive', 'ethnic', 'formal', 'celebration', 'sherwani'],
    },
    'party': {
        categories: ['Traditional', 'Shirt', 'Shoes', 'Mens Accessories', 'Jacket'],
        tags: ['party', 'club', 'night out', 'celebration', 'event'],
    },
    'gym': {
        categories: ['Sports Wear', 'Tshirt', 'Trackpants', 'Shoes'],
        tags: ['gym', 'workout', 'fitness', 'training', 'exercise', 'athletic'],
    },
    'office': {
        categories: ['Office Wear', 'Shirt', 'Shoes', 'Mens Accessories'],
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
        categories: ['Tshirt', 'Shirt', 'Jeans', 'Shoes', 'Shorts'],
        tags: ['summer', 'light', 'breathable', 'cool', 'airy', 'cotton', 'linen'],
    },
    'streetwear': {
        categories: ['Hoodies', 'Tshirt', 'Jacket', 'Shoes', 'Jeans'],
        tags: ['streetwear', 'urban', 'street', 'hip', 'trendy', 'modern'],
    },
    'minimalist': {
        categories: ['Tshirt', 'Shirt', 'Jeans', 'Shoes'],
        tags: ['minimalist', 'minimal', 'simple', 'clean', 'basic', 'plain', 'solid'],
    },
    'luxury': {
        categories: ['Perfume', 'Mens Accessories', 'Shoes', 'Jacket', 'Office Wear'],
        tags: ['luxury', 'premium', 'expensive', 'designer', 'high-end', 'exclusive'],
    },
    'grooming': {
        categories: ['Body Care', 'Perfume'],
        tags: ['grooming', 'skincare', 'care', 'hygiene', 'wellness'],
    },
    'running': {
        categories: ['Sports Wear', 'Shoes', 'Tshirt', 'Trackpants'],
        tags: ['running', 'jogging', 'marathon', 'sprint', 'cardio', 'athletic'],
    },
};

export const BRAND_ALIASES = {
    'Nike': ['nike', 'nke'],
    'Adidas': ['adidas', 'addidas', 'adiddas'],
    'Puma': ['puma'],
    'H&M': ['h&m', 'hm', 'h and m', 'h & m'],
    'Zara': ['zara'],
    'Jack & Jones': ['jack & jones', 'jack and jones', 'j&j'],
    'Tommy Hilfiger': ['tommy hilfiger', 'tommy', 'hilfiger'],
    'Calvin Klein': ['calvin klein', 'ck', 'calvin'],
    'Bewakoof': ['bewakoof'],
    'Snitch': ['snitch'],
    'HRX': ['hrx', 'hrx by hrithik'],
    'Peter England': ['peter england', 'pe'],
    'Van Heusen': ['van heusen'],
    'Allen Solly': ['allen solly'],
    'Louis Philippe': ['louis philippe', 'lp'],
    'Fabindia': ['fabindia', 'fab india'],
    'Manyavar': ['manyavar'],
    'US Polo': ['us polo', 'uspa', 'us polo assn'],
    'Levis': ['levis', 'levi\'s', 'levi'],
    'Wrangler': ['wrangler'],
    'Lee': ['lee'],
    'Pepe Jeans': ['pepe', 'pepe jeans'],
    'Flying Machine': ['flying machine', 'fm'],
    'Roadster': ['roadster'],
    'Highlander': ['highlander'],
    'XYXX': ['xyxx'],
    'Jockey': ['jockey'],
};

export const SEASON_SUBCATEGORIES = {
    winter: ['Puffer Jacket', 'Leather Jacket', 'Sweater', 'Cardigan', 'Thermal Wear', 'Hoodies', 'Sweatshirt', 'Overcoat', 'Turtleneck Sweater'],
    summer: ['Linen Shirt', 'Half-Sleeve Shirt', 'Shorts', 'Regular Fit T-Shirt', 'Polo T-Shirt', 'Canvas Shoes', 'Linen Pants'],
};

export const FABRIC_PROPERTIES = {
    breathable: ['cotton', 'linen', 'mesh', 'bamboo', 'rayon'],
    warm: ['wool', 'fleece', 'cashmere', 'thermal', 'velvet'],
    stretchy: ['spandex', 'elastane', 'lycra', 'stretch'],
    durable: ['denim', 'canvas', 'leather', 'nylon', 'polyester'],
    luxurious: ['silk', 'cashmere', 'velvet', 'satin'],
    waterproof: ['polyester', 'nylon', 'gore-tex'],
};

export function findCategory(query) {
    const q = query.toLowerCase();
    for (const [category, aliases] of Object.entries(CATEGORY_MAP)) {
        if (aliases.some(alias => q.includes(alias) || alias.includes(q))) {
            return category;
        }
    }
    return null;
}

export function findSubcategory(query, category = null) {
    const q = query.toLowerCase();
    for (const [subcategory, aliases] of Object.entries(SUBCATEGORY_MAP)) {
        if (aliases.some(alias => q.includes(alias))) {
            if (!category) return subcategory;
            const validSubs = PRODUCT_SUBCATEGORIES[category] || [];
            if (validSubs.includes(subcategory)) return subcategory;
        }
    }
    return null;
}

export function findColor(query) {
    const q = query.toLowerCase();
    for (const [color, aliases] of Object.entries(COLOR_MAP)) {
        if (aliases.some(alias => q.includes(alias))) {
            return color;
        }
    }
    return null;
}

export function findBrand(query) {
    const q = query.toLowerCase();
    for (const [brand, aliases] of Object.entries(BRAND_ALIASES)) {
        if (aliases.some(alias => q.includes(alias))) {
            return brand;
        }
    }
    return null;
}

export function findOccasion(query) {
    const q = query.toLowerCase();
    for (const [occasion, config] of Object.entries(OCCASION_MAP)) {
        if (config.tags.some(tag => q.includes(tag))) {
            return { occasion, ...config };
        }
    }
    return null;
}

export function expandQuery(query) {
    const q = query.toLowerCase();
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
    };

    result.category = findCategory(q);
    result.subcategory = findSubcategory(q, result.category);
    result.color = findColor(q);
    result.brand = findBrand(q);

    const occasionMatch = findOccasion(q);
    if (occasionMatch) {
        result.occasion = occasionMatch.occasion;
        if (!result.category && occasionMatch.categories?.length) {
            result.semanticTags.add(...occasionMatch.tags);
        }
    }

    words.forEach(word => {
        if (word.length >= 3) result.searchTerms.push(word);
    });

    if (result.category) result.semanticTags.add(result.category.toLowerCase());
    if (result.subcategory) result.semanticTags.add(result.subcategory.toLowerCase());
    if (result.color) result.semanticTags.add(result.color.toLowerCase());
    if (result.brand) result.semanticTags.add(result.brand.toLowerCase());

    Object.entries(OCCASION_MAP).forEach(([occ, config]) => {
        if (config.tags.some(tag => q.includes(tag))) {
            result.semanticTags.add(occ);
            config.tags.forEach(t => result.semanticTags.add(t));
        }
    });

    return {
        ...result,
        semanticTags: Array.from(result.semanticTags),
    };
}
