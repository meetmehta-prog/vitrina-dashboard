import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { allActivities } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const activities = await db
      .select()
      .from(allActivities)
      .where(eq(allActivities.campaignId, campaignId));

    const openRates: { [day: string]: { [hour: number]: number } } = {};
    const replyRates: { [day: string]: { [hour: number]: number } } = {};
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach(day => {
      openRates[day] = {};
      replyRates[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        openRates[day][hour] = 0;
        replyRates[day][hour] = 0;
      }
    });

    const hourCounts: { [key: string]: { opens: number; sent: number; replies: number } } = {};

    activities.forEach(activity => {
      if (!activity.activityDate) return;

      const date = new Date(activity.activityDate);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      const key = `${dayName}-${hour}`;

      if (!hourCounts[key]) {
        hourCounts[key] = { opens: 0, sent: 0, replies: 0 };
      }

      if (activity.activityType === 'sent') {
        hourCounts[key].sent++;
      } else if (activity.activityType === 'opened' || activity.activityType === 'emailsOpened') {
        hourCounts[key].opens++;
      } else if (activity.activityType === 'replied' || activity.activityType === 'emailsReplied') {
        hourCounts[key].replies++;
      }
    });

    Object.keys(hourCounts).forEach(key => {
      const [dayName, hourStr] = key.split('-');
      const hour = parseInt(hourStr);
      const data = hourCounts[key];

      if (days.includes(dayName) && hour >= 0 && hour < 24) {
        openRates[dayName][hour] = data.sent > 0 ? (data.opens / data.sent) * 100 : 0;
        replyRates[dayName][hour] = data.sent > 0 ? (data.replies / data.sent) * 100 : 0;
      }
    });

    return NextResponse.json({
      openRates,
      replyRates,
    });
  } catch (error) {
    console.error('Error fetching time performance data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}