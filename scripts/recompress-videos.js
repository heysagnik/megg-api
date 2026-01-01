/**
 * Script to recompress all videos in R2/megg-media/reels folder
 * Run with: node scripts/recompress-videos.js
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { compressVideo } from '../src/utils/videoProcessor.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import 'dotenv/config';

const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY
    }
});

const BUCKET = process.env.R2_BUCKET || 'megg-media';
const REELS_PREFIX = 'reels/';

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

async function listAllVideos() {
    const videos = [];
    let continuationToken;

    do {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: REELS_PREFIX,
            ContinuationToken: continuationToken
        });

        const response = await r2.send(command);
        const videoFiles = (response.Contents || []).filter(obj =>
            obj.Key.endsWith('.mp4') && obj.Key.includes('_video')
        );
        videos.push(...videoFiles);
        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return videos;
}

async function downloadVideo(key) {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const response = await r2.send(command);
    return streamToBuffer(response.Body);
}

async function uploadVideo(key, buffer) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'video/mp4'
    });
    await r2.send(command);
}

async function recompressVideo(videoBuffer, key) {
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);

    try {
        await fs.writeFile(inputPath, videoBuffer);
        await compressVideo(inputPath, outputPath);
        const compressedBuffer = await fs.readFile(outputPath);
        return compressedBuffer;
    } finally {
        await fs.unlink(inputPath).catch(() => { });
        await fs.unlink(outputPath).catch(() => { });
    }
}

async function main() {
    console.log('🎬 Starting video recompression...\n');

    const videos = await listAllVideos();
    console.log(`Found ${videos.length} videos to recompress\n`);

    if (videos.length === 0) {
        console.log('No videos found in reels folder.');
        return;
    }

    let success = 0, failed = 0, skipped = 0;

    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const originalSize = video.Size;

        console.log(`[${i + 1}/${videos.length}] Processing: ${video.Key}`);
        console.log(`  Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

        try {
            // Download
            console.log('  ⬇️  Downloading...');
            const videoBuffer = await downloadVideo(video.Key);

            // Recompress
            console.log('  🔧 Compressing...');
            const compressedBuffer = await recompressVideo(videoBuffer, video.Key);

            const newSize = compressedBuffer.length;
            const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

            // Skip if new file is larger (already optimized)
            if (newSize >= originalSize) {
                console.log(`  ⏭️  Skipped (already optimized or larger)\n`);
                skipped++;
                continue;
            }

            // Upload
            console.log('  ⬆️  Uploading...');
            await uploadVideo(video.Key, compressedBuffer);

            console.log(`  ✅ Done! New size: ${(newSize / 1024 / 1024).toFixed(2)} MB (${savings}% smaller)\n`);
            success++;

        } catch (error) {
            console.log(`  ❌ Failed: ${error.message}\n`);
            failed++;
        }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Success: ${success}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);
}

main().catch(console.error);
