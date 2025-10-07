import axios, { AxiosRequestConfig } from 'axios';
import { LemlistCampaign, LemlistActivity, LemlistLead } from '@/types';

const CONFIG = {
  API_KEYS: [
    process.env.LEMLIST_API_KEY || '6654299aa512a2b377ae9695fd738dd7',
    process.env.LEMLIST_API_KEY2 || '7e3d1ff62f300b2ee0281f3346ad930f'
  ],
  BASE_URL: 'https://api.lemlist.com/api',
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
  REQUEST_DELAY: 500,
  INCLUDE_ARCHIVED: true
};

class LemlistService {
  private createAuthOptions(apiKey: string): AxiosRequestConfig {
    const auth = Buffer.from(':' + apiKey).toString('base64');
    return {
      headers: {
        'Authorization': 'Basic ' + auth,
        'Accept': 'application/json'
      },
      timeout: 30000
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry<T>(url: string, options: AxiosRequestConfig): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get(url, options);
        
        if (response.status === 404) {
          return [] as T;
        }
        
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.data}`);
        }
        
        return response.data;
        
      } catch (error: any) {
        lastError = error;
        
        if (error.message?.includes('quota') && attempt < CONFIG.MAX_RETRIES) {
          const delay = CONFIG.RETRY_DELAY * attempt;
          console.log(`Quota exceeded, waiting ${delay/1000}s before retry ${attempt}`);
          await this.delay(delay);
        } else if (attempt < CONFIG.MAX_RETRIES) {
          console.log(`Retry ${attempt} after error: ${error.message}`);
          await this.delay(CONFIG.RETRY_DELAY);
        }
      }
    }
    
    throw new Error(`Failed after ${CONFIG.MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  private async fetchAllPaginated<T>(url: string, options: AxiosRequestConfig): Promise<T[]> {
    const allData: T[] = [];
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const paginatedUrl = url + (url.includes('?') ? '&' : '?') + 
                           `limit=${CONFIG.BATCH_SIZE}&offset=${offset}`;
      
      try {
        const data = await this.fetchWithRetry<T[]>(paginatedUrl, options);
        
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
          await this.delay(CONFIG.REQUEST_DELAY);
        }
        
      } catch (error: any) {
        console.log(`Pagination error at offset ${offset}: ${error.message}`);
        hasMore = false;
      }
    }
    
    return allData;
  }

  async getCampaigns(apiKey: string): Promise<LemlistCampaign[]> {
    const options = this.createAuthOptions(apiKey);
    const campaigns = await this.fetchWithRetry<LemlistCampaign[]>(
      `${CONFIG.BASE_URL}/campaigns`, 
      options
    );
    
    if (!CONFIG.INCLUDE_ARCHIVED) {
      return campaigns.filter(campaign => {
        const isArchived = (campaign.archived === true);
        const isEnded = ['ended', 'archived', 'completed'].includes((campaign.status || '').toLowerCase());
        return !isArchived && !isEnded;
      });
    }
    
    return campaigns;
  }

  async getActivities(campaignId: string, apiKey: string): Promise<LemlistActivity[]> {
    const options = this.createAuthOptions(apiKey);
    const activities = await this.fetchAllPaginated<LemlistActivity>(
      `${CONFIG.BASE_URL}/activities?campaignId=${campaignId}`,
      options
    );
    
    return activities;
  }

  async getLeads(campaignId: string, apiKey: string): Promise<LemlistLead[]> {
    const options = this.createAuthOptions(apiKey);
    const leads = await this.fetchAllPaginated<LemlistLead>(
      `${CONFIG.BASE_URL}/leads?campaignId=${campaignId}`,
      options
    );
    
    return leads;
  }

  async getActivityDetail(activityId: string, apiKey: string): Promise<any> {
    const options = this.createAuthOptions(apiKey);
    try {
      const detailUrl = `${CONFIG.BASE_URL}/activities/${activityId}`;
      const detailedActivity = await this.fetchWithRetry<any>(detailUrl, options);
      return detailedActivity;
    } catch (error: any) {
      console.log(`Error fetching activity detail for ${activityId}: ${error.message}`);
      return null;
    }
  }

