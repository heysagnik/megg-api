const CACHE_CONFIG = {
    '/api/color-combos': { ttl: 1800, staleWhileRevalidate: 3600 },
    '/api/categories': { ttl: 3600, staleWhileRevalidate: 7200 },
    '/api/offers': { ttl: 300, staleWhileRevalidate: 600 },
    '/api/reels': { ttl: 300, staleWhileRevalidate: 600 },
    '/api/products': { ttl: 60, staleWhileRevalidate: 300 },
    '/api/trending': { ttl: 300, staleWhileRevalidate: 600 },
    '/api/search': { ttl: 60, staleWhileRevalidate: 300 },
    default: { ttl: 60, staleWhileRevalidate: 120 }
};

const NO_CACHE_ROUTES = ['/api/auth', '/api/admin', '/api/wishlist', '/api/upload', '/api/health'];
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        if (pathname === '/__worker/health') {
            return jsonResponse({
                status: 'ok',
                edge: request.cf?.colo || 'unknown',
                timestamp: new Date().toISOString()
            });
        }

        if (pathname === '/__worker/purge' && request.method === 'POST') {
            return handleCachePurge(request, env);
        }

        if (shouldSkipCache(request, pathname)) {
            return fetchFromOrigin(request, env);
        }

        const cache = caches.default;
        const cacheKey = new Request(url.toString(), request);
        let response = await cache.match(cacheKey);

        if (response) {
            response = new Response(response.body, response);
            response.headers.set('X-Cache-Status', 'HIT');
            response.headers.set('X-Edge-Location', request.cf?.colo || 'unknown');
            return response;
        }

        response = await fetchFromOrigin(request, env);

        if (response.ok && request.method === 'GET') {
            const config = getCacheConfig(pathname);
            const responseToCache = new Response(response.body, response);
            responseToCache.headers.set('Cache-Control',
                `public, max-age=${config.ttl}, stale-while-revalidate=${config.staleWhileRevalidate}`
            );

            ctx.waitUntil(cache.put(cacheKey, responseToCache.clone()));

            responseToCache.headers.set('X-Cache-Status', 'MISS');
            responseToCache.headers.set('X-Edge-Location', request.cf?.colo || 'unknown');
            return responseToCache;
        }

        return response;
    }
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

function shouldSkipCache(request, pathname) {
    if (MUTATING_METHODS.includes(request.method)) return true;

    for (const route of NO_CACHE_ROUTES) {
        if (pathname.startsWith(route)) return true;
    }

    const cc = request.headers.get('Cache-Control');
    if (cc && (cc.includes('no-cache') || cc.includes('no-store'))) return true;

    return false;
}

function getCacheConfig(pathname) {
    for (const [route, config] of Object.entries(CACHE_CONFIG)) {
        if (route !== 'default' && pathname.startsWith(route)) return config;
    }
    return CACHE_CONFIG.default;
}

async function fetchFromOrigin(request, env) {
    const originUrl = env.ORIGIN_URL || 'https://your-vercel-app.vercel.app';
    const url = new URL(request.url);
    const targetUrl = `${originUrl}${url.pathname}${url.search}`;

    const originRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });

    try {
        const response = await fetch(originRequest);
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('X-Origin', 'vercel');
        return newResponse;
    } catch (error) {
        return jsonResponse({ error: 'Origin unavailable', message: error.message }, 502);
    }
}

async function handleCachePurge(request, env) {
    const authHeader = request.headers.get('Authorization');
    const expectedToken = env.PURGE_TOKEN || 'your-secret-token';

    if (authHeader !== `Bearer ${expectedToken}`) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    try {
        const body = await request.json();
        const paths = body.paths || [];
        const cache = caches.default;
        const purged = [];

        for (const path of paths) {
            const key = new Request(`${env.ORIGIN_URL || 'https://your-app.vercel.app'}${path}`);
            await cache.delete(key);
            purged.push(path);
        }

        return jsonResponse({ success: true, purged });
    } catch (error) {
        return jsonResponse({ error: 'Purge failed', message: error.message }, 500);
    }
}
