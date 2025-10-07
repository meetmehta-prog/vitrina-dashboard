// Database types derived from schema
export interface Campaign {
  id: number;
  accountId: string;
  campaignId: string;
  campaignName: string;
  status?: string;
  isArchived?: boolean;
  createdDate?: Date;
  totalLeads: number;
  activeLeads: number;
  completedLeads: number;
  totalEmailsSent: number;
  uniqueLeadsEmailed: number;
  emailsDelivered: number;
  emailOpens: number;
  emailOpenRate: string;
  emailClicks: number;
  emailCTR: string;
  emailReplies: number;
  emailReplyRate: string;
  emailBounces: number;
  emailBounceRate: string;
  emailFails: number;
  unsubscribes: number;
  meetingsBooked: number;
  interested: number;
  notInterested: number;
  teamId?: string;
  senderName?: string;
  senderEmail?: string;
  lastUpdated: Date;
}

export interface StepPerformance {
  id: number;
  accountId: string;
  campaignId: string;
  campaignName: string;
  stepNumber: number;
  stepType: string;
  uniqueLeadsSent: number;
  opens: number;
  openRate: string;
  clicks: number;
  ctr: string;
  replies: number;
  replyRate: string;
  bounces: number;
  fails: number;
  lastUpdated: Date;
}

export interface LeadEngagement {
  id: number;
  accountId: string;
  campaignId: string;
  campaignName: string;
  leadEmail: string;
  leadName?: string;
  companyName?: string;
  phone?: string;
  status: string;
  addedDate?: Date;
  lastActivityDate?: Date;
  lastActivityType?: string;
  emailsSent: number;
  opens: number;
  clicks: number;
  replies: number;
  bounces: number;
  totalActivities: number;
  isInterested: boolean;
  isReplied: boolean;
  isBounced: boolean;
  isUnsubscribed: boolean;
  lastUpdated: Date;
}

export interface ReplyDetail {
  id: number;
  accountId: string;
  campaignId: string;
  campaignName: string;
  replyDate?: Date;
  replyType?: string;
  leadEmail: string;
  leadName?: string;
  companyName?: string;
  phone?: string;
  stepNumber?: number;
  senderName?: string;
  replyContent?: string;
  isBot: boolean;
  isFirstReply: boolean;
  originalMessageDate?: Date;
  responseTime?: string;
  replyId?: string;
  lastUpdated: Date;
}

export interface Activity {
  id: number;
  activityId?: string;
  accountId: string;
  campaignId: string;
  campaignName: string;
  activityType: string;
  activityDate?: Date;
  leadEmail?: string;
  leadName?: string;
  companyName?: string;
  stepNumber?: number;
  senderName?: string;
  isFirst: boolean;
  stoppedSequence: boolean;
  isBot: boolean;
  errorMessage?: string;
  additionalData?: string;
  lastUpdated: Date;
}

export interface MeetingBooking {
  id: number;
  accountId: string;
  campaignId: string;
  campaignName: string;
  leadEmail: string;
  leadName?: string;
  companyName?: string;
  meetingType?: string;
  meetingDate?: Date;
  bookingDate?: Date;
  stepNumber?: number;
  daysToBook?: number;
  lastUpdated: Date;
}

