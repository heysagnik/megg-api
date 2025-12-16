// Autocomplete suggestions handler
// Returns static suggestions based on query prefix

const POPULAR_BRANDS = [
    'Nike', 'Adidas', 'Puma', 'Reebok', 'H&M', 'Zara', 'Levis',
    'Tommy Hilfiger', 'Calvin Klein', 'Ralph Lauren', 'Gap', 'Uniqlo'
];

const POPULAR_CATEGORIES = [
    'Shoes', 'Tshirt', 'Jeans', 'Jacket', 'Hoodies', 'Shirt', 'Sweater',
    'Sports Wear', 'Office Wear', 'Trackpants', 'Mens Accessories'
];

const POPULAR_SEARCHES = [
    'running shoes', 'casual tshirt', 'formal shirt', 'winter jacket',
    'gym wear', 'party outfit', 'office shoes', 'summer clothes',
    'streetwear hoodie', 'minimalist design'
];

export async function handleAutocomplete(request, env) {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q')?.toLowerCase() || '';

        if (query.length < 2) {
            return jsonResponse({ suggestions: [] });
        }

        // Check cache first
        const cacheKey = `autocomplete:${query}`;
        if (env.SEARCH_KV) {
            const cached = await env.SEARCH_KV.get(cacheKey);
            if (cached) {
                return jsonResponse(JSON.parse(cached), { 'X-Cache': 'HIT' });
            }
        }

        const suggestions = [];

        // Match brands
        POPULAR_BRANDS.forEach(brand => {
            if (brand.toLowerCase().includes(query)) {
                suggestions.push({ type: 'brand', value: brand, label: brand });
            }
        });

        // Match categories
        POPULAR_CATEGORIES.forEach(category => {
            if (category.toLowerCase().includes(query)) {
                suggestions.push({ type: 'category', value: category, label: category });
            }
        });

        // Match popular searches
        POPULAR_SEARCHES.forEach(search => {
            if (search.includes(query)) {
                suggestions.push({ type: 'search', value: search, label: search });
            }
        });

        const result = {
            suggestions: suggestions.slice(0, 10),
            query
        };

        // Cache for 1 hour
        if (env.SEARCH_KV) {
            await env.SEARCH_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
        }

        return jsonResponse(result, { 'X-Cache': 'MISS' });
    } catch (error) {
        return jsonResponse({ error: 'Autocomplete failed', message: error.message }, 500);
    }
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
