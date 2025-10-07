require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function fixSchema() {
  try {
    console.log('🔧 Fixing database schema...');

    // The tables already have last_updated columns, but let's check the specific API queries
    // Let's check which APIs are failing and see what columns they expect

    // Check current table schemas
    const campaignsSchema = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns'
      ORDER BY ordinal_position
    `;

    console.log('📋 Campaigns table columns:');
    campaignsSchema.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type}`);
    });

    // Update the last_updated column for existing data
    await sql`UPDATE campaigns SET last_updated = NOW() WHERE last_updated IS NULL`;
    await sql`UPDATE step_performance SET last_updated = NOW() WHERE last_updated IS NULL`;
    await sql`UPDATE lead_engagement SET last_updated = NOW() WHERE last_updated IS NULL`;
    await sql`UPDATE replies_detail SET last_updated = NOW() WHERE last_updated IS NULL`;
    await sql`UPDATE all_activities SET last_updated = NOW() WHERE last_updated IS NULL`;
    await sql`UPDATE meeting_bookings SET last_updated = NOW() WHERE last_updated IS NULL`;

    console.log('✅ Schema updated successfully!');

    // Test a simple query
    const testQuery = await sql`SELECT COUNT(*) as count FROM campaigns`;
    console.log(`📊 Test query successful: ${testQuery[0].count} campaigns found`);

  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    console.log('Error details:', error.message);
  }
}

fixSchema();