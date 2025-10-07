import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { allActivities } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { RecentActivity } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const activityData = await db
      .select()
      .from(allActivities)
      .orderBy(desc(allActivities.activityDate))
      .limit(limit);

    const recentActivities: RecentActivity[] = activityData
      .filter(row => row.activityDate) // Only include activities with valid dates
      .map(row => ({
        type: row.activityType,
        date: row.activityDate!.toISOString(),
        leadEmail: row.leadEmail || '',
        leadName: row.leadName || '',
        campaignName: row.campaignName,
        step: row.stepNumber || undefined
      }));

    return NextResponse.json(recentActivities);

  } catch (error: any) {
    console.error('Error in getRecentActivities: ' + error.message);
    return NextResponse.json({
      error: 'Failed to fetch recent activities',
      message: error.message
    }, { status: 500 });
  }
}