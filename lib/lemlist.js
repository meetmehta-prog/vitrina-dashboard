import axios from 'axios';

const CONFIG = {
  API_KEYS: [
    process.env.LEMLIST_API_KEY_1,
    process.env.LEMLIST_API_KEY_2
  ],
  BASE_URL: 'https://api.lemlist.com/api',
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
  REQUEST_DELAY: 500,
  INCLUDE_ARCHIVED: true
};

function createAuthHeader(apiKey) {
  const auth = Buffer.from(':' + apiKey).toString('base64');
  return {
    'Authorization': 'Basic ' + auth,
    'Accept': 'application/json'
  };
}

async function fetchWithRetry(url, headers, retries = CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      
      if (attempt === retries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
    }
  }
}

async function fetchAllPaginated(url, headers) {
  const allData = [];
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const paginatedUrl = `${url}${url.includes('?') ? '&' : '?'}limit=${CONFIG.BATCH_SIZE}&offset=${offset}`;
    
    try {
      const data = await fetchWithRetry(paginatedUrl, headers);
      
      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
        break;
      }
      
      allData.push(...data);
      offset += CONFIG.BATCH_SIZE;
      
      if (data.length < CONFIG.BATCH_SIZE) {
        hasMore = false;
      }
      
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));
      }
    } catch (error) {
      console.error('Pagination error at offset', offset, error.message);
      hasMore = false;
    }
  }
  
  return allData;
}

export async function fetchAllActivities(campaignId, apiKey) {
  const headers = createAuthHeader(apiKey);
  const activities = await fetchAllPaginated(
    `${CONFIG.BASE_URL}/activities?campaignId=${campaignId}`,
    headers
  );
  return activities;
}

export async function fetchReplyContent(activities, campaignId, apiKey) {
  const headers = createAuthHeader(apiKey);
  const repliesMap = {};
  const replyActivities = activities.filter(a => a.type === 'emailsReplied');
  
  for (let i = 0; i < replyActivities.length; i++) {
    try {
      const activity = replyActivities[i];
      const detailUrl = `${CONFIG.BASE_URL}/activities/${activity._id}`;
      const detailedActivity = await fetchWithRetry(detailUrl, headers);
      
      if (detailedActivity) {
        const replyContent = detailedActivity.body || 
                           detailedActivity.text || 
                           (detailedActivity.metaData?.body) || 
                           '';
        
        repliesMap[activity._id] = {
          content: replyContent,
          fullData: detailedActivity
        };
      }
      
      if (i % 10 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));
      }
    } catch (error) {
      console.error('Error fetching reply content:', error.message);
    }
  }
  
  return repliesMap;
}

export async function fetchCampaigns(apiKey) {
  const headers = createAuthHeader(apiKey);
  const campaigns = await fetchWithRetry(`${CONFIG.BASE_URL}/campaigns`, headers);
  
  if (!CONFIG.INCLUDE_ARCHIVED) {
    return campaigns.filter(campaign => {
      const isArchived = campaign.archived === true;
      const isEnded = ['ended', 'archived', 'completed'].includes((campaign.status || '').toLowerCase());
      return !isArchived && !isEnded;
    });
  }
  
  return campaigns;
}

export async function fetchLeads(campaignId, apiKey) {
  const headers = createAuthHeader(apiKey);
  return await fetchAllPaginated(
    `${CONFIG.BASE_URL}/leads?campaignId=${campaignId}`,
    headers
  );
}

