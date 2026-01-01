import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const createTempFile = async (buffer, extension) => {
    const tempDir = os.tmpdir();
    const fileName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, buffer);
    return filePath;
};

const deleteTempFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (e) {

    }
};


export const compressVideo = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec('libx264')
            .size('?x1080')
            .videoBitrate('1800k')  // Reduced from 2500k for smaller files
            .audioCodec('aac')
            .audioBitrate('128k')   // Reduced from 192k, still good quality
            .outputOptions([
                '-preset slow',      // Better compression than medium
                '-movflags +faststart',
                '-crf 24',           // Slightly higher = smaller files
                '-profile:v high',
                '-level 4.1',
                '-tune film',        // Optimize for film-like content
                '-pix_fmt yuv420p'   // Maximum compatibility
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(new Error(`Compression failed: ${err.message}`)))
            .run();
    });
};


export const generateThumbnail = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .screenshots({
                timestamps: ['00:00:01'], // 1 second in
                filename: path.basename(outputPath),
                folder: path.dirname(outputPath),
                size: '720x?' // Higher resolution thumbnail
            })
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(new Error(`Thumbnail failed: ${err.message}`)));
    });
};

/**
 * Process video: compress and generate thumbnail
 * Returns { videoBuffer, thumbnailBuffer }
 */
export const processVideo = async (inputBuffer) => {
    const inputPath = await createTempFile(inputBuffer, '.mp4');
    const outputVideoPath = inputPath.replace('.mp4', '_compressed.mp4');
    const outputThumbPath = inputPath.replace('.mp4', '_thumb.jpg');

    try {
        // Compress video
        await compressVideo(inputPath, outputVideoPath);

        // Generate thumbnail
        await generateThumbnail(inputPath, outputThumbPath);

        // Read processed files
        const videoBuffer = await fs.readFile(outputVideoPath);
        const thumbnailBuffer = await fs.readFile(outputThumbPath);

        return { videoBuffer, thumbnailBuffer };
    } finally {
        // Cleanup temp files
        await deleteTempFile(inputPath);
        await deleteTempFile(outputVideoPath);
        await deleteTempFile(outputThumbPath);
    }
};

/**
 * Get video metadata
 */
export const getVideoInfo = (inputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, data) => {
            if (err) return reject(err);
            const video = data.streams.find(s => s.codec_type === 'video');
            resolve({
                duration: data.format.duration,
                width: video?.width,
                height: video?.height,
                size: data.format.size
            });
        });
    });
};
