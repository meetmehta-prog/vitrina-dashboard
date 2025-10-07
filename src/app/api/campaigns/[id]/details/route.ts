import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, stepPerformance, leadEngagement, repliesDetail, allActivities, meetingBookings } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.campaignId, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const [steps, leads, replies, activities, meetings] = await Promise.all([
      db.select().from(stepPerformance).where(eq(stepPerformance.campaignId, campaignId)),
      db.select().from(leadEngagement).where(eq(leadEngagement.campaignId, campaignId)),
      db.select().from(repliesDetail).where(eq(repliesDetail.campaignId, campaignId)).orderBy(desc(repliesDetail.replyDate)),
      db.select().from(allActivities).where(eq(allActivities.campaignId, campaignId)).orderBy(desc(allActivities.activityDate)),
      db.select().from(meetingBookings).where(eq(meetingBookings.campaignId, campaignId)).orderBy(desc(meetingBookings.bookingDate)),
    ]);

    // Calculate metrics from all steps instead of just campaign totals
    const totalSent = steps.reduce((sum, step) => sum + (step.uniqueLeadsSent || 0), 0);
    const totalOpens = steps.reduce((sum, step) => sum + (step.opens || 0), 0);
    const totalClicks = steps.reduce((sum, step) => sum + (step.clicks || 0), 0);
    const totalReplies = steps.reduce((sum, step) => sum + (step.replies || 0), 0);

    const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
    const clickRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
    const replyRate = totalSent > 0 ? (totalReplies / totalSent) * 100 : 0;
    const meetingRate = (campaign.totalLeads || 0) > 0 ? ((campaign.meetingsBooked || 0) / (campaign.totalLeads || 1)) * 100 : 0;

    const metrics = {
      sent: totalSent,
      opens: totalOpens,
      openRate: parseFloat(openRate.toFixed(2)),
      clicks: totalClicks,
      clickRate: parseFloat(clickRate.toFixed(2)),
      replies: totalReplies,
      replyRate: parseFloat(replyRate.toFixed(2)),
      meetings: campaign.meetingsBooked || 0,
      meetingRate: parseFloat(meetingRate.toFixed(2)),
    };

    const formattedSteps = steps.map(step => ({
      step: step.stepNumber?.toString() || '',
      type: step.stepType || '',
      sent: step.uniqueLeadsSent || 0,
      opens: step.opens || 0,
      openRate: parseFloat(step.openRate?.toString() || '0'),
      clicks: step.clicks || 0,
      clickRate: parseFloat(step.ctr?.toString() || '0'),
      replies: step.replies || 0,
      replyRate: parseFloat(step.replyRate?.toString() || '0'),
      remaining: (step.uniqueLeadsSent || 0) - (step.replies || 0),
    }));

    const formattedLeads = leads.map(lead => ({
      name: lead.leadName || '',
      email: lead.leadEmail || '',
      company: lead.companyName || '',
      status: lead.status || '',
      sent: lead.emailsSent || 0,
      opens: lead.opens || 0,
      clicks: lead.clicks || 0,
      replies: lead.replies || 0,
      lastActivity: lead.lastActivityDate?.toISOString().split('T')[0] || '',
    }));

    const formattedReplies = replies.map(reply => ({
      date: reply.replyDate?.toISOString().split('T')[0] || '',
      lead: reply.leadName || '',
      company: reply.companyName || '',
      step: reply.stepNumber?.toString() || '',
      firstReply: reply.isFirstReply || false,
      responseTime: reply.responseTime?.toString() || '',
      content: reply.replyContent?.substring(0, 100) + '...' || '',
    }));

    const formattedActivities = activities.map(activity => ({
      date: activity.activityDate?.toISOString().split('T')[0] || '',
      type: activity.activityType || '',
      lead: activity.leadName || '',
      company: activity.companyName || '',
      step: activity.stepNumber?.toString() || '',
      details: activity.additionalData || '',
    }));

    const formattedMeetings = meetings.map(meeting => ({
      lead: meeting.leadName || '',
      company: meeting.companyName || '',
      type: meeting.meetingType || '',
      meetingDate: meeting.meetingDate?.toISOString().split('T')[0] || '',
      bookedDate: meeting.bookingDate?.toISOString().split('T')[0] || '',
      step: meeting.stepNumber?.toString() || '',
      daysToBook: meeting.daysToBook || 0,
    }));

    const campaignDetails = {
      id: campaign.campaignId,
      name: campaign.campaignName || '',
      status: campaign.status || '',
      createdAt: campaign.createdDate?.toISOString().split('T')[0] || '',
      sender: campaign.senderName || '',
      metrics,
      steps: formattedSteps,
      leads: formattedLeads,
      replies: formattedReplies,
      activities: formattedActivities,
      meetings: formattedMeetings,
    };

    return NextResponse.json(campaignDetails);
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}