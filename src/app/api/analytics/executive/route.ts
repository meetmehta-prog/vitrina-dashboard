import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, stepPerformance } from '@/lib/schema';
import { ExecutiveMetrics } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const [campaignData, stepData] = await Promise.all([
      db.select().from(campaigns),
      db.select().from(stepPerformance)
    ]);

    if (campaignData.length === 0) {
      const emptyMetrics: ExecutiveMetrics = {
        totalCampaigns: 0,
        runningCampaigns: 0,
        completedCampaigns: 0,
        archivedCampaigns: 0,
        totalLeads: 0,
        totalEmailsSent: 0,
        totalReplies: 0,
        avgReplyRate: 0,
        totalMeetings: 0,
        avgOpenRate: 0,
        avgCTR: 0
      };
      return NextResponse.json(emptyMetrics);
    }

    let totalLeads = 0;
    let totalEmailsSent = 0;
    let totalUniqueEmailed = 0;
    let totalReplies = 0;
    let totalMeetings = 0;
    let runningCampaigns = 0;
    let completedCampaigns = 0;
    let archivedCampaigns = 0;

    let totalOpens = 0;
    let totalClicks = 0;

    // Calculate totals from step data
    stepData.forEach(row => {
      totalOpens += row.opens || 0;
      totalClicks += row.clicks || 0;
    });

    // Calculate totals from campaign data
    campaignData.forEach(row => {
      totalLeads += row.totalLeads || 0;
      totalEmailsSent += row.totalEmailsSent || 0;
      totalUniqueEmailed += row.uniqueLeadsEmailed || 0;
      totalReplies += row.emailReplies || 0;
      totalMeetings += row.meetingsBooked || 0;

      const status = (row.status || '').toLowerCase();
      const isArchived = row.isArchived;

      if (isArchived) {
        archivedCampaigns++;
      } else if (status === 'active' || status === 'running') {
        runningCampaigns++;
      } else if (status === 'ended' || status === 'completed' || status === 'paused') {
        completedCampaigns++;
      }
    });

    const avgOpenRate = totalEmailsSent > 0 ? ((totalOpens / totalEmailsSent) * 100) : 0;
    const avgCTR = totalOpens > 0 ? ((totalClicks / totalOpens) * 100) : 0;
    const avgReplyRate = totalUniqueEmailed > 0 ? ((totalReplies / totalUniqueEmailed) * 100) : 0;

    const metrics: ExecutiveMetrics = {
      totalCampaigns: campaignData.length,
      runningCampaigns,
      completedCampaigns,
      archivedCampaigns,
      totalLeads,
      totalEmailsSent,
      totalReplies,
      avgReplyRate: parseFloat(avgReplyRate.toFixed(2)),
      totalMeetings,
      avgOpenRate: parseFloat(avgOpenRate.toFixed(2)),
      avgCTR: parseFloat(avgCTR.toFixed(2))
    };

    return NextResponse.json(metrics);

  } catch (error: any) {
    console.error('Error in getExecutiveMetrics: ' + error.message);
    return NextResponse.json({
      error: 'Failed to fetch executive metrics',
      message: error.message
    }, { status: 500 });
  }
}