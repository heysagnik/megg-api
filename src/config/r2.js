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
    if (!url || !url.includes(R2_PUBLIC_URL)) return;
    const key = url.replace(`${R2_PUBLIC_URL}/`, '');
    await r2.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key
    }));
};

export const getFromR2 = async (key) => {
    const response = await r2.send(new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key
    }));
    return response.Body;
};