  async fetchReplyContent(activities: LemlistActivity[], campaignId: string, apiKey: string): Promise<{ [activityId: string]: { content: string; fullData: any } }> {
    console.log('Fetching reply content...');
    
    const repliesMap: { [activityId: string]: { content: string; fullData: any } } = {};
    const replyActivities = activities.filter(a => a.type === 'emailsReplied');
    
    console.log(`Found ${replyActivities.length} replies to fetch`);
    
    for (let i = 0; i < replyActivities.length; i++) {
      const activity = replyActivities[i];
      try {
        const activityId = activity._id;
        const detailedActivity = await this.getActivityDetail(activityId, apiKey);
        
        if (detailedActivity) {
          let replyContent = detailedActivity.body || 
                            detailedActivity.text || 
                            (detailedActivity.metaData && detailedActivity.metaData.body) || 
                            '';
          
          repliesMap[activityId] = {
            content: replyContent,
            fullData: detailedActivity
          };
        }
        
        if (i % 10 === 0 && i > 0) {
          await this.delay(CONFIG.REQUEST_DELAY);
        }
        
      } catch (error: any) {
        console.log(`Error fetching reply content for activity ${activity._id}: ${error.message}`);
      }
    }
    
    console.log(`Fetched content for ${Object.keys(repliesMap).length} replies`);
    
    return repliesMap;
  }

  async processAllAccounts(): Promise<{
    overview: any[];
    steps: any[];
    leads: any[];
    replies: any[];
    activities: any[];
    meetings: any[];
  }> {
    const allData = {
      overview: [] as any[],
      steps: [] as any[],
      leads: [] as any[],
      replies: [] as any[],
      activities: [] as any[],
      meetings: [] as any[]
    };
    
    for (let accountIndex = 0; accountIndex < CONFIG.API_KEYS.length; accountIndex++) {
      const apiKey = CONFIG.API_KEYS[accountIndex];
      const accountId = 'ACC_' + (accountIndex + 1);
      
      console.log(`Processing Account: ${accountId}`);
      
      try {
        const accountData = await this.processAccount(apiKey, accountId);
        
        allData.overview = allData.overview.concat(accountData.overview);
        allData.steps = allData.steps.concat(accountData.steps);
        allData.leads = allData.leads.concat(accountData.leads);
        allData.replies = allData.replies.concat(accountData.replies);
        allData.activities = allData.activities.concat(accountData.activities);
        allData.meetings = allData.meetings.concat(accountData.meetings);
        
        console.log(`Account ${accountId} processed successfully`);
        console.log(`- Campaigns: ${accountData.overview.length}`);
        console.log(`- Replies: ${accountData.replies.length}`);
        console.log(`- Activities: ${accountData.activities.length}`);
        
      } catch (error: any) {
        console.log(`ERROR processing account ${accountId}: ${error.message}`);
      }
    }
    
    // Sort data
    allData.overview.sort((a, b) => new Date(a.createdDate || 0).getTime() - new Date(b.createdDate || 0).getTime());
    allData.replies.sort((a, b) => new Date(a.replyDate || 0).getTime() - new Date(b.replyDate || 0).getTime());
    allData.activities.sort((a, b) => new Date(b.activityDate || 0).getTime() - new Date(a.activityDate || 0).getTime());
    allData.meetings.sort((a, b) => new Date(a.bookingDate || 0).getTime() - new Date(b.bookingDate || 0).getTime());
    
    return allData;
  }

  private async processAccount(apiKey: string, accountId: string): Promise<{
    overview: any[];
    steps: any[];
    leads: any[];
    replies: any[];
    activities: any[];
    meetings: any[];
  }> {
    const accountData = {
      overview: [] as any[],
      steps: [] as any[],
      leads: [] as any[],
      replies: [] as any[],
      activities: [] as any[],
      meetings: [] as any[]
    };
    
    const campaigns = await this.getCampaigns(apiKey);
    
    let campaignsToProcess = campaigns;
    if (!CONFIG.INCLUDE_ARCHIVED) {
      campaignsToProcess = campaigns.filter(campaign => {
        const isArchived = (campaign.archived === true);
        const isEnded = ['ended', 'archived', 'completed'].includes((campaign.status || '').toLowerCase());
        return !isArchived && !isEnded;
      });
    }
    
    console.log(`Found ${campaignsToProcess.length} campaigns to process`);
    
    if (campaignsToProcess.length === 0) {
      return accountData;
    }
    
    for (let index = 0; index < campaignsToProcess.length; index++) {
      const campaign = campaignsToProcess[index];
      console.log(`Processing campaign ${index + 1}/${campaignsToProcess.length}: ${campaign.name}`);
      
      try {
        const campaignData = await this.processCampaign(campaign, accountId, apiKey);
        
        accountData.overview.push(campaignData.overview);
        accountData.steps = accountData.steps.concat(campaignData.steps);
        accountData.leads = accountData.leads.concat(campaignData.leads);
        accountData.replies = accountData.replies.concat(campaignData.replies);
        accountData.activities = accountData.activities.concat(campaignData.activities);
        accountData.meetings = accountData.meetings.concat(campaignData.meetings);
        
      } catch (error: any) {
        console.log(`ERROR processing campaign ${campaign.name}: ${error.message}`);
      }
      
      await this.delay(CONFIG.REQUEST_DELAY);
    }
    
    return accountData;
  }

