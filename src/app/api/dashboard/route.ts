import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  campaigns, 
  stepPerformance, 
  leadEngagement, 
  repliesDetail, 
  allActivities, 
  meetingBookings 
} from '@/lib/schema';
import { DashboardData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Fetch all data from database
    const [
      campaignData,
      stepData,
      leadData,
      replyData,
      activityData,
      meetingData
    ] = await Promise.all([
      db.select().from(campaigns),
      db.select().from(stepPerformance),
      db.select().from(leadEngagement),
      db.select().from(repliesDetail),
      db.select().from(allActivities),
      db.select().from(meetingBookings)
    ]);

    const dashboardData: DashboardData = {
      overview: campaignData as any,
      steps: stepData as any,
      leads: leadData as any,
      replies: replyData as any,
      activities: activityData as any,
      meetings: meetingData as any,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(dashboardData);

  } catch (error: any) {
    console.error('Error fetching dashboard data: ' + error.message);
    return NextResponse.json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    }, { status: 500 });
  }
}