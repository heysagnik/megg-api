/**
 * Embedding Generation Module
 * Uses Cloudflare Workers AI: @cf/baai/bge-small-en-v1.5 (384 dimensions)
 */

export const EMBEDDING_MODEL = '@cf/baai/bge-small-en-v1.5';
export const EMBEDDING_DIM = 384;

export async function generateQueryEmbedding(ai, query) {
    if (!query || query.length < 2) return null;

    try {
        const response = await ai.run(EMBEDDING_MODEL, {
            text: [query.toLowerCase()],
        });

        if (response?.data?.[0]) {
            return response.data[0];
        }

        console.error('Invalid AI response:', response);
        return null;
    } catch (error) {
        console.error('Embedding generation failed:', error.message);
        return null;
    }
}

export function formatEmbeddingForQuery(embedding) {
    if (!embedding || !Array.isArray(embedding)) return null;
    return `[${embedding.join(',')}]`;
}

export async function getCachedOrGenerateEmbedding(kv, ai, query) {
    const cacheKey = `emb:${query.toLowerCase().trim()}`;

    const cached = await kv.get(cacheKey, 'json');
    if (cached) {
        return cached;
    }

    const embedding = await generateQueryEmbedding(ai, query);

    if (embedding) {
        await kv.put(cacheKey, JSON.stringify(embedding), { expirationTtl: 86400 });
    }

    return embedding;
}