  private async processCampaign(campaign: LemlistCampaign, accountId: string, apiKey: string): Promise<{
    overview: any;
    steps: any[];
    leads: any[];
    replies: any[];
    activities: any[];
    meetings: any[];
  }> {
    const campaignId = campaign._id;
    const campaignName = campaign.name;
    
    console.log(`Processing campaign: ${campaignName} (ID: ${campaignId})`);
    
    const data = {
      overview: null as any,
      steps: [] as any[],
      leads: [] as any[],
      replies: [] as any[],
      activities: [] as any[],
      meetings: [] as any[]
    };
    
    // Fetch all activities for this campaign
    console.log(`Fetching activities for campaign: ${campaignId}`);
    const allActivities = await this.getActivities(campaignId, apiKey);
    console.log(`Found ${allActivities.length} activities`);
    
    if (allActivities.length > 0) {
      console.log(`Sample activity types: ${allActivities.slice(0, 5).map(a => a.type).join(', ')}`);
    }
    
    // Calculate unique leads from activities
    const uniqueLeadIds = new Set<string>();
    const activeLeadIds = new Set<string>();
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
    
    console.log(`Calculated from activities - Total Leads: ${totalLeadsCount}, Active: ${activeLeadsCount}`);
    
    // Fetch leads data
    const leads = await this.getLeads(campaignId, apiKey);
    
    const leadMap: { [email: string]: LemlistLead } = {};
    leads.forEach(lead => {
      leadMap[lead.email] = lead;
    });
    
    // Fetch reply content
    const repliesWithContent = await this.fetchReplyContent(allActivities, campaignId, apiKey);
    
    // Process all activities to generate metrics
    const processed = this.processActivities(allActivities, campaignId, campaignName, accountId, leadMap, repliesWithContent);
    
    console.log(`Processed metrics - Total Sent: ${processed.metrics.totalEmailsSent}, Unique Leads: ${processed.metrics.uniqueLeadsEmailed.size}`);
    
    // Calculate campaign overview
    data.overview = this.calculateCampaignOverview(
      campaign, 
      accountId, 
      totalLeadsCount,
      activeLeadsCount,
      processed.metrics,
      processed.teamInfo
    );
    
    data.steps = processed.stepMetrics;
    data.leads = processed.leadSummaries;
    data.replies = processed.replies;
    data.activities = processed.activityLog;
    data.meetings = processed.meetings;
    
    return data;
  }

