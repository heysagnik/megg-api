import dotenv from 'dotenv';
dotenv.config();

import { Pool } from '@neondatabase/serverless';

// Singleton pool instance
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const sql = async (text, params) => {
    try {
        const result = await pool.query(text, params);
        return result.rows;
    } catch (error) {
        throw new Error(`Database error: ${error.message}`);
    }
};

// Also export pool if needed for transactions later
export { pool };

// Provide a 'query' alias if used elsewhere
export const query = (text, params) => sql(text, params);
