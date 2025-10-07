require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function createTables() {
  try {
    console.log('🗄️  Creating database tables...');

    // Create campaigns table
    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        account_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL UNIQUE,
        campaign_name TEXT NOT NULL,
        status TEXT,
        is_archived BOOLEAN DEFAULT false,
        created_date TIMESTAMP,
        total_leads INTEGER DEFAULT 0,
        active_leads INTEGER DEFAULT 0,
        completed_leads INTEGER DEFAULT 0,
        total_emails_sent INTEGER DEFAULT 0,
        unique_leads_emailed INTEGER DEFAULT 0,
        emails_delivered INTEGER DEFAULT 0,
        email_opens INTEGER DEFAULT 0,
        email_open_rate DECIMAL(5,2) DEFAULT 0,
        email_clicks INTEGER DEFAULT 0,
        email_ctr DECIMAL(5,2) DEFAULT 0,
        email_replies INTEGER DEFAULT 0,
        email_reply_rate DECIMAL(5,2) DEFAULT 0,
        email_bounces INTEGER DEFAULT 0,
        email_bounce_rate DECIMAL(5,2) DEFAULT 0,
        email_fails INTEGER DEFAULT 0,
        unsubscribes INTEGER DEFAULT 0,
        meetings_booked INTEGER DEFAULT 0,
        interested INTEGER DEFAULT 0,
        not_interested INTEGER DEFAULT 0,
        team_id TEXT,
        sender_name TEXT,
        sender_email TEXT,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create step_performance table
    await sql`
      CREATE TABLE IF NOT EXISTS step_performance (
        id SERIAL PRIMARY KEY,
        account_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        step_type TEXT DEFAULT 'Email',
        unique_leads_sent INTEGER DEFAULT 0,
        opens INTEGER DEFAULT 0,
        open_rate DECIMAL(5,2) DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        ctr DECIMAL(5,2) DEFAULT 0,
        replies INTEGER DEFAULT 0,
        reply_rate DECIMAL(5,2) DEFAULT 0,
        bounces INTEGER DEFAULT 0,
        fails INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create lead_engagement table
    await sql`
      CREATE TABLE IF NOT EXISTS lead_engagement (
        id SERIAL PRIMARY KEY,
        account_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        lead_email TEXT NOT NULL,
        lead_name TEXT,
        company_name TEXT,
        phone TEXT,
        status TEXT DEFAULT 'active',
        added_date TIMESTAMP,
        last_activity_date TIMESTAMP,
        last_activity_type TEXT,
        emails_sent INTEGER DEFAULT 0,
        opens INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        replies INTEGER DEFAULT 0,
        bounces INTEGER DEFAULT 0,
        total_activities INTEGER DEFAULT 0,
        is_interested BOOLEAN DEFAULT false,
        is_replied BOOLEAN DEFAULT false,
        is_bounced BOOLEAN DEFAULT false,
        is_unsubscribed BOOLEAN DEFAULT false,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create replies_detail table
    await sql`
      CREATE TABLE IF NOT EXISTS replies_detail (
        id SERIAL PRIMARY KEY,
        account_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        reply_date TIMESTAMP,
        reply_type TEXT,
        lead_email TEXT NOT NULL,
        lead_name TEXT,
        company_name TEXT,
        phone TEXT,
        step_number INTEGER,
        sender_name TEXT,
        reply_content TEXT,
        is_bot BOOLEAN DEFAULT false,
        is_first_reply BOOLEAN DEFAULT false,
        original_message_date TIMESTAMP,
        response_time DECIMAL(8,2),
        reply_id TEXT,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create all_activities table
    await sql`
      CREATE TABLE IF NOT EXISTS all_activities (
        id SERIAL PRIMARY KEY,
        activity_id TEXT UNIQUE,
        account_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        activity_date TIMESTAMP,
        lead_email TEXT,
        lead_name TEXT,
        company_name TEXT,
        step_number INTEGER,
        sender_name TEXT,
        is_first BOOLEAN DEFAULT false,
        stopped_sequence BOOLEAN DEFAULT false,
        is_bot BOOLEAN DEFAULT false,
        error_message TEXT,
        additional_data TEXT,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create meeting_bookings table
    await sql`
      CREATE TABLE IF NOT EXISTS meeting_bookings (
        id SERIAL PRIMARY KEY,
        account_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        lead_email TEXT NOT NULL,
        lead_name TEXT,
        company_name TEXT,
        meeting_type TEXT,
        meeting_date TIMESTAMP,
        booking_date TIMESTAMP,
        step_number INTEGER,
        days_to_book INTEGER,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create allowed_users table
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

    // Create data_sync_log table
    await sql`
      CREATE TABLE IF NOT EXISTS data_sync_log (
        id SERIAL PRIMARY KEY,
        sync_type TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        status TEXT NOT NULL,
        records_processed INTEGER DEFAULT 0,
        error_message TEXT,
        metadata JSONB
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS campaign_id_idx ON campaigns(campaign_id)`;
    await sql`CREATE INDEX IF NOT EXISTS account_id_idx ON campaigns(account_id)`;
    await sql`CREATE INDEX IF NOT EXISTS step_campaign_id_idx ON step_performance(campaign_id)`;
    await sql`CREATE INDEX IF NOT EXISTS step_number_idx ON step_performance(step_number)`;
    await sql`CREATE INDEX IF NOT EXISTS lead_campaign_id_idx ON lead_engagement(campaign_id)`;
    await sql`CREATE INDEX IF NOT EXISTS lead_email_idx ON lead_engagement(lead_email)`;
    await sql`CREATE INDEX IF NOT EXISTS lead_status_idx ON lead_engagement(status)`;
    await sql`CREATE INDEX IF NOT EXISTS reply_campaign_id_idx ON replies_detail(campaign_id)`;
    await sql`CREATE INDEX IF NOT EXISTS reply_lead_email_idx ON replies_detail(lead_email)`;
    await sql`CREATE INDEX IF NOT EXISTS reply_date_idx ON replies_detail(reply_date)`;
    await sql`CREATE INDEX IF NOT EXISTS activity_id_idx ON all_activities(activity_id)`;
    await sql`CREATE INDEX IF NOT EXISTS activity_campaign_id_idx ON all_activities(campaign_id)`;
    await sql`CREATE INDEX IF NOT EXISTS activity_type_idx ON all_activities(activity_type)`;
    await sql`CREATE INDEX IF NOT EXISTS activity_date_idx ON all_activities(activity_date)`;
    await sql`CREATE INDEX IF NOT EXISTS meeting_campaign_id_idx ON meeting_bookings(campaign_id)`;
    await sql`CREATE INDEX IF NOT EXISTS meeting_lead_email_idx ON meeting_bookings(lead_email)`;
    await sql`CREATE INDEX IF NOT EXISTS booking_date_idx ON meeting_bookings(booking_date)`;
    await sql`CREATE INDEX IF NOT EXISTS allowed_users_email_idx ON allowed_users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS sync_type_idx ON data_sync_log(sync_type)`;
    await sql`CREATE INDEX IF NOT EXISTS sync_status_idx ON data_sync_log(status)`;
    await sql`CREATE INDEX IF NOT EXISTS sync_start_time_idx ON data_sync_log(start_time)`;

    console.log('✅ Database tables created successfully!');

    // Add first user if none exist
    const existingUsers = await sql`SELECT COUNT(*) as count FROM allowed_users`;
    if (existingUsers[0].count === '0') {
      console.log('📝 Adding default users...');
      await sql`
        INSERT INTO allowed_users (email, name, is_active) 
        VALUES 
        ('meetmehta@whirlwind.co.in', 'Meet Mehta', true),
        ('mehtameet005@gmail.com', 'Meet Mehta Personal', true)
      `;
      console.log('✅ Default users added!');
    }

    console.log('🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();