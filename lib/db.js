import { neon } from '@neon-db/serverless';

let sql;

export function getDb() {
  if (!sql) {
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error('NEON_DATABASE_URL is not set');
    }
    sql = neon(process.env.NEON_DATABASE_URL);
  }
  return sql;
}

export async function query(text, params = []) {
  const sql = getDb();
  try {
    const result = await sql(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}