import dotenv from 'dotenv';
dotenv.config();

import { betterAuth } from "better-auth";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

export const auth = betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    trustedOrigins: [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://megg-admin.vercel.app",
        process.env.FRONTEND_URL
    ].filter(Boolean),

    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24,
        cookieCache: { enabled: true, maxAge: 5 * 60 }
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            scope: ["openid", "email", "profile"],
            autoLinkAccounts: true,
        }
    },

    user: {
        additionalFields: {
            phoneNumber: { type: "string", required: false },
            role: { type: "string", required: false, defaultValue: "user" },
            preferences: { type: "string", defaultValue: "{}" }
        },
        modelName: "user",
    },

    advanced: {
        cookies: {
            session_token: {
                name: "better-auth.session_token",
                attributes: {
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === 'production',
                    httpOnly: true,
                    path: "/",
                }
            },
            state: {
                name: "better-auth.state",
                attributes: {
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === 'production',
                    httpOnly: true,
                    path: "/",
                    maxAge: 600,
                }
            },
        },
        useSecureCookies: process.env.NODE_ENV === 'production',
    },

    rateLimit: {
        window: 60,
        max: 100,
        storage: "memory",
    },

    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
        },
        storeStateInDatabase: true,
    },
});