export interface AllowedUser {
  id: number;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface DataSyncLog {
  id: number;
  syncType: string;
  startTime: Date;
  endTime?: Date;
  status: string;
  recordsProcessed: number;
  errorMessage?: string;
  metadata?: any;
}

// Dashboard specific types
export interface DashboardData {
  overview: Campaign[];
  steps: StepPerformance[];
  leads: LeadEngagement[];
  replies: ReplyDetail[];
  activities: Activity[];
  meetings: MeetingBooking[];
  lastUpdated: string;
}

export interface ExecutiveMetrics {
  totalCampaigns: number;
  runningCampaigns: number;
  completedCampaigns: number;
  archivedCampaigns: number;
  totalLeads: number;
  totalEmailsSent: number;
  totalReplies: number;
  avgReplyRate: number;
  totalMeetings: number;
  avgOpenRate: number;
  avgCTR: number;
}

export interface CampaignPerformanceData {
  campaignId: string;
  campaignName: string;
  accountId: string;
  status?: string;
  isArchived?: boolean;
  leads: number;
  emailsSent: number;
  opens: number;
  clicks: number;
  replies: number;
  meetings: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
}

export interface FunnelData {
  emailsSent: number;
  opens: number;
  clicks: number;
  replies: number;
  meetings: number;
}

export interface StepPerformanceData {
  step: number;
  sent: number;
  openRate: string;
  clickRate: string;
  replyRate: string;
  remainingLeads: number;
}

export interface ReplyTimelineData {
  date: string;
  totalReplies: number;
  firstReplies: number;
  repeatReplies: number;
}

export interface LeadStatusBreakdown {
  active: number;
  bounced: number;
  unsubscribed: number;
  not_interested: number;
  replied: number;
  interested: number;
}

export interface RecentActivity {
  type: string;
  date: string;
  leadEmail: string;
  leadName?: string;
  campaignName: string;
  step?: number;
}

// Pagination types
export interface PaginatedLeads {
  leads: LeadEngagement[];
  currentPage: number;
  totalPages: number;
  totalLeads: number;
  pageSize: number;
}

export interface PaginatedReplies {
  replies: ReplyDetail[];
  currentPage: number;
  totalPages: number;
  totalReplies: number;
  pageSize: number;
}

export interface PaginatedCampaignLeads {
  leads: LeadEngagement[];
  currentPage: number;
  totalPages: number;
  totalLeads: number;
  pageSize: number;
  filterType: string;
}

// Heatmap types
export interface HeatmapData {
  openRates: { [day: string]: string[] };
  replyRates: { [day: string]: string[] };
}

// Campaign comparison types
export interface CampaignComparison {
  campaigns: CampaignComparisonData[];
  bestPerformers: { [metric: string]: string };
  insights: ComparisonInsight[];
  comparisonDate: string;
}

export interface CampaignComparisonData {
  id: string;
  name: string;
  accountId: string;
  status?: string;
  isArchived?: boolean;
  createdDate?: string;
  overview: CampaignOverviewMetrics;
  steps: StepPerformanceData[];
  repliesCount: number;
  firstReplies: number;
}

export interface CampaignOverviewMetrics {
  totalLeads: number;
  activeLeads: number;
  completedLeads: number;
  totalEmailsSent: number;
  uniqueLeadsEmailed: number;
  emailsDelivered: number;
  emailOpens: number;
  emailOpenRate: number;
  emailClicks: number;
  emailCTR: number;
  emailReplies: number;
  emailReplyRate: number;
  emailBounces: number;
  emailBounceRate: number;
  emailFails: number;
  unsubscribes: number;
  meetingsBooked: number;
  interested: number;
  notInterested: number;
}

export interface ComparisonInsight {
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
}

// Lemlist API types
export interface LemlistCampaign {
  _id: string;
  name: string;
  status?: string;
  archived?: boolean;
  createdAt?: string;
  teamId?: string;
}

export interface LemlistActivity {
  _id: string;
  type: string;
  createdAt: string;
  leadId?: string;
  leadEmail?: string;
  leadFirstName?: string;
  leadLastName?: string;
  leadCompanyName?: string;
  leadPhone?: string;
  sequenceStep?: number;
  teamId?: string;
  sendUserName?: string;
  sendUserEmail?: string;
  bot?: boolean;
  isFirst?: boolean;
  stopped?: boolean;
  errorMessage?: string;
  relatedSentAt?: string;
  body?: string;
  metaData?: any;
  location?: string;
  conditionLabel?: string;
  conditionValue?: string;
  note?: string;
}

export interface LemlistLead {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  company?: string;
  phone?: string;
  createdAt?: string;
  customVariables?: { [key: string]: any };
}