export async function processCampaign(campaign, accountId, apiKey) {
  const campaignId = campaign._id;
  const campaignName = campaign.name;
  
  console.log(`Processing campaign: ${campaignName} (ID: ${campaignId})`);
  
  // Fetch all activities
  const allActivities = await fetchAllActivities(campaignId, apiKey);
  console.log(`Found ${allActivities.length} activities`);
  
  // Calculate lead counts
  const uniqueLeadIds = new Set();
  const activeLeadIds = new Set();
  const completedStatuses = ['emailsBounced', 'emailsUnsubscribed', 'emailsNotInterested'];
  
  allActivities.forEach(activity => {
    if (activity.leadId) {
      uniqueLeadIds.add(activity.leadId);
      if (!completedStatuses.includes(activity.type)) {
        activeLeadIds.add(activity.leadId);
      }
    }
  });
  
  const totalLeadsCount = uniqueLeadIds.size;
  const activeLeadsCount = activeLeadIds.size;
  
  // Fetch leads
  const leads = await fetchLeads(campaignId, apiKey);
  const leadMap = {};
  leads.forEach(lead => {
    leadMap[lead.email] = lead;
  });
  
  // Fetch reply content
  const repliesWithContent = await fetchReplyContent(allActivities, campaignId, apiKey);
  
  // Process activities
  const processed = processActivities(
    allActivities, 
    campaignId, 
    campaignName, 
    accountId, 
    leadMap, 
    repliesWithContent
  );
  
  // Calculate campaign overview
  const overview = calculateCampaignOverview(
    campaign,
    accountId,
    totalLeadsCount,
    activeLeadsCount,
    processed.metrics,
    processed.teamInfo
  );
  
  return {
    overview,
    steps: processed.stepMetrics,
    leads: processed.leadSummaries,
    replies: processed.replies,
    activities: processed.activityLog,
    meetings: processed.meetings
  };
}

