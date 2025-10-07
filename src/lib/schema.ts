import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer, 
  decimal, 
  boolean, 
  jsonb,
  index
} from 'drizzle-orm/pg-core';

// Campaign Overview table - corresponds to 'Campaign Overview' sheet
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  accountId: text('account_id').notNull(),
  campaignId: text('campaign_id').notNull().unique(),
  campaignName: text('campaign_name').notNull(),
  status: text('status'),
  isArchived: boolean('is_archived').default(false),
  createdDate: timestamp('created_date'),
  totalLeads: integer('total_leads').default(0),
  activeLeads: integer('active_leads').default(0),
  completedLeads: integer('completed_leads').default(0),
  totalEmailsSent: integer('total_emails_sent').default(0),
  uniqueLeadsEmailed: integer('unique_leads_emailed').default(0),
  emailsDelivered: integer('emails_delivered').default(0),
  emailOpens: integer('email_opens').default(0),
  emailOpenRate: decimal('email_open_rate', { precision: 5, scale: 2 }).default('0'),
  emailClicks: integer('email_clicks').default(0),
  emailCTR: decimal('email_ctr', { precision: 5, scale: 2 }).default('0'),
  emailReplies: integer('email_replies').default(0),
  emailReplyRate: decimal('email_reply_rate', { precision: 5, scale: 2 }).default('0'),
  emailBounces: integer('email_bounces').default(0),
  emailBounceRate: decimal('email_bounce_rate', { precision: 5, scale: 2 }).default('0'),
  emailFails: integer('email_fails').default(0),
  unsubscribes: integer('unsubscribes').default(0),
  meetingsBooked: integer('meetings_booked').default(0),
  interested: integer('interested').default(0),
  notInterested: integer('not_interested').default(0),
  teamId: text('team_id'),
  senderName: text('sender_name'),
  senderEmail: text('sender_email'),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  campaignIdIdx: index('campaign_id_idx').on(table.campaignId),
  accountIdIdx: index('account_id_idx').on(table.accountId),
}));

// Step Performance table - corresponds to 'Step Performance' sheet
export const stepPerformance = pgTable('step_performance', {
  id: serial('id').primaryKey(),
  accountId: text('account_id').notNull(),
  campaignId: text('campaign_id').notNull(),
  campaignName: text('campaign_name').notNull(),
  stepNumber: integer('step_number').notNull(),
  stepType: text('step_type').default('Email'),
  uniqueLeadsSent: integer('unique_leads_sent').default(0),
  opens: integer('opens').default(0),
  openRate: decimal('open_rate', { precision: 5, scale: 2 }).default('0'),
  clicks: integer('clicks').default(0),
  ctr: decimal('ctr', { precision: 5, scale: 2 }).default('0'),
  replies: integer('replies').default(0),
  replyRate: decimal('reply_rate', { precision: 5, scale: 2 }).default('0'),
  bounces: integer('bounces').default(0),
  fails: integer('fails').default(0),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  campaignIdIdx: index('step_campaign_id_idx').on(table.campaignId),
  stepNumberIdx: index('step_number_idx').on(table.stepNumber),
}));

// Lead Engagement table - corresponds to 'Lead Engagement' sheet
export const leadEngagement = pgTable('lead_engagement', {
  id: serial('id').primaryKey(),
  accountId: text('account_id').notNull(),
  campaignId: text('campaign_id').notNull(),
  campaignName: text('campaign_name').notNull(),
  leadEmail: text('lead_email').notNull(),
  leadName: text('lead_name'),
  companyName: text('company_name'),
  phone: text('phone'),
  status: text('status').default('active'),
  addedDate: timestamp('added_date'),
  lastActivityDate: timestamp('last_activity_date'),
  lastActivityType: text('last_activity_type'),
  emailsSent: integer('emails_sent').default(0),
  opens: integer('opens').default(0),
  clicks: integer('clicks').default(0),
  replies: integer('replies').default(0),
  bounces: integer('bounces').default(0),
  totalActivities: integer('total_activities').default(0),
  isInterested: boolean('is_interested').default(false),
  isReplied: boolean('is_replied').default(false),
  isBounced: boolean('is_bounced').default(false),
  isUnsubscribed: boolean('is_unsubscribed').default(false),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  campaignIdIdx: index('lead_campaign_id_idx').on(table.campaignId),
  leadEmailIdx: index('lead_email_idx').on(table.leadEmail),
  statusIdx: index('lead_status_idx').on(table.status),
}));

