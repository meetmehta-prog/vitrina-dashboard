import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { repliesDetail } from '@/lib/schema';
import { ReplyTimelineData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const replyData = await db.select().from(repliesDetail);

    if (replyData.length === 0) {
      return NextResponse.json([]);
    }

    const timelineMap: { [dateKey: string]: {
      date: string;
      totalReplies: number;
      firstReplies: number;
      repeatReplies: number;
    } } = {};

    replyData.forEach(row => {
      if (!row.replyDate) return;
      
      const replyDate = new Date(row.replyDate);
      if (isNaN(replyDate.getTime())) return;
      
      const dateKey = replyDate.toISOString().split('T')[0];
      
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = {
          date: dateKey,
          totalReplies: 0,
          firstReplies: 0,
          repeatReplies: 0
        };
      }
      
      timelineMap[dateKey].totalReplies++;
      if (row.isFirstReply) {
        timelineMap[dateKey].firstReplies++;
      } else {
        timelineMap[dateKey].repeatReplies++;
      }
    });

    const timelineData: ReplyTimelineData[] = Object.values(timelineMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json(timelineData);

  } catch (error: any) {
    console.error('Error in getReplyTimeline: ' + error.message);
    return NextResponse.json({
      error: 'Failed to fetch reply timeline',
      message: error.message
    }, { status: 500 });
  }
}