function processActivities(activities, campaignId, campaignName, accountId, leadMap, repliesMap) {
  const metrics = {
    totalEmailsSent: 0,
    uniqueLeadsEmailed: new Set(),
    emailOpens: new Set(),
    emailClicks: new Set(),
    emailReplies: new Set(),
    emailBounces: new Set(),
    emailFails: new Set(),
    unsubscribes: new Set(),
    interested: new Set(),
    notInterested: new Set(),
    meetingsBooked: new Set()
  };
  
  const stepMetrics = {};
  const leadMetrics = {};
  const leadReplyCounts = {};
  const replies = [];
  const meetings = [];
  const activityLog = [];
  
  let teamInfo = { teamId: '', senderName: '', senderEmail: '' };
  
  activities.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  activities.forEach(activity => {
    const type = activity.type;
    const leadId = activity.leadId;
    const leadEmail = activity.leadEmail || '';
    const step = activity.sequenceStep || 0;
    
    if (!teamInfo.teamId && activity.teamId) {
      teamInfo = {
        teamId: activity.teamId || '',
        senderName: activity.sendUserName || '',
        senderEmail: activity.sendUserEmail || ''
      };
    }
    
    if (!stepMetrics[step]) {
      stepMetrics[step] = {
        sent: new Set(),
        opens: new Set(),
        clicks: new Set(),
        replies: new Set(),
        bounces: new Set(),
        fails: new Set()
      };
    }
    
    if (leadEmail && !leadMetrics[leadEmail]) {
      const lead = leadMap[leadEmail] || {};
      leadMetrics[leadEmail] = {
        leadEmail: leadEmail,
        leadName: getLeadName(activity, lead),
        companyName: getCompanyName(activity, lead),
        phone: activity.leadPhone || lead.phone || '',
        addedDate: lead.createdAt || '',
        lastActivityDate: '',
        lastActivityType: '',
        emailsSent: 0,
        opens: 0,
        clicks: 0,
        replies: 0,
        bounces: 0,
        totalActivities: 0,
        isInterested: false,
        isReplied: false,
        isBounced: false,
        isUnsubscribed: false,
        status: 'active'
      };
    }
    
    if (leadEmail && leadMetrics[leadEmail]) {
      const lm = leadMetrics[leadEmail];
      lm.totalActivities++;
      lm.lastActivityDate = activity.createdAt;
      lm.lastActivityType = type;
    }
    
    // Process activity types
    switch (type) {
      case 'emailsSent':
        metrics.totalEmailsSent++;
        metrics.uniqueLeadsEmailed.add(leadId);
        stepMetrics[step].sent.add(leadId);
        if (leadMetrics[leadEmail]) leadMetrics[leadEmail].emailsSent++;
        break;
      
      case 'emailsOpened':
        metrics.emailOpens.add(leadId);
        stepMetrics[step].opens.add(leadId);
        if (leadMetrics[leadEmail]) leadMetrics[leadEmail].opens++;
        break;
      
      case 'emailsClicked':
        metrics.emailClicks.add(leadId);
        stepMetrics[step].clicks.add(leadId);
        if (leadMetrics[leadEmail]) leadMetrics[leadEmail].clicks++;
        break;
      
      case 'emailsReplied':
        metrics.emailReplies.add(leadId);
        stepMetrics[step].replies.add(leadId);
        
        if (!leadReplyCounts[leadEmail]) {
          leadReplyCounts[leadEmail] = 0;
        }
        leadReplyCounts[leadEmail]++;
        const isFirstReply = (leadReplyCounts[leadEmail] === 1);
        
        if (leadMetrics[leadEmail]) {
          leadMetrics[leadEmail].replies++;
          leadMetrics[leadEmail].isReplied = true;
        }
        replies.push(createReplyRecord(activity, campaignId, campaignName, accountId, leadMap, repliesMap, isFirstReply));
        break;
      
      case 'emailsBounced':
        metrics.emailBounces.add(leadId);
        stepMetrics[step].bounces.add(leadId);
        if (leadMetrics[leadEmail]) {
          leadMetrics[leadEmail].bounces++;
          leadMetrics[leadEmail].isBounced = true;
          leadMetrics[leadEmail].status = 'bounced';
        }
        break;
      
      case 'emailsFailed':
        metrics.emailFails.add(leadId);
        stepMetrics[step].fails.add(leadId);
        break;
      
      case 'emailsUnsubscribed':
        metrics.unsubscribes.add(leadId);
        if (leadMetrics[leadEmail]) {
          leadMetrics[leadEmail].isUnsubscribed = true;
          leadMetrics[leadEmail].status = 'unsubscribed';
        }
        break;
      
      case 'emailsInterested':
        metrics.interested.add(leadId);
        if (leadMetrics[leadEmail]) leadMetrics[leadEmail].isInterested = true;
        break;
      
      case 'emailsNotInterested':
        metrics.notInterested.add(leadId);
        if (leadMetrics[leadEmail]) leadMetrics[leadEmail].status = 'not_interested';
        break;
      
      case 'meetingBooked':
        metrics.meetingsBooked.add(leadId);
        meetings.push(createMeetingRecord(activity, campaignId, campaignName, accountId, leadMap));
        break;
    }
    
    activityLog.push(createActivityLogRecord(activity, campaignId, campaignName, accountId));
  });
  
  // Convert step metrics to array
  const stepMetricsArray = [];
  Object.keys(stepMetrics).sort((a, b) => parseInt(a) - parseInt(b)).forEach(step => {
    const sm = stepMetrics[step];
    const sent = sm.sent.size;
    const opens = sm.opens.size;
    const clicks = sm.clicks.size;
    const replies = sm.replies.size;
    const bounces = sm.bounces.size;
    const fails = sm.fails.size;
    
    const openRate = sent > 0 ? ((opens / sent) * 100).toFixed(2) : 0;
    const ctr = opens > 0 ? ((clicks / opens) * 100).toFixed(2) : 0;
    const replyRate = sent > 0 ? ((replies / sent) * 100).toFixed(2) : 0;
    
    stepMetricsArray.push({
      accountId,
      campaignId,
      campaignName,
      stepNumber: step,
      stepType: 'Email',
      uniqueLeadsSent: sent,
      opens,
      openRate,
      clicks,
      ctr,
      replies,
      replyRate,
      bounces,
      fails
    });
  });
  
  // Convert lead metrics to array
  const leadSummaries = Object.values(leadMetrics);
  
  return {
    metrics,
    stepMetrics: stepMetricsArray,
    leadSummaries,
    replies,
    meetings,
    activityLog,
    teamInfo
  };
}

