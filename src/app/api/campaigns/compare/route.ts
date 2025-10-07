import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, stepPerformance } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { campaignIds } = await request.json();

    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      return NextResponse.json({ error: 'campaignIds array is required' }, { status: 400 });
    }

    if (campaignIds.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 campaigns can be compared' }, { status: 400 });
    }

    const [campaignData, stepData] = await Promise.all([
      db.select().from(campaigns).where(inArray(campaigns.campaignId, campaignIds)),
      db.select().from(stepPerformance).where(inArray(stepPerformance.campaignId, campaignIds)),
    ]);

    if (campaignData.length === 0) {
      return NextResponse.json({ error: 'No campaigns found' }, { status: 404 });
    }

    const formattedCampaigns = campaignData.map(campaign => {
      const campaignSteps = stepData.filter(step => step.campaignId === campaign.campaignId);
      
      return {
        id: campaign.campaignId,
        name: campaign.campaignName || '',
        overview: {
          totalLeads: campaign.totalLeads || 0,
          totalEmailsSent: campaign.totalEmailsSent || 0,
          uniqueLeadsEmailed: campaign.uniqueLeadsEmailed || 0,
          emailOpens: campaign.emailOpens || 0,
          emailOpenRate: parseFloat(campaign.emailOpenRate?.toString() || '0'),
          emailClicks: campaign.emailClicks || 0,
          emailCTR: parseFloat(campaign.emailCTR?.toString() || '0'),
          emailReplies: campaign.emailReplies || 0,
          emailReplyRate: parseFloat(campaign.emailReplyRate?.toString() || '0'),
          emailBounceRate: parseFloat(campaign.emailBounceRate?.toString() || '0'),
          meetingsBooked: campaign.meetingsBooked || 0,
        },
        steps: campaignSteps.map(step => ({
          step: step.stepNumber?.toString() || '',
          uniqueLeadsSent: step.uniqueLeadsSent || 0,
          opens: step.opens || 0,
          openRate: parseFloat(step.openRate?.toString() || '0'),
          clicks: step.clicks || 0,
          ctr: parseFloat(step.ctr?.toString() || '0'),
          replies: step.replies || 0,
          replyRate: parseFloat(step.replyRate?.toString() || '0'),
        }))
      };
    });

    const insights = generateInsights(formattedCampaigns);

    return NextResponse.json({
      campaigns: formattedCampaigns,
      insights,
    });
  } catch (error) {
    console.error('Error fetching campaign comparison:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateInsights(campaigns: any[]) {
  const insights = [];
  
  const bestReplyRate = campaigns.reduce((best, current) => 
    current.overview.emailReplyRate > best.overview.emailReplyRate ? current : best
  );
  
  const bestOpenRate = campaigns.reduce((best, current) => 
    current.overview.emailOpenRate > best.overview.emailOpenRate ? current : best
  );
  
  const bestMeetingRate = campaigns.reduce((best, current) => {
    const currentRate = (current.overview.meetingsBooked / current.overview.totalLeads) * 100;
    const bestRate = (best.overview.meetingsBooked / best.overview.totalLeads) * 100;
    return currentRate > bestRate ? current : best;
  });

  insights.push({
    type: 'success',
    title: '🏆 Best Reply Rate',
    message: `${bestReplyRate.name} has the highest reply rate at ${bestReplyRate.overview.emailReplyRate.toFixed(1)}%`
  });

  insights.push({
    type: 'info',
    title: '👀 Best Open Rate',
    message: `${bestOpenRate.name} has the highest open rate at ${bestOpenRate.overview.emailOpenRate.toFixed(1)}%`
  });

  insights.push({
    type: 'warning',
    title: '📅 Best Meeting Conversion',
    message: `${bestMeetingRate.name} has the best meeting conversion rate`
  });

  return insights;
}