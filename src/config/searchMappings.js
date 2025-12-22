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
    'Mens Accessories': ['accessories', 'accessory', 'watch', 'bag', 'cap', 'belt', 'sunglasses'],
    'Sports': ['sports', 'sportswear', 'athletic', 'gym', 'workout', 'fitness', 'activewear'],
    'Office Wear': ['office', 'formal', 'business', 'professional', 'corporate', 'work', 'formals'],
    'Body Care': ['bodycare', 'body care', 'skincare', 'grooming', 'facewash', 'moisturizer'],
    'Traditional': ['traditional', 'ethnic', 'indian', 'kurta', 'festive'],
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
    'Denim': ['denim jacket', 'jean jacket'],
    'Half': ['half jacket', 'cropped', 'half sleeve jacket'],
    'Overcoat': ['overcoat', 'trench', 'trench coat', 'long coat'],
    'Faux': ['faux', 'faux leather'],
    'Printed': ['printed', 'graphic'],
    'Reversible': ['reversible'],
    'Tailored': ['tailored', 'fitted'],
    'Cotton': ['cotton jacket'],
    'Hiking': ['hiking', 'trekking'],
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
    'Half Sleeve': ['half sleeve', 'short sleeve'],
    'Solid': ['solid', 'plain'],
    'Shacket': ['shacket', 'shirt jacket'],
    'Formal Shirt': ['formal shirt', 'dress shirt'],
    'Wide Leg': ['wide leg', 'wide-leg', 'baggy jeans'],
    'Straight Fit': ['straight', 'straight fit', 'regular fit jeans'],
    'Cargo': ['cargo', 'cargo pants', 'cargo jeans'],
    'Linen Pants': ['linen pants', 'linen trousers'],
    'Bootcut': ['bootcut', 'boot cut'],
    'Chinos': ['chinos', 'chino', 'khaki pants'],
    'Korean Pants': ['korean pants', 'korean style'],
    'Formal Pants': ['formal pants', 'dress pants', 'office pants'],
    'Corduroy': ['corduroy', 'cord'],
    'Baggy': ['baggy', 'loose fit', 'relaxed'],
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
    'Gym Tee': ['gym tee', 'gym tshirt', 'workout tshirt', 'dri-fit'],
    'Football Jersey': ['football jersey', 'jersey', 'soccer jersey'],
    'Bags': ['bag', 'bags', 'backpack', 'messenger', 'duffel', 'sling'],
    'Caps': ['cap', 'caps', 'hat', 'snapback', 'baseball cap'],
    'Watches': ['watch', 'watches', 'wristwatch', 'timepiece'],
    'Belts': ['belt', 'belts', 'waist belt'],
    'Sunglasses': ['sunglasses', 'shades', 'aviator', 'wayfarers'],
    'Rings': ['ring', 'rings', 'finger ring'],
    'Chains': ['chain', 'chains', 'necklace', 'pendant'],
    'Shorts': ['shorts', 'short', 'sports shorts'],
    'Sports Jacket': ['sports jacket', 'track jacket', 'training jacket'],
    'Socks': ['socks', 'sock', 'ankle socks'],
    'Formal Shirts': ['formal shirts', 'office shirt'],
    'Suits': ['suit', 'suits', 'two piece', 'three piece'],
    'Blazers': ['blazer', 'blazers', 'sport coat'],
    'Ties & Pocket Squares': ['tie', 'ties', 'pocket square', 'necktie', 'bow tie'],
    'Face Wash': ['face wash', 'facewash', 'cleanser'],
    'Moisturiser': ['moisturizer', 'moisturiser', 'lotion', 'cream'],
    'Sunscreen': ['sunscreen', 'spf', 'sun protection'],
    'Serum': ['serum', 'face serum'],
    'Roll-On': ['roll-on', 'deodorant', 'underarm'],
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
    'Vests': ['vest', 'vests', 'sleeveless'],
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
    'Nike': ['nike', 'nke'],
    'Adidas': ['adidas', 'addidas', 'adiddas'],
    'Puma': ['puma'],
    'PUMA': ['puma'],
    'H&M': ['h&m', 'hm', 'h and m', 'h & m', 'handm'],
    'Tommy Hilfiger': ['tommy hilfiger', 'tommy', 'hilfiger'],
    'Calvin Klein': ['calvin klein', 'ck', 'calvin'],
    'U.S. Polo Assn.': ['us polo', 'uspa', 'us polo assn', 'u.s. polo'],
    'Levi\'s': ['levis', "levi's", 'levi'],
    'Jack & Jones': ['jack & jones', 'jack and jones', 'j&j', 'jackandjones'],
    'HRX by Hrithik Roshan': ['hrx', 'hrx by hrithik'],
    'HRX': ['hrx'],
});

export const OCCASION_MAP = {
    'wedding': {
        categories: ['Traditional', 'Office Wear', 'Shoes', 'Mens Accessories'],
        tags: ['wedding', 'marriage', 'shaadi', 'festive', 'ethnic', 'celebration'],
    },
    'party': {
        categories: ['Traditional', 'Shirt', 'Shoes', 'Mens Accessories', 'Jacket'],
        tags: ['party', 'club', 'night out', 'celebration', 'event'],
    },
    'gym': {
        categories: ['Sports', 'Tshirt', 'Trackpants', 'Shoes'],
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
        categories: ['Perfume', 'Mens Accessories', 'Shoes', 'Jacket', 'Office Wear'],
        tags: ['luxury', 'premium', 'expensive', 'designer', 'high-end', 'exclusive'],
    },
    'grooming': {
        categories: ['Body Care', 'Perfume'],
        tags: ['grooming', 'skincare', 'care', 'hygiene', 'wellness'],
    },
    'running': {
        categories: ['Sports', 'Shoes', 'Tshirt', 'Trackpants'],
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
        for (const alias of aliases) {
            if (q === alias || q.includes(alias)) {
                return key;
            }
        }
    }

    for (const word of words) {
        for (const [key, aliases] of Object.entries(aliasMap)) {
            if (aliases.includes(word)) {
                return key;
            }
        }
    }

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

    const multiWordBrands = ['tommy hilfiger', 'calvin klein', 'jack & jones', 'us polo',
        'jack and jones', 'h&m', 'allen solly', 'peter england', 'van heusen', 'louis philippe',
        'red tape', 'hrx by hrithik', 'united colors of benetton', 'the indian garage',
        'the bear house', 'the souled store', 'rare rabbit', 'campus sutra', 'mast & harbour'];

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
