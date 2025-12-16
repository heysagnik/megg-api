import app from './api.js';
import { handleAutocomplete } from './autocomplete.js';
import { handleIntentResolution } from './intent.js';

async function handleCachePurge(request, env) {
    const authHeader = request.headers.get('Authorization');
    const expectedToken = env.PURGE_TOKEN || 'your-secret-token';

    if (authHeader !== `Bearer ${expectedToken}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const body = await request.json();
        const paths = body.paths || [];
        const cache = caches.default;
        const purged = [];

        for (const path of paths) {
            const key = new Request(`${env.ORIGIN_URL || 'https://megg-api.vercel.app'}${path}`);
            await cache.delete(key);
            purged.push(path);
        }

        return new Response(JSON.stringify({ success: true, purged }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Purge failed', message: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // Autocomplete endpoint (Edge Intelligence)
        if (pathname === '/api/autocomplete') {
            return handleAutocomplete(request, env);
        }

        // Intent resolution endpoint (Edge Intelligence)
        if (pathname === '/api/intent') {
            return handleIntentResolution(request, env);
        }

        // Worker Health
        if (pathname === '/__worker/health') {
            return new Response(JSON.stringify({
                status: 'ok',
                edge: request.cf?.colo || 'unknown',
                mode: 'hono-api',
                timestamp: new Date().toISOString()
            }), { headers: { 'Content-Type': 'application/json' } });
        }

        // Cache Purge
        if (pathname === '/__worker/purge' && request.method === 'POST') {
            return handleCachePurge(request, env);
        }

        // Delegate ALL other API requests to the Hono App (api.js)
        // This handles: /api/products, /api/auth, /api/search (proxy), etc.
        return app.fetch(request, env, ctx);
    }
};
