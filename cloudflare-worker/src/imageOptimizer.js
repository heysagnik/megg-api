import { PhotonImage, resize, SamplingFilter } from '@cf-wasm/photon';

const MAX_WIDTH = 1200;
const CACHE_TTL = 86400 * 30;
const SUPPORTED_FORMATS = new Set(['webp', 'jpeg', 'png']);

function parseParams(url) {
    const params = url.searchParams;
    return {
        imageUrl: params.get('url'),
        width: Math.min(parseInt(params.get('w') || '800', 10), MAX_WIDTH),
        quality: Math.min(parseInt(params.get('q') || '80', 10), 95),
        format: SUPPORTED_FORMATS.has(params.get('f')) ? params.get('f') : 'webp'
    };
}

function generateCacheKey(imageUrl, width, quality, format) {
    return `img:${btoa(imageUrl).slice(0, 100)}:${width}:${quality}:${format}`;
}

function createImageResponse(data, format, cacheHit) {
    return new Response(data, {
        headers: {
            'Content-Type': `image/${format}`,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Cache': cacheHit ? 'HIT' : 'MISS'
        }
    });
}

async function processImage(imageBuffer, width, quality, format) {
    const inputBytes = new Uint8Array(imageBuffer);
    const image = PhotonImage.new_from_byteslice(inputBytes);

    const currentWidth = image.get_width();
    const currentHeight = image.get_height();

    if (width < currentWidth) {
        const aspectRatio = currentHeight / currentWidth;
        const newHeight = Math.round(width * aspectRatio);
        resize(image, width, newHeight, SamplingFilter.Lanczos3);
    }

    let outputBytes;
    switch (format) {
        case 'jpeg':
            outputBytes = image.get_bytes_jpeg(quality);
            break;
        case 'png':
            outputBytes = image.get_bytes();
            break;
        default:
            outputBytes = image.get_bytes_webp(quality);
    }

    image.free();
    return outputBytes;
}

export async function handleImageOptimization(request, env) {
    const url = new URL(request.url);
    const { imageUrl, width, quality, format } = parseParams(url);

    if (!imageUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const cacheKey = generateCacheKey(imageUrl, width, quality, format);

    try {
        const cached = await env.CACHE.get(cacheKey, 'arrayBuffer');
        if (cached) {
            return createImageResponse(cached, format, true);
        }
    } catch { }

    try {
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) {
            return new Response(JSON.stringify({ error: 'Image not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const imageBuffer = await imageRes.arrayBuffer();
        const outputBytes = await processImage(imageBuffer, width, quality, format);

        env.CACHE.put(cacheKey, outputBytes.buffer, { expirationTtl: CACHE_TTL }).catch(() => { });

        return createImageResponse(outputBytes, format, false);
    } catch (error) {
        console.error('Image optimization failed:', error.message);
        return fetch(imageUrl);
    }
}
