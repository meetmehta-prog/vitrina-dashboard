require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function fixColumns() {
  try {
    console.log('🔧 Adding missing last_updated columns...');

    // Add last_updated columns to all tables that need them
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()`;
    await sql`ALTER TABLE step_performance ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()`;
    await sql`ALTER TABLE lead_engagement ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()`;
    await sql`ALTER TABLE replies_detail ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()`;
    await sql`ALTER TABLE all_activities ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()`;
    await sql`ALTER TABLE meeting_bookings ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()`;

    console.log('✅ Columns added successfully!');

    // Update the new columns with current timestamp
    await sql`UPDATE campaigns SET last_updated = NOW() WHERE last_updated IS NULL`;
    await sql`UPDATE step_performance SET last_updated = NOW() WHERE last_updated IS NULL`;
    await sql`UPDATE lead_engagement SET last_updated = NOW() WHERE last_updated IS NULL`;
    await sql`UPDATE replies_detail SET last_updated = NOW() WHERE last_updated IS NULL`;
    await sql`UPDATE all_activities SET last_updated = NOW() WHERE last_updated IS NULL`;
    await sql`UPDATE meeting_bookings SET last_updated = NOW() WHERE last_updated IS NULL`;

    console.log('✅ Column data updated successfully!');

    // Test queries
    const campaignCount = await sql`SELECT COUNT(*) as count FROM campaigns`;
    const stepCount = await sql`SELECT COUNT(*) as count FROM step_performance`;
    
    console.log(`📊 Found ${campaignCount[0].count} campaigns and ${stepCount[0].count} steps`);

  } catch (error) {
    console.error('❌ Error fixing columns:', error);
  }
}

fixColumns();