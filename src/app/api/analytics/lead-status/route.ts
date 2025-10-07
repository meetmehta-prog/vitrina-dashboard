import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadEngagement } from '@/lib/schema';
import { LeadStatusBreakdown } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const leadData = await db.select().from(leadEngagement);

    const statusMap: LeadStatusBreakdown = {
      active: 0,
      bounced: 0,
      unsubscribed: 0,
      not_interested: 0,
      replied: 0,
      interested: 0
    };

    leadData.forEach(row => {
      const status = row.status;
      const isReplied = row.isReplied;
      const isInterested = row.isInterested;
      
      // Count by status
      if (status && status in statusMap) {
        (statusMap as any)[status]++;
      }
      
      // Count additional flags
      if (isReplied) {
        statusMap.replied++;
      }
      if (isInterested) {
        statusMap.interested++;
      }
    });

    return NextResponse.json(statusMap);

  } catch (error: any) {
    console.error('Error in getLeadStatusBreakdown: ' + error.message);
    return NextResponse.json({
      error: 'Failed to fetch lead status breakdown',
      message: error.message
    }, { status: 500 });
  }
}