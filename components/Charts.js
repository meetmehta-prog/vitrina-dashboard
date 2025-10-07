import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function Charts() {
  const [funnelData, setFunnelData] = useState(null);
  const [stepData, setStepData] = useState(null);
  const [replyTimelineData, setReplyTimelineData] = useState(null);
  const [leadStatusData, setLeadStatusData] = useState(null);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      const [funnel, steps, timeline, status] = await Promise.all([
        fetch('/api/funnel-data').then(r => r.json()),
        fetch('/api/step-performance').then(r => r.json()),
        fetch('/api/reply-timeline').then(r => r.json()),
        fetch('/api/lead-status').then(r => r.json())
      ]);

      setFunnelData(funnel);
      setStepData(steps);
      setReplyTimelineData(timeline);
      setLeadStatusData(status);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Funnel Chart */}
      {funnelData && (
        <div className="bg-white/95 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4">📈 Conversion Funnel</h3>
          <div className="h-80">
            <Bar
              data={{
                labels: ['Emails Sent', 'Opens', 'Clicks', 'Replies', 'Meetings'],
                datasets: [{
                  label: 'Conversion Funnel',
                  data: [funnelData.emailsSent, funnelData.opens, funnelData.clicks, funnelData.replies, funnelData.meetings],
                  backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(79, 172, 254, 0.8)',
                    'rgba(67, 233, 123, 0.8)'
                  ],
                  borderColor: [
                    'rgb(102, 126, 234)',
                    'rgb(118, 75, 162)',
                    'rgb(240, 147, 251)',
                    'rgb(79, 172, 254)',
                    'rgb(67, 233, 123)'
                  ],
                  borderWidth: 2,
                  borderRadius: 8
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>
        </div>
      )}

      {/* Step Performance Chart */}
      {stepData && (
        <div className="bg-white/95 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4">📧 Step Performance</h3>
          <div className="h-80">
            <Line
              data={{
                labels: stepData.map(d => `Step ${d.step}`),
                datasets: [
                  {
                    label: 'Open Rate %',
                    data: stepData.map(d => parseFloat(d.openRate)),
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                  },
                  {
                    label: 'Click Rate %',
                    data: stepData.map(d => parseFloat(d.clickRate)),
                    borderColor: 'rgb(240, 147, 251)',
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    tension: 0.4,
                    fill: true
                  },
                  {
                    label: 'Reply Rate %',
                    data: stepData.map(d => parseFloat(d.replyRate)),
                    borderColor: 'rgb(67, 233, 123)',
                    backgroundColor: 'rgba(67, 233, 123, 0.1)',
                    tension: 0.4,
                    fill: true
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { callback: v => v + '%' }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Reply Timeline Chart */}
      {replyTimelineData && (
        <div className="bg-white/95 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4">💬 Reply Timeline</h3>
          <div className="h-80">
            <Bar
              data={{
                labels: replyTimelineData.slice(-30).map(d => 
                  new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                ),
                datasets: [
                  {
                    label: 'First Replies',
                    data: replyTimelineData.slice(-30).map(d => d.firstReplies),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)'
                  },
                  {
                    label: 'Repeat Replies',
                    data: replyTimelineData.slice(-30).map(d => d.repeatReplies),
                    backgroundColor: 'rgba(118, 75, 162, 0.8)'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { stacked: true },
                  y: { stacked: true, beginAtZero: true }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Lead Status Chart */}
      {leadStatusData && (
        <div className="bg-white/95 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4">👥 Lead Status Distribution</h3>
          <div className="h-80">
            <Doughnut
              data={{
                labels: ['Active', 'Replied', 'Interested', 'Bounced', 'Unsubscribed', 'Not Interested'],
                datasets: [{
                  data: [
                    leadStatusData.active || 0,
                    leadStatusData.replied || 0,
                    leadStatusData.interested || 0,
                    leadStatusData.bounced || 0,
                    leadStatusData.unsubscribed || 0,
                    leadStatusData.not_interested || 0
                  ],
                  backgroundColor: [
                    'rgba(67, 233, 123, 0.8)',
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(79, 172, 254, 0.8)',
                    'rgba(250, 112, 154, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                  ]
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}