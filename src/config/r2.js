import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY
    }
});

export const R2_BUCKET = process.env.R2_BUCKET || 'megg-media';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

export const uploadToR2 = async (key, body, contentType) => {
    await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType
    }));
    return `${R2_PUBLIC_URL}/${key}`;
};

export const deleteFromR2 = async (url) => {
    if (!url) return;

    let key;
    if (typeof url === 'string') {
        const cleanUrl = url.split('?')[0];

        if (R2_PUBLIC_URL && cleanUrl.includes(R2_PUBLIC_URL)) {
            key = cleanUrl.replace(`${R2_PUBLIC_URL}/`, '');
        } else if (cleanUrl.startsWith('http')) {
            try {
                const urlObj = new URL(cleanUrl);
                key = urlObj.pathname.replace(/^\//, '');
            } catch {
                console.error('Invalid URL for deletion:', url);
                return;
            }
        } else {
            key = cleanUrl;
        }
    } else {
        console.error('deleteFromR2 received non-string:', typeof url);
        return;
    }

    if (!key) {
        console.error('Could not extract key from URL:', url);
        return;
    }

    console.log(`Deleting from R2: key=${key}`);

    try {
        await r2.send(new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: key
        }));
        console.log(`Successfully deleted from R2: ${key}`);
    } catch (error) {
        console.error(`Failed to delete from R2: ${key}`, error.message);
        throw error;
    }
};

export const getFromR2 = async (key) => {
    const response = await r2.send(new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key
    }));
    return response.Body;
};
