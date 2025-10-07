import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stepPerformance } from '@/lib/schema';
import { StepPerformanceData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const stepData = await db.select().from(stepPerformance);

    if (stepData.length === 0) {
      return NextResponse.json([]);
    }

    // Group by step number
    const stepMap: { [stepNum: number]: {
      step: number;
      totalSent: number;
      totalOpens: number;
      totalClicks: number;
      totalReplies: number;
      totalBounces: number;
      campaigns: number;
    } } = {};

    stepData.forEach(row => {
      const stepNum = row.stepNumber;
      
      if (!stepMap[stepNum]) {
        stepMap[stepNum] = {
          step: stepNum,
          totalSent: 0,
          totalOpens: 0,
          totalClicks: 0,
          totalReplies: 0,
          totalBounces: 0,
          campaigns: 0
        };
      }
      
      stepMap[stepNum].totalSent += row.uniqueLeadsSent || 0;
      stepMap[stepNum].totalOpens += row.opens || 0;
      stepMap[stepNum].totalClicks += row.clicks || 0;
      stepMap[stepNum].totalReplies += row.replies || 0;
      stepMap[stepNum].totalBounces += row.bounces || 0;
      stepMap[stepNum].campaigns++;
    });

    const stepPerformanceData: StepPerformanceData[] = Object.values(stepMap).map(step => {
      const remainingLeads = step.totalSent - step.totalBounces - step.totalReplies;
      
      return {
        step: step.step,
        sent: step.totalSent,
        openRate: step.totalSent > 0 ? ((step.totalOpens / step.totalSent) * 100).toFixed(2) : '0',
        clickRate: step.totalOpens > 0 ? ((step.totalClicks / step.totalOpens) * 100).toFixed(2) : '0',
        replyRate: step.totalSent > 0 ? ((step.totalReplies / step.totalSent) * 100).toFixed(2) : '0',
        remainingLeads: Math.max(0, remainingLeads)
      };
    });

    // Sort by step number
    stepPerformanceData.sort((a, b) => a.step - b.step);

    return NextResponse.json(stepPerformanceData);

  } catch (error: any) {
    console.error('Error in getStepPerformanceData: ' + error.message);
    return NextResponse.json({
      error: 'Failed to fetch step performance data',
      message: error.message
    }, { status: 500 });
  }
}