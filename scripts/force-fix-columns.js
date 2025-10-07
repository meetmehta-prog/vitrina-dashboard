require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function forceFixColumns() {
  try {
    console.log('🔧 Force fixing all database columns...');

    // Check current column structure
    const tables = ['campaigns', 'step_performance', 'lead_engagement', 'replies_detail', 'all_activities', 'meeting_bookings'];
    
    for (const table of tables) {
      console.log(`Checking table: ${table}`);
      try {
        const columns = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ${table}
          ORDER BY ordinal_position
        `;
        
        const columnNames = columns.map(c => c.column_name);
        console.log(`  Columns: ${columnNames.join(', ')}`);
        
        if (!columnNames.includes('last_updated')) {
          console.log(`  Adding last_updated to ${table}...`);
          await sql`ALTER TABLE ${sql(table)} ADD COLUMN last_updated TIMESTAMP DEFAULT NOW()`;
          console.log(`  ✅ Added last_updated to ${table}`);
        } else {
          console.log(`  ✅ last_updated already exists in ${table}`);
        }
      } catch (error) {
        console.log(`  ❌ Error with ${table}:`, error.message);
      }
    }

    // Test queries that were failing
    console.log('\n🧪 Testing dashboard queries...');
    
    try {
      const campaignTest = await sql`SELECT COUNT(*) as count FROM campaigns`;
      console.log(`✅ Campaigns query works: ${campaignTest[0].count} records`);
    } catch (error) {
      console.log(`❌ Campaigns query failed:`, error.message);
    }
    
    try {
      const stepTest = await sql`SELECT COUNT(*) as count FROM step_performance`;
      console.log(`✅ Step performance query works: ${stepTest[0].count} records`);
    } catch (error) {
      console.log(`❌ Step performance query failed:`, error.message);
    }

    console.log('\n🎯 Database should now be ready for the dashboard!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forceFixColumns();