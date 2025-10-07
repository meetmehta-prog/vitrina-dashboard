import { db } from '../src/lib/db';
import { lemlistService } from '../src/lib/lemlist';
import {
  campaigns,
  stepPerformance,
  leadEngagement,
  repliesDetail,
  allActivities,
  meetingBookings,
  dataSyncLog
} from '../src/lib/schema';
import { eq } from 'drizzle-orm';

async function syncData() {
  const startTime = new Date();
  console.log('🚀 Starting Lemlist data sync...');
  console.log('='.repeat(80));

  try {
    // Create sync log entry
    const [syncLog] = await db.insert(dataSyncLog).values({
      syncType: 'full',
      startTime,
      status: 'running'
    }).returning();

    // Fetch all data from Lemlist
    console.log('📡 Fetching data from Lemlist API...');
    const allAccountsData = await lemlistService.processAllAccounts();

    // Clear existing data
    console.log('🗑️  Clearing old data...');
    await db.delete(campaigns);
    await db.delete(stepPerformance);
    await db.delete(leadEngagement);
    await db.delete(repliesDetail);
    await db.delete(allActivities);
    await db.delete(meetingBookings);

    let totalRecords = 0;

    // Insert campaign overview data
    if (allAccountsData.overview.length > 0) {
      const campaignData = allAccountsData.overview.map(row => ({
        accountId: row.accountId,
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        status: row.status,
        isArchived: row.isArchived === 'Yes',
        createdDate: row.createdDate ? new Date(row.createdDate) : null,
        totalLeads: row.totalLeads || 0,
        activeLeads: row.activeLeads || 0,
        completedLeads: row.completedLeads || 0,
        totalEmailsSent: row.totalEmailsSent || 0,
        uniqueLeadsEmailed: row.uniqueLeadsEmailed || 0,
        emailsDelivered: row.emailsDelivered || 0,
        emailOpens: row.emailOpens || 0,
        emailOpenRate: row.emailOpenRate?.toString() || '0',
        emailClicks: row.emailClicks || 0,
        emailCTR: row.emailCTR?.toString() || '0',
        emailReplies: row.emailReplies || 0,
        emailReplyRate: row.emailReplyRate?.toString() || '0',
        emailBounces: row.emailBounces || 0,
        emailBounceRate: row.emailBounceRate?.toString() || '0',
        emailFails: row.emailFails || 0,
        unsubscribes: row.unsubscribes || 0,
        meetingsBooked: row.meetingsBooked || 0,
        interested: row.interested || 0,
        notInterested: row.notInterested || 0,
        teamId: row.teamId,
        senderName: row.senderName,
        senderEmail: row.senderEmail
      }));

      await db.insert(campaigns).values(campaignData);
      totalRecords += campaignData.length;
      console.log(`✅ Inserted ${campaignData.length} campaigns`);
    }

    // Insert step performance data
    if (allAccountsData.steps.length > 0) {
      const stepData = allAccountsData.steps.map(row => ({
        accountId: row.accountId,
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        stepNumber: row.stepNumber || 0,
        stepType: row.stepType || 'Email',
        uniqueLeadsSent: row.uniqueLeadsSent || 0,
        opens: row.opens || 0,
        openRate: row.openRate?.toString() || '0',
        clicks: row.clicks || 0,
        ctr: row.ctr?.toString() || '0',
        replies: row.replies || 0,
        replyRate: row.replyRate?.toString() || '0',
        bounces: row.bounces || 0,
        fails: row.fails || 0
      }));

      await db.insert(stepPerformance).values(stepData);
      totalRecords += stepData.length;
      console.log(`✅ Inserted ${stepData.length} step performance records`);
    }

    // Insert lead engagement data
    if (allAccountsData.leads.length > 0) {
      const leadData = allAccountsData.leads.map(row => ({
        accountId: row.accountId,
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        leadEmail: row.leadEmail,
        leadName: row.leadName,
        companyName: row.companyName,
        phone: row.phone,
        status: row.status || 'active',
        addedDate: row.addedDate ? new Date(row.addedDate) : null,
        lastActivityDate: row.lastActivityDate ? new Date(row.lastActivityDate) : null,
        lastActivityType: row.lastActivityType,
        emailsSent: row.emailsSent || 0,
        opens: row.opens || 0,
        clicks: row.clicks || 0,
        replies: row.replies || 0,
        bounces: row.bounces || 0,
        totalActivities: row.totalActivities || 0,
        isInterested: row.isInterested || false,
        isReplied: row.isReplied || false,
        isBounced: row.isBounced || false,
        isUnsubscribed: row.isUnsubscribed || false
      }));

      await db.insert(leadEngagement).values(leadData);
      totalRecords += leadData.length;
      console.log(`✅ Inserted ${leadData.length} lead engagement records`);
    }

    // Insert replies data
    if (allAccountsData.replies.length > 0) {
      const replyData = allAccountsData.replies.map(row => ({
        accountId: row.accountId,
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        replyDate: row.replyDate ? new Date(row.replyDate) : null,
        replyType: row.replyType,
        leadEmail: row.leadEmail,
        leadName: row.leadName,
        companyName: row.companyName,
        phone: row.phone,
        stepNumber: row.stepNumber,
        senderName: row.senderName,
        replyContent: row.replyContent,
        isBot: row.isBot || false,
        isFirstReply: row.isFirstReply || false,
        originalMessageDate: row.originalMessageDate ? new Date(row.originalMessageDate) : null,
        responseTime: row.responseTime?.toString(),
        replyId: row.replyId
      }));

      await db.insert(repliesDetail).values(replyData);
      totalRecords += replyData.length;
      console.log(`✅ Inserted ${replyData.length} reply records`);
    }

    // Insert activities data in batches
    if (allAccountsData.activities.length > 0) {
      const activityData = allAccountsData.activities.map(row => ({
        activityId: row.activityId,
        accountId: row.accountId,
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        activityType: row.activityType,
        activityDate: row.activityDate ? new Date(row.activityDate) : null,
        leadEmail: row.leadEmail,
        leadName: row.leadName,
        companyName: row.companyName,
        stepNumber: row.stepNumber,
        senderName: row.senderName,
        isFirst: row.isFirst || false,
        stoppedSequence: row.stoppedSequence || false,
        isBot: row.isBot || false,
        errorMessage: row.errorMessage,
        additionalData: row.additionalData
      }));

      const batchSize = 500;
      let insertedCount = 0;

      for (let i = 0; i < activityData.length; i += batchSize) {
        const batch = activityData.slice(i, i + batchSize);
        try {
          await db.insert(allActivities).values(batch);
          insertedCount += batch.length;
          console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} activities (${insertedCount}/${activityData.length})`);
        } catch (error: any) {
          console.error(`❌ Failed batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        }
      }

      totalRecords += insertedCount;
    }

    // Insert meetings data
    if (allAccountsData.meetings.length > 0) {
      const meetingData = allAccountsData.meetings.map(row => ({
        accountId: row.accountId,
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        leadEmail: row.leadEmail,
        leadName: row.leadName,
        companyName: row.companyName,
        meetingType: row.meetingType,
        meetingDate: row.meetingDate ? new Date(row.meetingDate) : null,
        bookingDate: row.bookingDate ? new Date(row.bookingDate) : null,
        stepNumber: row.stepNumber,
        daysToBook: row.daysToBook
      }));

      await db.insert(meetingBookings).values(meetingData);
      totalRecords += meetingData.length;
      console.log(`✅ Inserted ${meetingData.length} meeting records`);
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

    // Update sync log
    await db.update(dataSyncLog)
      .set({
        endTime,
        status: 'completed',
        recordsProcessed: totalRecords
      })
      .where(eq(dataSyncLog.id, syncLog.id));

    console.log('='.repeat(80));
    console.log('✅ SYNC COMPLETED SUCCESSFULLY');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📊 Total Records: ${totalRecords}`);
    console.log('='.repeat(80));

    process.exit(0);

  } catch (error: any) {
    console.error('❌ SYNC FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncData();
