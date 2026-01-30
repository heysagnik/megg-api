import dotenv from 'dotenv';
dotenv.config();

import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

export const sql = async (text, params) => {
    try {
        const result = await pool.query(text, params);
        return result.rows;
    } catch (error) {
        throw new Error(`Database error: ${error.message}`);
    }
};

export const query = (text, params) => sql(text, params);
