#!/usr/bin/env node
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { createProduct } from '../src/services/product.service.js';

const BATCH_SIZE = 5;
const DELAY_MS = 500;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const requiredFields = ['name', 'price', 'brand', 'category'];

function validateProduct(product, index) {
    const missing = requiredFields.filter(f => product[f] === undefined || product[f] === null || product[f] === '');
    if (missing.length > 0) {
        throw new Error(`Product at index ${index} missing required fields: ${missing.join(', ')}`);
    }
    return true;
}

function normalizeProduct(product) {
    const normalized = { ...product };
    if (Array.isArray(normalized.fabric)) {
        normalized.fabric = JSON.stringify(normalized.fabric);
    }
    if (Array.isArray(normalized.semantic_tags)) {
        delete normalized.semantic_tags;
    }
    return normalized;
}

async function main() {
    const args = process.argv.slice(2);
    const fileIndex = args.indexOf('--file');

    if (fileIndex === -1 || !args[fileIndex + 1]) {
        console.error('Usage: node scripts/bulk-import.js --file <path-to-json>');
        console.error('Example: node scripts/bulk-import.js --file ./products.json');
        process.exit(1);
    }

    const filePath = resolve(args[fileIndex + 1]);
    console.log(`📂 Reading products from: ${filePath}`);

    let products;
    try {
        const content = await readFile(filePath, 'utf-8');
        products = JSON.parse(content);
        if (!Array.isArray(products)) {
            throw new Error('JSON must be an array of products');
        }
    } catch (err) {
        console.error(`❌ Failed to read/parse file: ${err.message}`);
        process.exit(1);
    }

    console.log(`📦 Found ${products.length} products to import`);
    console.log(`🔧 Using createProduct service (embeddings + semantic_tags enabled)\n`);

    products.forEach((p, i) => validateProduct(p, i));

    let success = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);

        for (const product of batch) {
            const productIndex = products.indexOf(product);
            try {
                const normalized = normalizeProduct(product);
                const result = await createProduct(normalized);
                success++;
                console.log(`✅ [${success}/${products.length}] ${result.name}`);
            } catch (err) {
                failed++;
                errors.push({ index: productIndex, name: product.name, error: err.message });
                console.log(`❌ [${productIndex}] ${product.name}: ${err.message}`);
            }
        }

        if (i + BATCH_SIZE < products.length) {
            await sleep(DELAY_MS);
        }
    }

    console.log(`\n📊 Import Complete!`);
    console.log(`   ✅ Success: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   🧠 Embeddings: Generated async (check DB in ~30s)`);

    if (errors.length > 0) {
        console.log(`\n⚠️ Errors:`);
        errors.slice(0, 10).forEach(e => console.log(`   [${e.index}] ${e.name}: ${e.error}`));
        if (errors.length > 10) console.log(`   ... and ${errors.length - 10} more`);
    }

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