  private processActivities(
    activities: LemlistActivity[], 
    campaignId: string, 
    campaignName: string, 
    accountId: string, 
    leadMap: { [email: string]: LemlistLead }, 
    repliesMap: { [activityId: string]: { content: string; fullData: any } }
  ) {
    // This is a complex function that processes all activities
    // I'll implement the core logic similar to your Google Apps Script
    
    const metrics = {
      totalEmailsSent: 0,
      uniqueLeadsEmailed: new Set<string>(),
      emailOpens: new Set<string>(),
      emailClicks: new Set<string>(),
      emailReplies: new Set<string>(),
      emailBounces: new Set<string>(),
      emailFails: new Set<string>(),
      unsubscribes: new Set<string>(),
      interested: new Set<string>(),
      notInterested: new Set<string>(),
      meetingsBooked: new Set<string>()
    };
    
    const stepMetrics: { [step: number]: any } = {};
    const leadMetrics: { [email: string]: any } = {};
    const leadReplyCounts: { [email: string]: number } = {};
    const replies: any[] = [];
    const meetings: any[] = [];
    const activityLog: any[] = [];
    
    let teamInfo = { teamId: '', senderName: '', senderEmail: '' };
    
    // Sort activities by creation date
    activities.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    activities.forEach(activity => {
      const type = activity.type;
      const leadId = activity.leadId || '';
      const leadEmail = activity.leadEmail || '';
      const step = activity.sequenceStep || 0;
      const isBot = activity.bot || false;
      
      // Set team info if not already set
      if (!teamInfo.teamId && activity.teamId) {
        teamInfo = {
          teamId: activity.teamId || '',
          senderName: activity.sendUserName || '',
          senderEmail: activity.sendUserEmail || ''
        };
      }
      
      // Initialize step metrics if not exists
      if (!stepMetrics[step]) {
        stepMetrics[step] = {
          sent: new Set<string>(),
          opens: new Set<string>(),
          clicks: new Set<string>(),
          replies: new Set<string>(),
          bounces: new Set<string>(),
          fails: new Set<string>()
        };
      }
      
      // Initialize lead metrics if not exists
      if (leadEmail && !leadMetrics[leadEmail]) {
        const lead = leadMap[leadEmail] || {};
        leadMetrics[leadEmail] = {
          leadEmail: leadEmail,
          leadName: this.getLeadName(activity, lead),
          companyName: this.getCompanyName(activity, lead),
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
      
      // Update lead metrics
      if (leadEmail && leadMetrics[leadEmail]) {
        const lm = leadMetrics[leadEmail];
        lm.totalActivities++;
        lm.lastActivityDate = activity.createdAt;
        lm.lastActivityType = type;
      }
      
      // Process activity by type
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
          replies.push(this.createReplyRecord(activity, campaignId, campaignName, accountId, leadMap, repliesMap, isFirstReply));
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
          meetings.push(this.createMeetingRecord(activity, campaignId, campaignName, accountId, leadMap));
          break;
      }
      
      activityLog.push(this.createActivityLogRecord(activity, campaignId, campaignName, accountId));
    });
    
    // Convert step metrics to array format
    const stepMetricsArray: any[] = [];
    Object.keys(stepMetrics).sort((a, b) => parseInt(a) - parseInt(b)).forEach(step => {
      const sm = stepMetrics[parseInt(step)];
      const sent = sm.sent.size;
      const opens = sm.opens.size;
      const clicks = sm.clicks.size;
      const replies = sm.replies.size;
      const bounces = sm.bounces.size;
      const fails = sm.fails.size;
      
      const openRate = sent > 0 ? ((opens / sent) * 100).toFixed(2) : '0';
      const ctr = opens > 0 ? ((clicks / opens) * 100).toFixed(2) : '0';
      const replyRate = sent > 0 ? ((replies / sent) * 100).toFixed(2) : '0';
      
      stepMetricsArray.push({
        accountId, 
        campaignId, 
        campaignName, 
        stepNumber: parseInt(step), 
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
    
    // Convert lead metrics to array format
    const leadSummaries = Object.values(leadMetrics).map((lm: any) => ({
      accountId, 
      campaignId, 
      campaignName, 
      leadEmail: lm.leadEmail, 
      leadName: lm.leadName,
      companyName: lm.companyName, 
      phone: lm.phone, 
      status: lm.status,
      addedDate: lm.addedDate, 
      lastActivityDate: lm.lastActivityDate, 
      lastActivityType: lm.lastActivityType,
      emailsSent: lm.emailsSent, 
      opens: lm.opens, 
      clicks: lm.clicks, 
      replies: lm.replies, 
      bounces: lm.bounces,
      totalActivities: lm.totalActivities, 
      isInterested: lm.isInterested, 
      isReplied: lm.isReplied, 
      isBounced: lm.isBounced, 
      isUnsubscribed: lm.isUnsubscribed
    }));
    
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

  private getLeadName(activity: LemlistActivity, lead: LemlistLead): string {
    const firstName = activity.leadFirstName || lead.firstName || '';
    const lastName = activity.leadLastName || lead.lastName || '';
    return (firstName + ' ' + lastName).trim() || 'N/A';
  }

  private getCompanyName(activity: LemlistActivity, lead: LemlistLead): string {
    return activity.leadCompanyName || 
           lead.companyName || 
           lead.company || 
           (lead.customVariables && lead.customVariables.company) ||
           (lead.customVariables && lead.customVariables.companyName) ||
           'N/A';
  }

  private createReplyRecord(
    activity: LemlistActivity, 
    campaignId: string, 
    campaignName: string, 
    accountId: string, 
    leadMap: { [email: string]: LemlistLead }, 
    repliesMap: { [activityId: string]: { content: string; fullData: any } }, 
    isFirstReply: boolean
  ) {
    const leadEmail = activity.leadEmail || 'N/A';
    const lead = leadMap[leadEmail] || {};
    const activityId = activity._id;
    
    let replyContent = '';
    if (repliesMap && repliesMap[activityId]) {
      replyContent = repliesMap[activityId].content || '';
    }
    
    if (!replyContent) {
      replyContent = activity.body || (activity.metaData && activity.metaData.body) || '';
    }
    
    const responseTime = this.calculateResponseTime(activity.createdAt, activity.relatedSentAt);
    
    return {
      accountId,
      campaignId,
      campaignName,
      replyDate: activity.createdAt || '',
      replyType: activity.type,
      leadEmail,
      leadName: this.getLeadName(activity, lead),
      companyName: this.getCompanyName(activity, lead),
      phone: activity.leadPhone || lead.phone || '',
      stepNumber: activity.sequenceStep || 0,
      senderName: activity.sendUserName || '',
      replyContent,
      isBot: activity.bot || false,
      isFirstReply,
      originalMessageDate: activity.relatedSentAt || '',
      responseTime,
      replyId: activityId
    };
  }

  private createMeetingRecord(
    activity: LemlistActivity, 
    campaignId: string, 
    campaignName: string, 
    accountId: string, 
    leadMap: { [email: string]: LemlistLead }
  ) {
    const leadEmail = activity.leadEmail || 'N/A';
    const lead = leadMap[leadEmail] || {};
    
    const bookingDate = new Date(activity.createdAt);
    // Note: In real implementation, you'd need to extract meetingDate from activity metadata
    const meetingDate = bookingDate; // Placeholder
    const daysToBook = Math.round((meetingDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      accountId,
      campaignId,
      campaignName,
      leadEmail,
      leadName: this.getLeadName(activity, lead),
      companyName: this.getCompanyName(activity, lead),
      meetingType: 'N/A', // Would need to extract from metadata
      meetingDate: meetingDate.toISOString(),
      bookingDate: activity.createdAt || '',
      stepNumber: activity.sequenceStep || 0,
      daysToBook
    };
  }

  private createActivityLogRecord(
    activity: LemlistActivity, 
    campaignId: string, 
    campaignName: string, 
    accountId: string
  ) {
    let additionalData = '';
    
    if (activity.location) additionalData = 'URL: ' + activity.location;
    if (activity.conditionLabel) additionalData = 'Condition: ' + activity.conditionLabel + ' = ' + activity.conditionValue;
    if (activity.note) additionalData = 'Note: ' + activity.note;
    
    return {
      activityId: activity._id || '',
      accountId,
      campaignId,
      campaignName,
      activityType: activity.type || '',
      activityDate: activity.createdAt || '',
      leadEmail: activity.leadEmail || '',
      leadName: this.getLeadName(activity, {} as any),
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

  private calculateResponseTime(replyDate?: string, sentDate?: string): string {
    if (!replyDate || !sentDate) return '0';
    
    try {
      const reply = new Date(replyDate);
      const sent = new Date(sentDate);
      const hours = (reply.getTime() - sent.getTime()) / (1000 * 60 * 60);
      return hours.toFixed(2);
    } catch (error) {
      return '0';
    }
  }

  private calculateCampaignOverview(
    campaign: LemlistCampaign, 
    accountId: string, 
    totalLeadsCount: number, 
    activeLeadsCount: number, 
    metrics: any, 
    teamInfo: any
  ) {
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
    
    const emailOpenRate = uniqueLeadsEmailed > 0 ? ((emailOpens / uniqueLeadsEmailed) * 100).toFixed(2) : '0';
    const emailCTR = emailOpens > 0 ? ((emailClicks / emailOpens) * 100).toFixed(2) : '0';
    const emailReplyRate = uniqueLeadsEmailed > 0 ? ((emailReplies / uniqueLeadsEmailed) * 100).toFixed(2) : '0';
    const emailBounceRate = uniqueLeadsEmailed > 0 ? ((emailBounces / uniqueLeadsEmailed) * 100).toFixed(2) : '0';
    
    const meetingsBooked = metrics.meetingsBooked.size;
    const interested = metrics.interested.size;
    const notInterested = metrics.notInterested.size;
    
    const isArchived = (campaign.archived === true) ? 'Yes' : 'No';
    
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
      emailOpenRate,
      emailClicks,
      emailCTR,
      emailReplies,
      emailReplyRate,
      emailBounces,
      emailBounceRate,
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
}

export const lemlistService = new LemlistService();