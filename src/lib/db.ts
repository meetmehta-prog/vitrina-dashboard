import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Use DATABASE_URL_UNPOOLED from Neon integration as fallback
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED is not defined');
}

// Configure neon for better compatibility
neonConfig.fetchConnectionCache = true;

const sql = neon(databaseUrl);
export const db = drizzle(sql as any);