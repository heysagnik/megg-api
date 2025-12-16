// Intent resolution handler
// Analyzes search queries and returns structured intent information

const BRAND_PATTERNS = [
    'nike', 'adidas', 'puma', 'reebok', 'h&m', 'zara', 'levis',
    'tommy hilfiger', 'calvin klein', 'ralph lauren', 'gap', 'uniqlo'
];

const CATEGORY_PATTERNS = {
    'shoes': ['shoes', 'sneakers', 'boots', 'loafers', 'clogs'],
    'tshirt': ['tshirt', 't-shirt', 'tee'],
    'jeans': ['jeans', 'denim', 'pants'],
    'jacket': ['jacket', 'coat', 'blazer'],
    'hoodies': ['hoodie', 'sweatshirt'],
    'formal': ['formal', 'office', 'business', 'suit'],
    'casual': ['casual', 'everyday', 'regular'],
    'sports': ['sports', 'gym', 'athletic', 'workout', 'running'],
};

const COLOR_PATTERNS = [
    'black', 'white', 'blue', 'red', 'green', 'yellow', 'grey', 'gray',
    'brown', 'navy', 'beige', 'olive', 'maroon', 'pink', 'orange'
];

const STYLE_PATTERNS = {
    'minimalist': ['minimal', 'simple', 'clean', 'basic', 'plain'],
    'streetwear': ['street', 'urban', 'oversized', 'trendy'],
    'formal': ['formal', 'professional', 'office'],
    'casual': ['casual', 'relaxed', 'comfortable'],
};

export async function handleIntentResolution(request, env) {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q')?.toLowerCase() || '';

        if (!query) {
            return jsonResponse({ error: 'Query required' }, 400);
        }

        // Check cache first
        const cacheKey = `intent:${query}`;
        if (env.SEARCH_KV) {
            const cached = await env.SEARCH_KV.get(cacheKey);
            if (cached) {
                return jsonResponse(JSON.parse(cached), { 'X-Cache': 'HIT' });
            }
        }

        const intent = {
            query,
            brand: null,
            category: null,
            color: null,
            style: null,
            confidence: 0
        };

        // Detect brand
        for (const brand of BRAND_PATTERNS) {
            if (query.includes(brand.toLowerCase())) {
                intent.brand = brand;
                intent.confidence += 0.3;
                break;
            }
        }

        // Detect category
        for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
            if (patterns.some(p => query.includes(p))) {
                intent.category = category;
                intent.confidence += 0.3;
                break;
            }
        }

        // Detect color
        for (const color of COLOR_PATTERNS) {
            if (query.includes(color)) {
                intent.color = color;
                intent.confidence += 0.2;
                break;
            }
        }

        // Detect style
        for (const [style, patterns] of Object.entries(STYLE_PATTERNS)) {
            if (patterns.some(p => query.includes(p))) {
                intent.style = style;
                intent.confidence += 0.2;
                break;
            }
        }

        const result = {
            intent,
            hints: generateHints(intent)
        };

        // Cache for 6 hours
        if (env.SEARCH_KV) {
            await env.SEARCH_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 21600 });
        }

        return jsonResponse(result, { 'X-Cache': 'MISS' });
    } catch (error) {
        return jsonResponse({ error: 'Intent resolution failed', message: error.message }, 500);
    }
}

function generateHints(intent) {
    const hints = [];

    if (intent.brand) {
        hints.push(`Searching for ${intent.brand} products`);
    }
    if (intent.category) {
        hints.push(`Category: ${intent.category}`);
    }
    if (intent.color) {
        hints.push(`Color filter: ${intent.color}`);
    }
    if (intent.style) {
        hints.push(`Style: ${intent.style}`);
    }

    return hints;
}

function jsonResponse(data, extraHeaders = {}, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            ...extraHeaders
        }
    });
}
