require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function seedUsers() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
    
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not found in environment variables');
      process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Create the allowed_users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS allowed_users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      )
    `;
    
    console.log('✅ Table created/verified');

    // Insert test users
    const testUsers = [
      { email: 'admin@vitrina.com', name: 'Admin User' },
      { email: 'test@example.com', name: 'Test User' },
      { email: 'demo@vitrina.com', name: 'Demo User' }
    ];

    for (const user of testUsers) {
      try {
        await sql`
          INSERT INTO allowed_users (email, name, is_active)
          VALUES (${user.email}, ${user.name}, true)
          ON CONFLICT (email) DO NOTHING
        `;
        console.log(`✅ Added user: ${user.email}`);
      } catch (error) {
        console.log(`ℹ️  User ${user.email} already exists or error: ${error.message}`);
      }
    }

    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();