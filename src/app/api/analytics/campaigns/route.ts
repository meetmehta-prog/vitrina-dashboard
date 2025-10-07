import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, stepPerformance } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { CampaignPerformanceData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const [campaignData, stepData] = await Promise.all([
      db.select().from(campaigns),
      db.select().from(stepPerformance)
    ]);

    // Group step metrics by campaign
    const campaignStepMetrics: { [campaignId: string]: { totalOpens: number; totalClicks: number } } = {};
    
    stepData.forEach(row => {
      const campaignId = row.campaignId;
      
      if (!campaignStepMetrics[campaignId]) {
        campaignStepMetrics[campaignId] = {
          totalOpens: 0,
          totalClicks: 0
        };
      }
      
      campaignStepMetrics[campaignId].totalOpens += row.opens || 0;
      campaignStepMetrics[campaignId].totalClicks += row.clicks || 0;
    });

    const campaignPerformance: CampaignPerformanceData[] = campaignData.map(row => {
      const campaignId = row.campaignId;
      const stepMetrics = campaignStepMetrics[campaignId] || { totalOpens: 0, totalClicks: 0 };
      
      return {
        campaignId,
        campaignName: row.campaignName,
        accountId: row.accountId,
        status: row.status || undefined,
        isArchived: row.isArchived || undefined,
        leads: row.totalLeads || 0,
        emailsSent: row.totalEmailsSent || 0,
        opens: stepMetrics.totalOpens,
        clicks: stepMetrics.totalClicks,
        replies: row.emailReplies || 0,
        meetings: row.meetingsBooked || 0,
        openRate: parseFloat(row.emailOpenRate || '0'),
        replyRate: parseFloat(row.emailReplyRate || '0'),
        bounceRate: parseFloat(row.emailBounceRate || '0')
      };
    });

    return NextResponse.json(campaignPerformance);

  } catch (error: any) {
    console.error('Error in getCampaignPerformance: ' + error.message);
    return NextResponse.json({
      error: 'Failed to fetch campaign performance',
      message: error.message
    }, { status: 500 });
  }
}