require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function addUsers() {
  try {
    console.log('👥 Adding users to the dashboard...');

    // Add the users that were denied access
    await sql`
      INSERT INTO allowed_users (email, name, is_active) 
      VALUES 
      ('meetmehta@whirlwind.co.in', 'Meet Mehta', true),
      ('mehtameet005@gmail.com', 'Meet Mehta Personal', true)
      ON CONFLICT (email) DO UPDATE SET 
        is_active = true,
        name = EXCLUDED.name
    `;

    console.log('✅ Users added successfully!');
    
    // Show current users
    const users = await sql`SELECT email, name, is_active, created_at FROM allowed_users ORDER BY created_at`;
    console.log('\n📋 Current users with access:');
    users.forEach(user => {
      console.log(`  • ${user.email} (${user.name || 'No name'}) - ${user.is_active ? '✅ Active' : '❌ Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Error adding users:', error);
    process.exit(1);
  }
}

addUsers();