function getLeadName(activity, lead) {
  const firstName = activity.leadFirstName || lead.firstName || '';
  const lastName = activity.leadLastName || lead.lastName || '';
  return (firstName + ' ' + lastName).trim() || 'N/A';
}

function getCompanyName(activity, lead) {
  return activity.leadCompanyName || 
         lead.companyName || 
         lead.company || 
         (lead.customVariables?.company) ||
         (lead.customVariables?.companyName) ||
         'N/A';
}

function createReplyRecord(activity, campaignId, campaignName, accountId, leadMap, repliesMap, isFirstReply) {
  const leadEmail = activity.leadEmail || 'N/A';
  const lead = leadMap[leadEmail] || {};
  const activityId = activity._id;
  
  let replyContent = '';
  if (repliesMap && repliesMap[activityId]) {
    replyContent = repliesMap[activityId].content || '';
  }
  
  if (!replyContent) {
    replyContent = activity.body || (activity.metaData?.body) || '';
  }
  
  const responseTime = calculateResponseTime(activity.createdAt, activity.relatedSentAt);
  
  return {
    accountId,
    campaignId,
    campaignName,
    replyDate: activity.createdAt || '',
    replyType: activity.type,
    leadEmail,
    leadName: getLeadName(activity, lead),
    companyName: getCompanyName(activity, lead),
    phone: activity.leadPhone || lead.phone || '',
    stepNumber: activity.sequenceStep || 0,
    senderName: activity.sendUserName || '',
    replyContent,
    isBot: activity.bot || false,
    isFirstReply,
    originalMessageDate: activity.relatedSentAt || '',
    responseTimeHours: responseTime,
    replyId: activityId
  };
}

function createMeetingRecord(activity, campaignId, campaignName, accountId, leadMap) {
  const leadEmail = activity.leadEmail || 'N/A';
  const lead = leadMap[leadEmail] || {};
  
  const bookingDate = new Date(activity.createdAt);
  const meetingDate = activity.meetingDate ? new Date(activity.meetingDate) : bookingDate;
  const daysToBook = Math.round((meetingDate - bookingDate) / (1000 * 60 * 60 * 24));
  
  return {
    accountId,
    campaignId,
    campaignName,
    leadEmail,
    leadName: getLeadName(activity, lead),
    companyName: getCompanyName(activity, lead),
    meetingType: activity.meetingType || 'N/A',
    meetingDate: activity.meetingDate || '',
    bookingDate: activity.createdAt || '',
    stepNumber: activity.sequenceStep || 0,
    daysToBook
  };
}

function createActivityLogRecord(activity, campaignId, campaignName, accountId) {
  let additionalData = '';
  
  if (activity.location) additionalData = 'URL: ' + activity.location;
  if (activity.conditionLabel) additionalData = `Condition: ${activity.conditionLabel} = ${activity.conditionValue}`;
  if (activity.note) additionalData = 'Note: ' + activity.note;
  
  return {
    activityId: activity._id || '',
    accountId,
    campaignId,
    campaignName,
    activityType: activity.type || '',
    activityDate: activity.createdAt || '',
    leadEmail: activity.leadEmail || '',
    leadName: getLeadName(activity, {}),
    companyName: activity.leadCompanyName || '',
    stepNumber: activity.sequenceStep || 0,
    senderName: activity.sendUserName || '',
    isFirst: activity.isFirst || false,
    stoppedSequence: activity.stopped || false,
    isBot: activity.bot || false,
    errorMessage: activity.errorMessage || '',
    additionalData
  };
}

function calculateResponseTime(replyDate, sentDate) {
  if (!replyDate || !sentDate) return 0;
  
  try {
    const reply = new Date(replyDate);
    const sent = new Date(sentDate);
    const hours = (reply - sent) / (1000 * 60 * 60);
    return parseFloat(hours.toFixed(2));
  } catch (error) {
    return 0;
  }
}

