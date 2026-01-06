#!/usr/bin/env node
import 'dotenv/config';
import { pool } from '../src/config/neon.js';

const DUPLICATE_COUNT = 61; // Number of duplicate products to delete

async function main() {
    console.log(`🗑️  Deleting the last ${DUPLICATE_COUNT} imported products...\n`);

    try {
        // First, let's see what we're about to delete
        const previewResult = await pool.query(`
            SELECT id, name, brand, created_at 
            FROM products 
            ORDER BY created_at DESC 
            LIMIT $1
        `, [DUPLICATE_COUNT]);

        console.log(`📋 Products to be deleted (most recent ${DUPLICATE_COUNT}):`);
        previewResult.rows.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.name} (${p.brand}) - ${p.created_at}`);
        });

        console.log(`\n⚠️  Are you sure you want to delete these ${DUPLICATE_COUNT} products?`);
        console.log(`   Run with --confirm to execute the deletion.\n`);

        if (process.argv.includes('--confirm')) {
            // Delete the most recent N products
            const deleteResult = await pool.query(`
                DELETE FROM products 
                WHERE id IN (
                    SELECT id FROM products 
                    ORDER BY created_at DESC 
                    LIMIT $1
                )
                RETURNING id, name
            `, [DUPLICATE_COUNT]);

            console.log(`\n✅ Successfully deleted ${deleteResult.rowCount} products!`);
        } else {
            console.log(`💡 Tip: Run "node scripts/delete-duplicates.js --confirm" to execute.`);
        }

    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    }

    process.exit(0);
}

main();
