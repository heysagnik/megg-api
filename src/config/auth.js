import dotenv from 'dotenv';
dotenv.config();

import { betterAuth } from "better-auth";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
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

    // Trusted origins for CORS
    trustedOrigins: [
        "http://localhost:5173",
        "http://localhost:3000",
        process.env.FRONTEND_URL
    ].filter(Boolean),

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60
        }
    },

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        sendResetPassword: async ({ user, url }) => {
            // TODO: Implement password reset email
            console.log(`Password reset for ${user.email}: ${url}`);
        },
    },

    // Social providers
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Scopes for user info
            scope: ["openid", "email", "profile"],
            // Enable account linking
            autoLinkAccounts: true,
        }
    },

    // User table configuration
    user: {
        // Additional fields you want to store
        additionalFields: {
            phoneNumber: {
                type: "string",
                required: false,
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "user"
            },
            preferences: {
                type: "string",
                defaultValue: "{}"
            }
        },
        modelName: "user",
    },

    advanced: {
        generateId: undefined,
        crossSubDomainCookies: {
            enabled: false,
        },
        useSecureCookies: process.env.NODE_ENV === 'production',
    },
    rateLimit: {
        window: 60,     // 60 seconds
        max: 100, // 100 requests per window
        storage: "memory", // Use "database" for distributed systems
    },

    // Account linking
    account: {
        accountLinking: {
            enabled: true,
            // Allow linking accounts with same email
            trustedProviders: ["google"],
        }
    },
});

