import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Configure neon for better compatibility
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql as any);