// Replies Detail table - corresponds to 'Replies Detail' sheet
export const repliesDetail = pgTable('replies_detail', {
  id: serial('id').primaryKey(),
  accountId: text('account_id').notNull(),
  campaignId: text('campaign_id').notNull(),
  campaignName: text('campaign_name').notNull(),
  replyDate: timestamp('reply_date'),
  replyType: text('reply_type'),
  leadEmail: text('lead_email').notNull(),
  leadName: text('lead_name'),
  companyName: text('company_name'),
  phone: text('phone'),
  stepNumber: integer('step_number'),
  senderName: text('sender_name'),
  replyContent: text('reply_content'),
  isBot: boolean('is_bot').default(false),
  isFirstReply: boolean('is_first_reply').default(false),
  originalMessageDate: timestamp('original_message_date'),
  responseTime: decimal('response_time', { precision: 8, scale: 2 }),
  replyId: text('reply_id'),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  campaignIdIdx: index('reply_campaign_id_idx').on(table.campaignId),
  leadEmailIdx: index('reply_lead_email_idx').on(table.leadEmail),
  replyDateIdx: index('reply_date_idx').on(table.replyDate),
}));

// All Activities table - corresponds to 'All Activities' sheet
export const allActivities = pgTable('all_activities', {
  id: serial('id').primaryKey(),
  activityId: text('activity_id').unique(),
  accountId: text('account_id').notNull(),
  campaignId: text('campaign_id').notNull(),
  campaignName: text('campaign_name').notNull(),
  activityType: text('activity_type').notNull(),
  activityDate: timestamp('activity_date'),
  leadEmail: text('lead_email'),
  leadName: text('lead_name'),
  companyName: text('company_name'),
  stepNumber: integer('step_number'),
  senderName: text('sender_name'),
  isFirst: boolean('is_first').default(false),
  stoppedSequence: boolean('stopped_sequence').default(false),
  isBot: boolean('is_bot').default(false),
  errorMessage: text('error_message'),
  additionalData: text('additional_data'),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  activityIdIdx: index('activity_id_idx').on(table.activityId),
  campaignIdIdx: index('activity_campaign_id_idx').on(table.campaignId),
  activityTypeIdx: index('activity_type_idx').on(table.activityType),
  activityDateIdx: index('activity_date_idx').on(table.activityDate),
}));

// Meeting Bookings table - corresponds to 'Meeting Bookings' sheet
export const meetingBookings = pgTable('meeting_bookings', {
  id: serial('id').primaryKey(),
  accountId: text('account_id').notNull(),
  campaignId: text('campaign_id').notNull(),
  campaignName: text('campaign_name').notNull(),
  leadEmail: text('lead_email').notNull(),
  leadName: text('lead_name'),
  companyName: text('company_name'),
  meetingType: text('meeting_type'),
  meetingDate: timestamp('meeting_date'),
  bookingDate: timestamp('booking_date'),
  stepNumber: integer('step_number'),
  daysToBook: integer('days_to_book'),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  campaignIdIdx: index('meeting_campaign_id_idx').on(table.campaignId),
  leadEmailIdx: index('meeting_lead_email_idx').on(table.leadEmail),
  bookingDateIdx: index('booking_date_idx').on(table.bookingDate),
}));

// Allowed Users table - for authentication
export const allowedUsers = pgTable('allowed_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  isActive: boolean('is_active').default(true),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
}, (table) => ({
  emailIdx: index('allowed_users_email_idx').on(table.email),
}));

// Data sync log - to track when data was last fetched from Lemlist
export const dataSyncLog = pgTable('data_sync_log', {
  id: serial('id').primaryKey(),
  syncType: text('sync_type').notNull(), // 'full', 'campaigns', 'activities', etc.
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  status: text('status').notNull(), // 'running', 'completed', 'failed'
  recordsProcessed: integer('records_processed').default(0),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'), // Store additional sync information
}, (table) => ({
  syncTypeIdx: index('sync_type_idx').on(table.syncType),
  statusIdx: index('sync_status_idx').on(table.status),
  startTimeIdx: index('sync_start_time_idx').on(table.startTime),
}));