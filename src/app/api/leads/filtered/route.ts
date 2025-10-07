import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadEngagement, campaigns } from '@/lib/schema';
import { eq, gt, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('type');
    const campaignId = searchParams.get('campaignId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    let whereConditions = [];
    
    // Add campaign filter if specified
    if (campaignId && campaignId !== 'undefined' && campaignId !== 'null') {
      whereConditions.push(eq(leadEngagement.campaignId, campaignId));
    }

    // Add filter type conditions
    switch (filterType) {
      case 'opened':
        whereConditions.push(gt(leadEngagement.opens, 0));
        break;
      case 'clicked':
        whereConditions.push(gt(leadEngagement.clicks, 0));
        break;
      case 'replied':
        whereConditions.push(gt(leadEngagement.replies, 0));
        break;
      case 'bounced':
        whereConditions.push(eq(leadEngagement.isBounced, true));
        break;
      case 'all':
      default:
        // No additional filters for 'all'
        break;
    }

    // Get total count for pagination
    const totalLeads = await db
      .select({ count: leadEngagement.id })
      .from(leadEngagement)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Get paginated leads
    const offset = (page - 1) * pageSize;
    const leads = await db
      .select({
        id: leadEngagement.id,
        accountId: leadEngagement.accountId,
        campaignId: leadEngagement.campaignId,
        campaignName: leadEngagement.campaignName,
        leadEmail: leadEngagement.leadEmail,
        leadName: leadEngagement.leadName,
        companyName: leadEngagement.companyName,
        phone: leadEngagement.phone,
        status: leadEngagement.status,
        addedDate: leadEngagement.addedDate,
        lastActivityDate: leadEngagement.lastActivityDate,
        lastActivityType: leadEngagement.lastActivityType,
        emailsSent: leadEngagement.emailsSent,
        opens: leadEngagement.opens,
        clicks: leadEngagement.clicks,
        replies: leadEngagement.replies,
        bounces: leadEngagement.bounces,
        totalActivities: leadEngagement.totalActivities,
        isInterested: leadEngagement.isInterested,
        isReplied: leadEngagement.isReplied,
        isBounced: leadEngagement.isBounced,
        isUnsubscribed: leadEngagement.isUnsubscribed,
        lastUpdated: leadEngagement.lastUpdated
      })
      .from(leadEngagement)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(leadEngagement.lastActivityDate))
      .limit(pageSize)
      .offset(offset);

    const totalPages = Math.ceil(totalLeads.length / pageSize);

    return NextResponse.json({
      leads,
      pagination: {
        currentPage: page,
        totalPages,
        totalLeads: totalLeads.length,
        pageSize,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filterType,
      campaignId
    });

  } catch (error: any) {
    console.error('Error fetching filtered leads:', error);
    return NextResponse.json({
      error: 'Failed to fetch filtered leads',
      message: error.message
    }, { status: 500 });
  }
}