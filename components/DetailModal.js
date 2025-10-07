import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import Heatmap from './Heatmap';

export default function DetailModal({ campaignId, campaignName, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('steps');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadCampaignDetails();
  }, [campaignId]);

  const loadCampaignDetails = async () => {
    try {
      const response = await fetch(`/api/campaign-details?campaignId=${campaignId}`);
      const data = await response.json();
      setDetails(data);
    } catch (error) {
      console.error('Error loading campaign details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterLeads = async (filter) => {
    setFilterType(filter);
    setCurrentPage(1);
    setActiveTab('leads');
    // Load filtered leads
    try {
      const response = await fetch(
        `/api/campaign-filtered-leads?campaignId=${campaignId}&filterType=${filter}&page=1&pageSize=50`
      );
      const data = await response.json();
      // Update leads display
      setDetails(prev => ({ ...prev, filteredLeads: data }));
    } catch (error) {
      console.error('Error loading filtered leads:', error);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="p-8 text-center">
            <div className="spinner"></div>
            <p>Loading campaign details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!details) return null;

  const { overview, steps, leads, replies, activities, meetings } = details;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8 rounded-t-2xl sticky top-0 z-10">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:rotate-90"
          >
            <span className="text-2xl">×</span>
          </button>
          <h2 className="text-3xl font-bold mb-2">{campaignName}</h2>
          <div className="flex gap-6 mt-4 text-sm">
            <span className="px-3 py-1 bg-white/20 rounded-full">
              {overview.status}
            </span>
            <span>Created: {new Date(overview.createdDate).toLocaleDateString()}</span>
            <span>Sender: {overview.senderName}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Key Metrics */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">📊 Key Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Leads', value: overview.totalLeads, filter: 'all', clickable: true },
                { label: 'Emails Sent', value: overview.totalEmailsSent },
                { label: 'Opens', value: overview.emailOpens, percent: overview.emailOpenRate, filter: 'opened', clickable: true },
                { label: 'Clicks', value: overview.emailClicks, percent: overview.emailCTR, filter: 'clicked', clickable: true },
                { label: 'Replies', value: overview.emailReplies, percent: overview.emailReplyRate, filter: 'replied', clickable: true },
                { label: 'Meetings', value: overview.meetingsBooked },
                { label: 'Bounces', value: overview.emailBounces, percent: overview.emailBounceRate, filter: 'bounced', clickable: true },
                { label: 'Active Leads', value: overview.activeLeads }
              ].map((metric, i) => (
                <div 
                  key={i}
                  className={`bg-gray-50 p-4 rounded-lg border-l-4 border-purple-600 ${metric.clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                  onClick={() => metric.clickable && handleFilterLeads(metric.filter)}
                >
                  <div className="text-gray-600 text-sm mb-1">{metric.label}</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                    {metric.percent && (
                      <div className="text-purple-600 font-semibold">{metric.percent.toFixed(2)}%</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <Heatmap campaignId={campaignId} />

          {/* Tabs */}
          <div className="border-b-2 border-gray-200 mb-6">
            <div className="flex gap-4">
              {['steps', 'leads', 'replies', 'activities', 'meetings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-semibold capitalize transition-colors ${
                    activeTab === tab 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  {tab === 'steps' && '📧 '}
                  {tab === 'leads' && '👥 '}
                  {tab === 'replies' && '💬 '}
                  {tab === 'activities' && '⚡ '}
                  {tab === 'meetings' && '📅 '}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'steps' && (
              <div>
                {/* Step Chart */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6 h-80">
                  <Bar
                    data={{
                      labels: steps.map(s => `Step ${s.stepNumber}`),
                      datasets: [
                        {
                          label: 'Open Rate %',
                          data: steps.map(s => s.openRate),
                          backgroundColor: 'rgba(102, 126, 234, 0.7)',
                          borderColor: 'rgb(102, 126, 234)',
                          borderWidth: 2
                        },
                        {
                          label: 'Reply Rate %',
                          data: steps.map(s => s.replyRate),
                          backgroundColor: 'rgba(67, 233, 123, 0.7)',
                          borderColor: 'rgb(67, 233, 123)',
                          borderWidth: 2
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: { callback: v => v + '%' }
                        }
                      }
                    }}
                  />
                </div>
                
                {/* Steps Table */}
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Type</th>
                      <th>Sent</th>
                      <th>Opens</th>
                      <th>Open Rate</th>
                      <th>Clicks</th>
                      <th>CTR</th>
                      <th>Replies</th>
                      <th>Reply Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {steps.map(step => (
                      <tr key={step.stepNumber}>
                        <td className="font-bold">Step {step.stepNumber}</td>
                        <td>{step.stepType}</td>
                        <td>{step.uniqueLeadsSent.toLocaleString()}</td>
                        <td>{step.opens.toLocaleString()}</td>
                        <td className="font-semibold">{step.openRate.toFixed(2)}%</td>
                        <td>{step.clicks.toLocaleString()}</td>
                        <td>{step.ctr.toFixed(2)}%</td>
                        <td>{step.replies.toLocaleString()}</td>
                        <td className="font-semibold">{step.replyRate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'leads' && (
              <div>
                {filterType !== 'all' && (
                  <div className="mb-4 flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-purple-600">
                      Filtered: {filterType} ({details.filteredLeads?.totalLeads || leads.length} leads)
                    </h4>
                    <button
                      onClick={() => handleFilterLeads('all')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
                
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Lead Name</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Sent</th>
                      <th>Opens</th>
                      <th>Clicks</th>
                      <th>Replies</th>
                      <th>Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(details.filteredLeads?.leads || leads.slice(0, 50)).map((lead, i) => (
                      <tr key={i}>
                        <td className="font-semibold">{lead.leadName}</td>
                        <td>{lead.leadEmail}</td>
                        <td>{lead.companyName}</td>
                        <td>
                          <span className={`status-badge ${
                            lead.status === 'active' ? 'status-active' : 
                            lead.status === 'bounced' ? 'status-ended' : 'status-paused'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td>{lead.emailsSent}</td>
                        <td>{lead.opens}</td>
                        <td>{lead.clicks}</td>
                        <td className="font-bold">{lead.replies}</td>
                        <td>{lead.lastActivityDate ? new Date(lead.lastActivityDate).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'replies' && (
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Lead</th>
                    <th>Company</th>
                    <th>Step</th>
                    <th>First Reply</th>
                    <th>Response Time</th>
                    <th>Content Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {replies.map((reply, i) => (
                    <tr key={i}>
                      <td>{new Date(reply.replyDate).toLocaleString()}</td>
                      <td>
                        <div className="font-semibold">{reply.leadName}</div>
                        <div className="text-xs text-gray-500">{reply.leadEmail}</div>
                      </td>
                      <td>{reply.companyName}</td>
                      <td>Step {reply.stepNumber}</td>
                      <td>{reply.isFirstReply ? '✅ Yes' : 'No'}</td>
                      <td>{reply.responseTime ? `${reply.responseTime.toFixed(1)} hrs` : 'N/A'}</td>
                      <td>
                        <div className="max-w-xs truncate text-gray-600">
                          {reply.replyContent || 'No content'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'activities' && (
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Lead</th>
                    <th>Company</th>
                    <th>Step</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, i) => (
                    <tr key={i}>
                      <td>{new Date(activity.activityDate).toLocaleString()}</td>
                      <td>{activity.activityType}</td>
                      <td>
                        <div className="font-semibold">{activity.leadName}</div>
                        <div className="text-xs text-gray-500">{activity.leadEmail}</div>
                      </td>
                      <td>{activity.companyName || 'N/A'}</td>
                      <td>Step {activity.stepNumber}</td>
                      <td>{activity.additionalData || activity.errorMessage || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'meetings' && (
              meetings.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  No meetings booked for this campaign yet
                </div>
              ) : (
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Company</th>
                      <th>Meeting Type</th>
                      <th>Meeting Date</th>
                      <th>Booked Date</th>
                      <th>Step</th>
                      <th>Days to Book</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.map((meeting, i) => (
                      <tr key={i}>
                        <td>
                          <div className="font-semibold">{meeting.leadName}</div>
                          <div className="text-xs text-gray-500">{meeting.leadEmail}</div>
                        </td>
                        <td>{meeting.companyName}</td>
                        <td>{meeting.meetingType}</td>
                        <td>{meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleString() : 'N/A'}</td>
                        <td>{new Date(meeting.bookingDate).toLocaleString()}</td>
                        <td>Step {meeting.stepNumber}</td>
                        <td className="font-bold">{meeting.daysToBook} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}