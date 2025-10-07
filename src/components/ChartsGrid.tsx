'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartConfiguration,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  FunnelData,
  StepPerformanceData,
  ReplyTimelineData,
  LeadStatusBreakdown
} from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartsGridProps {
  funnelData: FunnelData | null;
  stepPerformanceData: StepPerformanceData[];
  replyTimelineData: ReplyTimelineData[];
  leadStatusData: LeadStatusBreakdown | null;
}

export default function ChartsGrid({
  funnelData,
  stepPerformanceData,
  replyTimelineData,
  leadStatusData
}: ChartsGridProps) {
  
  // Funnel Chart Data
  const funnelChartData = funnelData ? {
    labels: ['Emails Sent', 'Opens', 'Clicks', 'Replies', 'Meetings'],
    datasets: [{
      label: 'Conversion Funnel',
      data: [
        funnelData.emailsSent,
        funnelData.opens,
        funnelData.clicks,
        funnelData.replies,
        funnelData.meetings
      ],
      backgroundColor: [
        'rgba(102, 126, 234, 0.8)',
        'rgba(118, 75, 162, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(102, 126, 234)',
        'rgb(118, 75, 162)',
        'rgb(34, 197, 94)',
        'rgb(251, 191, 36)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2
    }]
  } : null;

  // Step Performance Chart Data
  const stepChartData = {
    labels: stepPerformanceData.map(step => `Step ${step.step}`),
    datasets: [
      {
        label: 'Open Rate %',
        data: stepPerformanceData.map(step => parseFloat(step.openRate)),
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: 'rgb(102, 126, 234)',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Reply Rate %',
        data: stepPerformanceData.map(step => parseFloat(step.replyRate)),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Emails Sent',
        data: stepPerformanceData.map(step => step.sent),
        type: 'line' as const,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 3,
        yAxisID: 'y1'
      }
    ]
  };

  // Reply Timeline Chart Data
  const timelineChartData = {
    labels: replyTimelineData.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'First Replies',
        data: replyTimelineData.map(item => item.firstReplies),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        fill: true
      },
      {
        label: 'Repeat Replies',
        data: replyTimelineData.map(item => item.repeatReplies),
        backgroundColor: 'rgba(251, 191, 36, 0.6)',
        borderColor: 'rgb(251, 191, 36)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  // Lead Status Chart Data
  const leadStatusChartData = leadStatusData ? {
    labels: ['Active', 'Replied', 'Interested', 'Bounced', 'Unsubscribed', 'Not Interested'],
    datasets: [{
      data: [
        leadStatusData.active,
        leadStatusData.replied,
        leadStatusData.interested,
        leadStatusData.bounced,
        leadStatusData.unsubscribed,
        leadStatusData.not_interested
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(102, 126, 234, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(156, 163, 175, 0.8)',
        'rgba(249, 115, 22, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(102, 126, 234)',
        'rgb(251, 191, 36)',
        'rgb(239, 68, 68)',
        'rgb(156, 163, 175)',
        'rgb(249, 115, 22)'
      ],
      borderWidth: 2
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const stepChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Percentage (%)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Emails Sent'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="charts-grid">
      {/* Funnel Chart */}
      <div className="chart-card">
        <h3>📈 Conversion Funnel</h3>
        <div className="chart-container">
          {funnelChartData ? (
            <Bar data={funnelChartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Step Performance Chart */}
      <div className="chart-card">
        <h3>📧 Step Performance</h3>
        <div className="chart-container">
          {stepPerformanceData.length > 0 ? (
            <Bar data={stepChartData as any} options={stepChartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Reply Timeline Chart */}
      <div className="chart-card">
        <h3>💬 Reply Timeline</h3>
        <div className="chart-container">
          {replyTimelineData.length > 0 ? (
            <Line data={timelineChartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Lead Status Distribution */}
      <div className="chart-card">
        <h3>👥 Lead Status Distribution</h3>
        <div className="chart-container">
          {leadStatusChartData ? (
            <Doughnut data={leadStatusChartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}