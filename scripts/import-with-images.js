#!/usr/bin/env node
import 'dotenv/config';
import { readFile, readdir, stat } from 'fs/promises';
import { resolve, join, extname } from 'path';
import sharp from 'sharp';
import { parse } from 'csv-parse/sync';
import { createProduct } from '../src/services/product.service.js';
import { uploadToR2 } from '../src/config/r2.js';
import Groq from 'groq-sdk';

const DRY_RUN = process.argv.includes('--dry-run');

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Helper: Title Case
const toTitleCase = (str) => {
    return str.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase());
};


function parseConfigFromFilename(filename) {
    const name = filename.replace('.csv', '');
    const match = name.match(/^([^(]+)\s*\(([^)]+)\)$/);

    if (!match) {
        throw new Error(`Invalid filename format: "${filename}". Expected format: "CATEGORY (Subcategory).csv"`);
    }

    const rawCategory = match[1].trim();     // "TSHIRT"
    const rawSubcategory = match[2].trim();  // "Polo"

    return {
        category: toTitleCase(rawCategory), // "Tshirt"
        subcategory: rawSubcategory,        // "Polo"
        imageDir: `./assets/${rawSubcategory.toLowerCase()}` // "./assets/polo"
    };
}

function linkToFolder(link) {
    if (!link) return null;
    return link.replace(/^https?:\/\//, 'https_--').replace(/\//g, '-');
}

// Parse price (handles commas and empty values)
function parsePrice(priceStr) {
    if (!priceStr || priceStr.trim() === '') return 0;
    return parseFloat(priceStr.toString().replace(/,/g, '')) || 0;
}

// Parse fabric to array
function parseFabric(fabricStr) {
    if (!fabricStr) return [];
    if (Array.isArray(fabricStr)) return fabricStr;
    return fabricStr.split(',').map(f => f.trim()).filter(Boolean);
}

// Format description using Groq LLM
async function formatDescription(desc) {
    if (!desc) return '';

    // Clean up basic spacing first
    const rawDesc = desc.trim().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');

    // Skip if very short
    if (rawDesc.length < 10) return rawDesc;

    if (DRY_RUN) console.log(`      🤖 AI Formatting description...`);

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a fashion catalog assistant. Format the following description into a clean, concise bulleted list.
Rules:
- Start each point with "• "
- Bold the attribute name if present (e.g., "• Fabric: Cotton")
- Remove marketing fluff.
- Output ONLY the list.
- Keep it under 6 points.`
                },
                {
                    role: "user",
                    content: rawDesc
                }
            ],
            // Use llama-3.1-8b-instant as requested (low cost)
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            max_tokens: 154,
        });

        const formatted = completion.choices[0]?.message?.content?.trim();
        return formatted || rawDesc;
    } catch (error) {
        // Handle missing key or other errors gracefully
        if (DRY_RUN) console.warn(`      ⚠️ Groq API Error: ${error.message} - Using raw description.`);
        return rawDesc;
    }
}

// Process and upload single high-quality image
async function processAndUploadImage(imagePath, productId, index) {
    try {
        const fileBuffer = await readFile(imagePath);
        const originalSize = fileBuffer.length;

        // Single high-quality optimized image
        // - Resize to max 1600px width (good for detail)
        // - Quality 92 for high quality
        // - Effort 4 for balanced compression
        const optimized = await sharp(fileBuffer)
            .resize(1600, null, { withoutEnlargement: true })
            .webp({
                quality: 92,
                effort: 4
            })
            .toBuffer();

        const compressionRatio = ((1 - optimized.length / originalSize) * 100).toFixed(0);
        console.log(`    📦 ${(originalSize / 1024).toFixed(0)}KB → ${(optimized.length / 1024).toFixed(0)}KB (-${compressionRatio}%)`);

        // Store with product ID folder structure
        const key = `products/${productId}/image_${index}.webp`;

        if (!DRY_RUN) {
            const url = await uploadToR2(key, optimized, 'image/webp');
            return url;
        } else {
            return `[DRY-RUN] ${key}`;
        }
    } catch (error) {
        console.error(`    ❌ Image error: ${error.message}`);
        return null;
    }
}

// Find images in a folder
async function findImagesInFolder(folderPath) {
    try {
        const files = await readdir(folderPath);
        return files
            .filter(f => ['.jpg', '.jpeg', '.png', '.webp'].includes(extname(f).toLowerCase()))
            .sort((a, b) => {
                const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                return numA - numB;
            })
            .map(f => join(folderPath, f));
    } catch {
        return [];
    }
}

// Use the createProduct service (handles semantic_tags, embeddings, search_vector)
async function insertProduct(product) {
    // createProduct expects these fields and auto-generates semantic_tags + embedding
    const productData = {
        name: product.name,
        description: product.description,
        price: product.price,
        brand: product.brand,
        images: JSON.parse(product.images),
        category: product.category,
        subcategory: product.subcategory,
        color: product.color,
        fabric: JSON.parse(product.fabric),
        affiliate_link: product.affiliate_link
    };

    const result = await createProduct(productData);
    return { id: result.id, name: result.name };
}

// Process a single CSV file
async function processCSV(csvFile) {
    // Generate config from filename
    let config;
    try {
        config = parseConfigFromFilename(csvFile);
    } catch (e) {
        console.error(`❌ Error parsing filename "${csvFile}": ${e.message}`);
        return { success: 0, failed: 1, skipped: 0 };
    }

    console.log(`\n📂 Processing: ${csvFile}`);
    console.log(`   Category: ${config.category} | Subcategory: ${config.subcategory}`);
    console.log(`   Images: ${config.imageDir}`);

    const csvPath = resolve('./data', csvFile);
    let content;
    try {
        content = await readFile(csvPath, 'utf-8');
    } catch (e) {
        console.error(`   ❌ Could not read file: ${csvPath}`);
        return { success: 0, failed: 1, skipped: 0 };
    }

    // Parse CSV
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true
    });

    console.log(`   Found ${records.length} records`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const record of records) {
        const name = record.name?.trim();
        const brand = record.brand?.trim();
        const affiliateLink = record.affiliate_link?.trim();

        if (!name || !brand) {
            console.log(`   ⏭️ Skipping: Missing name or brand`);
            skipped++;
            continue;
        }

        // Find image folder
        const folderName = linkToFolder(affiliateLink);
        const imageFolderPath = folderName ? resolve(config.imageDir, folderName) : null;

        let imageFiles = [];
        if (imageFolderPath) {
            try {
                await stat(imageFolderPath);
                imageFiles = await findImagesInFolder(imageFolderPath);
            } catch {
                // Folder doesn't exist
            }
        }

        if (imageFiles.length === 0) {
            console.log(`   ⏭️ Skipping "${name.substring(0, 30)}...": No images found`);
            skipped++;
            continue;
        }

        console.log(`\n   📦 ${name.substring(0, 50)}...`);
        console.log(`      Images: ${imageFiles.length} found`);

        // Generate temporary product ID for image upload
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Process and upload images
        const uploadedImages = [];
        for (let i = 0; i < imageFiles.length && i < 5; i++) {
            const imageUrl = await processAndUploadImage(imageFiles[i], tempId, i);
            if (imageUrl) uploadedImages.push(imageUrl);
        }

        if (uploadedImages.length === 0) {
            console.log(`      ❌ Failed: No images uploaded`);
            failed++;
            continue;
        }

        // Prepare product data (Format description asynchronously)
        const formattedDesc = await formatDescription(record.description || '');

        const product = {
            name,
            description: formattedDesc,
            price: parsePrice(record.price),
            brand,
            images: JSON.stringify(uploadedImages),
            category: config.category,
            subcategory: config.subcategory,
            color: record.color?.trim()?.toLowerCase() || 'unknown',
            fabric: JSON.stringify(parseFabric(record.fabric)),
            affiliate_link: affiliateLink
        };

        if (DRY_RUN) {
            console.log(`      ✅ [DRY-RUN] Would insert: ${name.substring(0, 40)}...`);
            console.log(`         Description: ${product.description.replace(/\n/g, '\n                      ')}`);
            success++;
        } else {
            try {
                const result = await insertProduct(product);
                console.log(`      ✅ Inserted: ${result.id}`);
                success++;
            } catch (error) {
                console.log(`      ❌ DB Error: ${error.message}`);
                failed++;
            }
        }
    }

    return { success, failed, skipped };
}

// Main
async function main() {
    console.log('🚀 Bulk Import with Images (Dynamic + Groq AI)');
    console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
    console.log('');

    const args = process.argv.slice(2).filter(a => !a.startsWith('--'));

    if (args.length === 0) {
        console.log('Usage: node scripts/import-with-images.js [csv-file] [--dry-run]');
        console.log('Example: node scripts/import-with-images.js "TSHIRT (Polo).csv"');
        process.exit(1);
    }

    const totals = { success: 0, failed: 0, skipped: 0 };

    for (const csvFile of args) {
        const result = await processCSV(csvFile);
        totals.success += result.success;
        totals.failed += result.failed;
        totals.skipped += result.skipped;
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Import Complete!');
    console.log(`   ✅ Success: ${totals.success}`);
    console.log(`   ❌ Failed: ${totals.failed}`);
    console.log(`   ⏭️ Skipped: ${totals.skipped}`);

    process.exit(totals.failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
