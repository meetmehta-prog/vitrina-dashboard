require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function addSampleData() {
  try {
    console.log('📊 Adding sample data to the dashboard...');

    // Add sample campaigns
    await sql`
      INSERT INTO campaigns (
        account_id, campaign_id, campaign_name, status, created_date,
        total_leads, total_emails_sent, unique_leads_emailed, email_opens, email_open_rate,
        email_clicks, email_ctr, email_replies, email_reply_rate, meetings_booked
      ) VALUES 
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 'active', NOW() - INTERVAL '30 days',
       250, 1200, 250, 480, 40.00, 96, 8.00, 24, 2.00, 8),
      ('acc1', 'camp2', 'Holiday Sales Outreach', 'completed', NOW() - INTERVAL '45 days',
       180, 900, 180, 270, 30.00, 54, 6.00, 18, 2.00, 5),
      ('acc1', 'camp3', 'Enterprise Pilot Program', 'active', NOW() - INTERVAL '15 days',
       75, 300, 75, 135, 45.00, 27, 9.00, 9, 3.00, 4)
      ON CONFLICT (campaign_id) DO NOTHING
    `;

    // Add sample step performance
    await sql`
      INSERT INTO step_performance (
        account_id, campaign_id, campaign_name, step_number, step_type,
        unique_leads_sent, opens, open_rate, clicks, ctr, replies, reply_rate
      ) VALUES 
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 1, 'Email', 250, 200, 80.00, 40, 20.00, 15, 7.50),
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 2, 'Email', 235, 150, 63.83, 30, 20.00, 6, 4.00),
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 3, 'Email', 229, 130, 56.77, 26, 20.00, 3, 2.31),
      ('acc1', 'camp2', 'Holiday Sales Outreach', 1, 'Email', 180, 135, 75.00, 27, 20.00, 12, 8.89),
      ('acc1', 'camp2', 'Holiday Sales Outreach', 2, 'Email', 168, 105, 62.50, 21, 20.00, 4, 3.81),
      ('acc1', 'camp2', 'Holiday Sales Outreach', 3, 'Email', 164, 90, 54.88, 18, 20.00, 2, 2.22),
      ('acc1', 'camp3', 'Enterprise Pilot Program', 1, 'Email', 75, 68, 90.67, 14, 20.59, 6, 8.82),
      ('acc1', 'camp3', 'Enterprise Pilot Program', 2, 'Email', 69, 45, 65.22, 9, 20.00, 2, 4.44),
      ('acc1', 'camp3', 'Enterprise Pilot Program', 3, 'Email', 67, 22, 32.84, 4, 18.18, 1, 4.55)
      ON CONFLICT DO NOTHING
    `;

    // Add sample lead engagement
    await sql`
      INSERT INTO lead_engagement (
        account_id, campaign_id, campaign_name, lead_email, lead_name, company_name,
        status, added_date, last_activity_date, emails_sent, opens, clicks, replies
      ) VALUES 
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 'john.doe@techcorp.com', 'John Doe', 'TechCorp Inc.', 'replied', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days', 3, 5, 2, 1),
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 'sarah.smith@innovate.io', 'Sarah Smith', 'Innovate Solutions', 'active', NOW() - INTERVAL '28 days', NOW() - INTERVAL '3 days', 2, 3, 1, 0),
      ('acc1', 'camp2', 'Holiday Sales Outreach', 'mike.johnson@startup.co', 'Mike Johnson', 'Startup Co.', 'completed', NOW() - INTERVAL '45 days', NOW() - INTERVAL '10 days', 3, 4, 2, 1),
      ('acc1', 'camp3', 'Enterprise Pilot Program', 'lisa.chen@enterprise.com', 'Lisa Chen', 'Enterprise Corp', 'replied', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days', 2, 4, 1, 2)
      ON CONFLICT DO NOTHING
    `;

    // Add sample replies
    await sql`
      INSERT INTO replies_detail (
        account_id, campaign_id, campaign_name, reply_date, lead_email, lead_name, 
        company_name, step_number, reply_content, is_first_reply, response_time
      ) VALUES 
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', NOW() - INTERVAL '5 days', 'john.doe@techcorp.com', 'John Doe', 'TechCorp Inc.', 2, 'Thanks for reaching out! I am interested in learning more about your product.', true, 24.5),
      ('acc1', 'camp2', 'Holiday Sales Outreach', NOW() - INTERVAL '10 days', 'mike.johnson@startup.co', 'Mike Johnson', 'Startup Co.', 1, 'This looks great for our team. Can we schedule a demo?', true, 12.3),
      ('acc1', 'camp3', 'Enterprise Pilot Program', NOW() - INTERVAL '3 days', 'lisa.chen@enterprise.com', 'Lisa Chen', 'Enterprise Corp', 1, 'We would like to participate in the pilot program.', true, 6.8),
      ('acc1', 'camp3', 'Enterprise Pilot Program', NOW() - INTERVAL '2 days', 'lisa.chen@enterprise.com', 'Lisa Chen', 'Enterprise Corp', 2, 'When can we start the implementation?', false, 18.2)
      ON CONFLICT DO NOTHING
    `;

    // Add sample activities
    await sql`
      INSERT INTO all_activities (
        account_id, campaign_id, campaign_name, activity_type, activity_date, 
        lead_email, lead_name, company_name, step_number
      ) VALUES 
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 'sent', NOW() - INTERVAL '5 days', 'john.doe@techcorp.com', 'John Doe', 'TechCorp Inc.', 2),
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 'opened', NOW() - INTERVAL '4 days', 'john.doe@techcorp.com', 'John Doe', 'TechCorp Inc.', 2),
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 'clicked', NOW() - INTERVAL '4 days', 'john.doe@techcorp.com', 'John Doe', 'TechCorp Inc.', 2),
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 'replied', NOW() - INTERVAL '3 days', 'john.doe@techcorp.com', 'John Doe', 'TechCorp Inc.', 2),
      ('acc1', 'camp2', 'Holiday Sales Outreach', 'sent', NOW() - INTERVAL '10 days', 'mike.johnson@startup.co', 'Mike Johnson', 'Startup Co.', 1),
      ('acc1', 'camp2', 'Holiday Sales Outreach', 'opened', NOW() - INTERVAL '9 days', 'mike.johnson@startup.co', 'Mike Johnson', 'Startup Co.', 1),
      ('acc1', 'camp2', 'Holiday Sales Outreach', 'replied', NOW() - INTERVAL '9 days', 'mike.johnson@startup.co', 'Mike Johnson', 'Startup Co.', 1),
      ('acc1', 'camp3', 'Enterprise Pilot Program', 'sent', NOW() - INTERVAL '3 days', 'lisa.chen@enterprise.com', 'Lisa Chen', 'Enterprise Corp', 1),
      ('acc1', 'camp3', 'Enterprise Pilot Program', 'opened', NOW() - INTERVAL '3 days', 'lisa.chen@enterprise.com', 'Lisa Chen', 'Enterprise Corp', 1),
      ('acc1', 'camp3', 'Enterprise Pilot Program', 'replied', NOW() - INTERVAL '2 days', 'lisa.chen@enterprise.com', 'Lisa Chen', 'Enterprise Corp', 1)
      ON CONFLICT DO NOTHING
    `;

    // Add sample meetings
    await sql`
      INSERT INTO meeting_bookings (
        account_id, campaign_id, campaign_name, lead_email, lead_name, 
        company_name, meeting_type, meeting_date, booking_date, step_number, days_to_book
      ) VALUES 
      ('acc1', 'camp1', 'Q4 Product Launch Campaign', 'john.doe@techcorp.com', 'John Doe', 'TechCorp Inc.', 'Product Demo', NOW() + INTERVAL '3 days', NOW() - INTERVAL '2 days', 3, 5),
      ('acc1', 'camp2', 'Holiday Sales Outreach', 'mike.johnson@startup.co', 'Mike Johnson', 'Startup Co.', 'Sales Call', NOW() + INTERVAL '1 day', NOW() - INTERVAL '5 days', 2, 10),
      ('acc1', 'camp3', 'Enterprise Pilot Program', 'lisa.chen@enterprise.com', 'Lisa Chen', 'Enterprise Corp', 'Strategy Session', NOW() + INTERVAL '7 days', NOW() - INTERVAL '1 day', 1, 2)
      ON CONFLICT DO NOTHING
    `;

    console.log('✅ Sample data added successfully!');
    console.log('🎯 Your dashboard now has:');
    console.log('   • 3 sample campaigns');
    console.log('   • 9 step performance records');
    console.log('   • 4 lead engagement records');
    console.log('   • 4 reply records');
    console.log('   • 10 activity records');
    console.log('   • 3 meeting bookings');
    console.log('');
    console.log('📊 Visit http://localhost:3001 to see your dashboard!');

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  }
}

addSampleData();