const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

const KV_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}`;

export const CACHE_TTL = {
    PRODUCTS: 900,
    TRENDING: 300,
    CATEGORIES: 3600,
    COLOR_COMBOS: 3600,
    REELS: 900,
    OFFERS: 900
};

export const kvGet = async (key) => {
    if (!CF_API_TOKEN) return null;

    try {
        const response = await fetch(`${KV_API_BASE}/values/${encodeURIComponent(key)}`, {
            headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` }
        });

        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
};

export const kvSet = async (key, value, ttl = 900) => {
    if (!CF_API_TOKEN) return;

    try {
        await fetch(`${KV_API_BASE}/values/${encodeURIComponent(key)}?expiration_ttl=${ttl}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${CF_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(value)
        });
    } catch {
        // Silently fail cache writes
    }
};

export const kvDelete = async (key) => {
    if (!CF_API_TOKEN) return;

    try {
        await fetch(`${KV_API_BASE}/values/${encodeURIComponent(key)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` }
        });
    } catch {
        // Silently fail
    }
};

export const getCached = async (key, ttl, fetchFn) => {
    const cached = await kvGet(key);
    if (cached) return cached;

    const data = await fetchFn();
    await kvSet(key, data, ttl);
    return data;
};

export const invalidateCache = async (key) => await kvDelete(key);
