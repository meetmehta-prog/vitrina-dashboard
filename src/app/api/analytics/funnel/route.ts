import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/schema';
import { FunnelData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const campaignData = await db.select().from(campaigns);

    if (campaignData.length === 0) {
      const emptyFunnel: FunnelData = {
        emailsSent: 0,
        opens: 0,
        clicks: 0,
        replies: 0,
        meetings: 0
      };
      return NextResponse.json(emptyFunnel);
    }

    // Calculate totals
    let totalEmailsSent = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalReplies = 0;
    let totalMeetings = 0;
    let avgOpenRate = 0;
    let avgCTR = 0;

    campaignData.forEach(row => {
      totalEmailsSent += row.totalEmailsSent || 0;
      totalReplies += row.emailReplies || 0;
      totalMeetings += row.meetingsBooked || 0;
      avgOpenRate += parseFloat(row.emailOpenRate || '0');
      avgCTR += parseFloat(row.emailCTR || '0');
    });

    // Calculate averages
    avgOpenRate = avgOpenRate / campaignData.length;
    avgCTR = avgCTR / campaignData.length;

    // Calculate funnel metrics
    const estimatedOpens = Math.round(totalEmailsSent * (avgOpenRate / 100));
    const estimatedClicks = Math.round(estimatedOpens * (avgCTR / 100));

    const funnelData: FunnelData = {
      emailsSent: totalEmailsSent,
      opens: estimatedOpens,
      clicks: estimatedClicks,
      replies: totalReplies,
      meetings: totalMeetings
    };

    return NextResponse.json(funnelData);

  } catch (error: any) {
    console.error('Error in getFunnelData: ' + error.message);
    return NextResponse.json({
      error: 'Failed to fetch funnel data',
      message: error.message
    }, { status: 500 });
  }
}