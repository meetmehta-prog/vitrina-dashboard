-- Campaign Overview table
CREATE TABLE campaign_overview (
  id SERIAL PRIMARY KEY,
  account_id VARCHAR(50),
  campaign_id VARCHAR(100) UNIQUE,
  campaign_name VARCHAR(255),
  status VARCHAR(50),
  is_archived BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMP,
  total_leads INTEGER DEFAULT 0,
  active_leads INTEGER DEFAULT 0,
  completed_leads INTEGER DEFAULT 0,
  total_emails_sent INTEGER DEFAULT 0,
  unique_leads_emailed INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  email_opens INTEGER DEFAULT 0,
  email_open_rate DECIMAL(5,2),
  email_clicks INTEGER DEFAULT 0,
  email_ctr DECIMAL(5,2),
  email_replies INTEGER DEFAULT 0,
  email_reply_rate DECIMAL(5,2),
  email_bounces INTEGER DEFAULT 0,
  email_bounce_rate DECIMAL(5,2),
  email_fails INTEGER DEFAULT 0,
  unsubscribes INTEGER DEFAULT 0,
  meetings_booked INTEGER DEFAULT 0,
  interested INTEGER DEFAULT 0,
  not_interested INTEGER DEFAULT 0,
  team_id VARCHAR(100),
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step Performance table
CREATE TABLE step_performance (
  id SERIAL PRIMARY KEY,
  account_id VARCHAR(50),
  campaign_id VARCHAR(100),
  campaign_name VARCHAR(255),
  step_number INTEGER,
  step_type VARCHAR(50),
  unique_leads_sent INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2),
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),
  replies INTEGER DEFAULT 0,
  reply_rate DECIMAL(5,2),
  bounces INTEGER DEFAULT 0,
  fails INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, step_number)
);

-- Lead Engagement table
CREATE TABLE lead_engagement (
  id SERIAL PRIMARY KEY,
  account_id VARCHAR(50),
  campaign_id VARCHAR(100),
  campaign_name VARCHAR(255),
  lead_email VARCHAR(255),
  lead_name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(50),
  added_date TIMESTAMP,
  last_activity_date TIMESTAMP,
  last_activity_type VARCHAR(100),
  emails_sent INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  bounces INTEGER DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  is_interested BOOLEAN DEFAULT FALSE,
  is_replied BOOLEAN DEFAULT FALSE,
  is_bounced BOOLEAN DEFAULT FALSE,
  is_unsubscribed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, lead_email)
);

-- Replies Detail table
CREATE TABLE replies_detail (
  id SERIAL PRIMARY KEY,
  account_id VARCHAR(50),
  campaign_id VARCHAR(100),
  campaign_name VARCHAR(255),
  reply_date TIMESTAMP,
  reply_type VARCHAR(50),
  lead_email VARCHAR(255),
  lead_name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  step_number INTEGER,
  sender_name VARCHAR(255),
  reply_content TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  is_first_reply BOOLEAN DEFAULT FALSE,
  original_message_date TIMESTAMP,
  response_time_hours DECIMAL(10,2),
  reply_id VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- All Activities table
CREATE TABLE all_activities (
  id SERIAL PRIMARY KEY,
  activity_id VARCHAR(100) UNIQUE,
  account_id VARCHAR(50),
  campaign_id VARCHAR(100),
  campaign_name VARCHAR(255),
  activity_type VARCHAR(100),
  activity_date TIMESTAMP,
  lead_email VARCHAR(255),
  lead_name VARCHAR(255),
  company_name VARCHAR(255),
  step_number INTEGER,
  sender_name VARCHAR(255),
  is_first BOOLEAN DEFAULT FALSE,
  stopped_sequence BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  additional_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meeting Bookings table
CREATE TABLE meeting_bookings (
  id SERIAL PRIMARY KEY,
  account_id VARCHAR(50),
  campaign_id VARCHAR(100),
  campaign_name VARCHAR(255),
  lead_email VARCHAR(255),
  lead_name VARCHAR(255),
  company_name VARCHAR(255),
  meeting_type VARCHAR(100),
  meeting_date TIMESTAMP,
  booking_date TIMESTAMP,
  step_number INTEGER,
  days_to_book INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_campaign_overview_campaign_id ON campaign_overview(campaign_id);
CREATE INDEX idx_campaign_overview_account_id ON campaign_overview(account_id);
CREATE INDEX idx_step_performance_campaign_id ON step_performance(campaign_id);
CREATE INDEX idx_lead_engagement_campaign_id ON lead_engagement(campaign_id);
CREATE INDEX idx_lead_engagement_email ON lead_engagement(lead_email);
CREATE INDEX idx_replies_detail_campaign_id ON replies_detail(campaign_id);
CREATE INDEX idx_all_activities_campaign_id ON all_activities(campaign_id);
CREATE INDEX idx_all_activities_date ON all_activities(activity_date);
CREATE INDEX idx_meeting_bookings_campaign_id ON meeting_bookings(campaign_id);