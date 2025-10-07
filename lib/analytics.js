// Analytics helper functions
import { query } from './db';

export async function getMetricTrends(days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const trends = await query(`
    SELECT 
      DATE(activity_date) as date,
      COUNT(CASE WHEN activity_type = 'emailsSent' THEN 1 END) as sent,
      COUNT(CASE WHEN activity_type = 'emailsOpened' THEN 1 END) as opened,
      COUNT(CASE WHEN activity_type = 'emailsReplied' THEN 1 END) as replied
    FROM all_activities
    WHERE activity_date >= $1 AND activity_date <= $2
    GROUP BY DATE(activity_date)
    ORDER BY date
  `, [startDate, endDate]);
  
  return trends;
}

export async function getCampaignMetrics(campaignId) {
  const overview = await query(
    'SELECT * FROM campaign_overview WHERE campaign_id = $1',
    [campaignId]
  );
  
  const steps = await query(
    'SELECT * FROM step_performance WHERE campaign_id = $1 ORDER BY step_number',
    [campaignId]
  );
  
  const leadCount = await query(
    'SELECT COUNT(*) as total FROM lead_engagement WHERE campaign_id = $1',
    [campaignId]
  );
  
  return {
    overview: overview[0],
    steps,
    totalLeads: parseInt(leadCount[0].total)
  };
}

export async function getTopPerformingCampaigns(limit = 10) {
  const campaigns = await query(`
    SELECT 
      campaign_id,
      campaign_name,
      email_reply_rate,
      meetings_booked,
      total_leads
    FROM campaign_overview
    WHERE is_archived = false
    ORDER BY email_reply_rate DESC
    LIMIT $1
  `, [limit]);
  
  return campaigns;
}

export async function getLeadEngagementScore(leadEmail) {
  const lead = await query(
    'SELECT * FROM lead_engagement WHERE lead_email = $1',
    [leadEmail]
  );
  
  if (lead.length === 0) return null;
  
  const leadData = lead[0];
  let score = 0;
  
  // Calculate engagement score
  if (leadData.opens > 0) score += 10;
  if (leadData.clicks > 0) score += 20;
  if (leadData.replies > 0) score += 30;
  if (leadData.is_interested) score += 40;
  
  // Deduct for negative signals
  if (leadData.is_bounced) score -= 50;
  if (leadData.is_unsubscribed) score -= 30;
  
  return {
    email: leadEmail,
    score: Math.max(0, score),
    engagement: {
      opens: leadData.opens,
      clicks: leadData.clicks,
      replies: leadData.replies,
      interested: leadData.is_interested,
      bounced: leadData.is_bounced,
      unsubscribed: leadData.is_unsubscribed
    }
  };
}

export async function getResponseTimeAnalysis(campaignId) {
  const replies = await query(`
    SELECT 
      step_number,
      AVG(response_time_hours) as avg_response_time,
      MIN(response_time_hours) as min_response_time,
      MAX(response_time_hours) as max_response_time,
      COUNT(*) as total_replies
    FROM replies_detail
    WHERE campaign_id = $1 AND response_time_hours IS NOT NULL
    GROUP BY step_number
    ORDER BY step_number
  `, [campaignId]);
  
  return replies;
}

export async function getBestPerformingTimeSlots(campaignId) {
  const activities = await query(`
    SELECT 
      EXTRACT(HOUR FROM activity_date) as hour,
      EXTRACT(DOW FROM activity_date) as day_of_week,
      COUNT(CASE WHEN activity_type = 'emailsOpened' THEN 1 END) as opens,
      COUNT(CASE WHEN activity_type = 'emailsReplied' THEN 1 END) as replies
    FROM all_activities
    WHERE campaign_id = $1
    GROUP BY hour, day_of_week
    ORDER BY replies DESC, opens DESC
    LIMIT 10
  `, [campaignId]);
  
  return activities;
}

export default {
  getMetricTrends,
  getCampaignMetrics,
  getTopPerformingCampaigns,
  getLeadEngagementScore,
  getResponseTimeAnalysis,
  getBestPerformingTimeSlots
};