function calculateCampaignOverview(campaign, accountId, totalLeadsCount, activeLeadsCount, metrics, teamInfo) {
  const totalLeads = totalLeadsCount;
  const activeLeads = activeLeadsCount;
  const completedLeads = totalLeads - activeLeads;
  
  const totalEmailsSent = metrics.totalEmailsSent;
  const uniqueLeadsEmailed = metrics.uniqueLeadsEmailed.size;
  const emailBounces = metrics.emailBounces.size;
  const emailFails = metrics.emailFails.size;
  const emailDelivered = uniqueLeadsEmailed - emailBounces;
  const emailOpens = metrics.emailOpens.size;
  const emailClicks = metrics.emailClicks.size;
  const emailReplies = metrics.emailReplies.size;
  const unsubscribes = metrics.unsubscribes.size;
  
  const emailOpenRate = uniqueLeadsEmailed > 0 ? ((emailOpens / uniqueLeadsEmailed) * 100).toFixed(2) : 0;
  const emailCTR = emailOpens > 0 ? ((emailClicks / emailOpens) * 100).toFixed(2) : 0;
  const emailReplyRate = uniqueLeadsEmailed > 0 ? ((emailReplies / uniqueLeadsEmailed) * 100).toFixed(2) : 0;
  const emailBounceRate = uniqueLeadsEmailed > 0 ? ((emailBounces / uniqueLeadsEmailed) * 100).toFixed(2) : 0;
  
  const meetingsBooked = metrics.meetingsBooked.size;
  const interested = metrics.interested.size;
  const notInterested = metrics.notInterested.size;
  
  const isArchived = campaign.archived === true;
  
  return {
    accountId,
    campaignId: campaign._id,
    campaignName: campaign.name,
    status: campaign.status || 'active',
    isArchived,
    createdDate: campaign.createdAt || '',
    totalLeads,
    activeLeads,
    completedLeads,
    totalEmailsSent,
    uniqueLeadsEmailed,
    emailsDelivered: emailDelivered,
    emailOpens,
    emailOpenRate: parseFloat(emailOpenRate),
    emailClicks,
    emailCTR: parseFloat(emailCTR),
    emailReplies,
    emailReplyRate: parseFloat(emailReplyRate),
    emailBounces,
    emailBounceRate: parseFloat(emailBounceRate),
    emailFails,
    unsubscribes,
    meetingsBooked,
    interested,
    notInterested,
    teamId: teamInfo.teamId,
    senderName: teamInfo.senderName,
    senderEmail: teamInfo.senderEmail
  };
}

export async function syncLemlistData() {
  const allData = {
    overview: [],
    steps: [],
    leads: [],
    replies: [],
    activities: [],
    meetings: []
  };
  
  for (let i = 0; i < CONFIG.API_KEYS.length; i++) {
    const apiKey = CONFIG.API_KEYS[i];
    const accountId = `ACC_${i + 1}`;
    
    console.log(`Processing Account: ${accountId}`);
    
    try {
      const campaigns = await fetchCampaigns(apiKey);
      console.log(`Found ${campaigns.length} campaigns`);
      
      for (const campaign of campaigns) {
        const campaignData = await processCampaign(campaign, accountId, apiKey);
        
        allData.overview.push(campaignData.overview);
        allData.steps = allData.steps.concat(campaignData.steps);
        allData.leads = allData.leads.concat(campaignData.leads);
        allData.replies = allData.replies.concat(campaignData.replies);
        allData.activities = allData.activities.concat(campaignData.activities);
        allData.meetings = allData.meetings.concat(campaignData.meetings);
        
        // Add delay between campaigns
        await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));
      }
      
      console.log(`Account ${accountId} processed successfully`);
      
    } catch (error) {
      console.error(`Error processing account ${accountId}:`, error.message);
    }
  }
  
  return allData;
}

export default {
  syncLemlistData,
  fetchCampaigns,
  processCampaign
};