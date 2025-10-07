'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import FilteredLeadsModal from './FilteredLeadsModal';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string | null;
}

interface HeatmapData {
  openRates: { [day: string]: { [hour: number]: number } };
  replyRates: { [day: string]: { [hour: number]: number } };
}

interface CampaignDetails {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  sender: string;
  metrics: {
    sent: number;
    opens: number;
    openRate: number;
    clicks: number;
    clickRate: number;
    replies: number;
    replyRate: number;
    meetings: number;
    meetingRate: number;
  };
  steps: Array<{
    step: string;
    type: string;
    sent: number;
    opens: number;
    openRate: number;
    clicks: number;
    clickRate: number;
    replies: number;
    replyRate: number;
    remaining: number;
  }>;
  leads: Array<{
    name: string;
    email: string;
    company: string;
    status: string;
    sent: number;
    opens: number;
    clicks: number;
    replies: number;
    lastActivity: string;
  }>;
  replies: Array<{
    date: string;
    lead: string;
    company: string;
    step: string;
    firstReply: boolean;
    responseTime: string;
    content: string;
  }>;
  activities: Array<{
    date: string;
    type: string;
    lead: string;
    company: string;
    step: string;
    details: string;
  }>;
  meetings: Array<{
    lead: string;
    company: string;
    type: string;
    meetingDate: string;
    bookedDate: string;
    step: string;
    daysToBook: number;
  }>;
}

export default function CampaignDetailModal({ isOpen, onClose, campaignId }: CampaignDetailModalProps) {
  const [activeTab, setActiveTab] = useState('steps');
  const [heatmapView, setHeatmapView] = useState<'open' | 'reply'>('open');
  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Pagination states
  const [leadsPage, setLeadsPage] = useState(1);
  const [repliesPage, setRepliesPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [meetingsPage, setMeetingsPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal state for filtered leads
  const [modalState, setModalState] = useState({
    isOpen: false,
    filterType: '',
    title: '',
    campaignId: ''
  });

  useEffect(() => {
    if (isOpen && campaignId) {
      loadCampaignDetails();
      loadHeatmapData();
    }
  }, [isOpen, campaignId]);

  const loadCampaignDetails = async () => {
    if (!campaignId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/details`);
      if (response.ok) {
        const data = await response.json();
        setCampaignDetails(data);
      }
    } catch (error) {
      console.error('Error loading campaign details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHeatmapData = async () => {
    if (!campaignId) return;
    
    try {
      const response = await fetch(`/api/analytics/time-performance?campaignId=${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        setHeatmapData(data);
      }
    } catch (error) {
      console.error('Error loading heatmap data:', error);
    }
  };

  const getPaginatedData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const openLeadsModal = (filterType: string, title: string) => {
    setModalState({
      isOpen: true,
      filterType,
      title,
      campaignId: campaignId || ''
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      filterType: '',
      title: '',
      campaignId: ''
    });
  };

  const renderCharts = () => {
    if (!campaignDetails || !campaignDetails.steps || campaignDetails.steps.length === 0) {
      return (
        <div className="no-data-message">
          <p>No chart data available</p>
        </div>
      );
    }

    const stepLabels = campaignDetails.steps.map(step => `Step ${step.step}`);

    // Step Performance Chart
    const stepPerformanceData = {
      labels: stepLabels,
      datasets: [
        {
          label: 'Sent',
          data: campaignDetails.steps.map(step => step.sent),
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
        {
          label: 'Opens',
          data: campaignDetails.steps.map(step => step.opens),
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Clicks',
          data: campaignDetails.steps.map(step => step.clicks),
          backgroundColor: 'rgba(251, 191, 36, 0.5)',
          borderColor: 'rgba(251, 191, 36, 1)',
          borderWidth: 1,
        },
        {
          label: 'Replies',
          data: campaignDetails.steps.map(step => step.replies),
          backgroundColor: 'rgba(168, 85, 247, 0.5)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1,
        },
      ],
    };

    // Conversion Rates Chart
    const conversionRatesData = {
      labels: stepLabels,
      datasets: [
        {
          label: 'Open Rate (%)',
          data: campaignDetails.steps.map(step => step.openRate),
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Click Rate (%)',
          data: campaignDetails.steps.map(step => step.clickRate),
          borderColor: 'rgba(251, 191, 36, 1)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Reply Rate (%)',
          data: campaignDetails.steps.map(step => step.replyRate),
          borderColor: 'rgba(168, 85, 247, 1)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    return (
      <div className="charts-grid">
        <div className="chart-container">
          <h4>Step-by-Step Performance</h4>
          <div style={{ height: '350px' }}>
            <Bar data={stepPerformanceData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-container">
          <h4>Conversion Rates by Step</h4>
          <div style={{ height: '350px' }}>
            <Line data={conversionRatesData} options={chartOptions} />
          </div>
        </div>
      </div>
    );
  };

  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </div>
        <div className="pagination-controls">
          <button 
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>
          {pages.map(page => (
            <button
              key={page}
              className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
          <button 
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderHeatmap = () => {
    if (!heatmapData) {
      return (
        <div className="heatmap-loading">
          <div className="loading-spinner"></div>
          <p>Loading performance heatmap...</p>
        </div>
      );
    }

    const data = heatmapView === 'open' ? heatmapData.openRates : heatmapData.replyRates;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    let maxValue = 0;
    let minValue = Infinity;
    let hasData = false;
    
    days.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        if (data[day] && data[day][hour] !== undefined) {
          const value = parseFloat(data[day][hour].toString());
          if (value > 0) {
            maxValue = Math.max(maxValue, value);
            minValue = Math.min(minValue, value);
            hasData = true;
          }
        }
      }
    });

    if (!hasData) {
      return (
        <div className="heatmap-no-data">
          <div className="no-data-icon">📊</div>
          <p>No {heatmapView === 'open' ? 'open' : 'reply'} activity data available</p>
          <p className="no-data-subtitle">Data will appear here once there's engagement activity</p>
        </div>
      );
    }

    const getHeatmapColor = (intensity: number, value: number) => {
      if (value === 0) return '#f8f9fa';
      
      // Enhanced color scheme for better visibility
      const colors = [
        { r: 248, g: 249, b: 250 }, // Very light gray
        { r: 220, g: 248, b: 198 }, // Light green
        { r: 187, g: 247, b: 208 }, // Green
        { r: 134, g: 239, b: 172 }, // Medium green
        { r: 74, g: 222, b: 128 },  // Bright green
        { r: 34, g: 197, b: 94 },   // Dark green
        { r: 21, g: 128, b: 61 }    // Very dark green
      ];
      
      const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
      const color = colors[index];
      return `rgb(${color.r}, ${color.g}, ${color.b})`;
    };

    const formatHour = (hour: number) => {
      if (hour === 0) return '12am';
      if (hour === 12) return '12pm';
      if (hour < 12) return `${hour}am`;
      return `${hour - 12}pm`;
    };

    return (
      <div className="heatmap-container-improved">
        <div className="heatmap-legend">
          <span>Less</span>
          <div className="legend-gradient"></div>
          <span>More</span>
          <span className="legend-range">({minValue.toFixed(1)}% - {maxValue.toFixed(1)}%)</span>
        </div>
        
        <div className="heatmap-grid-improved">
          <div className="heatmap-cell-improved header"></div>
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="heatmap-cell-improved header hour-header">
              {hour % 4 === 0 ? formatHour(hour) : ''}
            </div>
          ))}
          
          {days.map(day => (
            <div key={day} className="heatmap-row">
              <div className="heatmap-cell-improved header day-header">{day.substring(0, 3)}</div>
              {Array.from({ length: 24 }, (_, hour) => {
                const value = data[day] && data[day][hour] !== undefined ? parseFloat(data[day][hour].toString()) : 0;
                const intensity = maxValue > 0 ? (value - minValue) / (maxValue - minValue) : 0;
                const color = getHeatmapColor(intensity, value);
                const displayValue = value > 0 ? value.toFixed(1) : '';
                
                return (
                  <div
                    key={hour}
                    className="heatmap-cell-improved data"
                    style={{ backgroundColor: color }}
                    title={`${day} at ${formatHour(hour)} - ${heatmapView === 'open' ? 'Open' : 'Reply'} Rate: ${value.toFixed(2)}%`}
                  >
                    <span className="cell-value">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="detail-overlay" onClick={onClose}></div>
      <div className="detail-modal">
        <div className="detail-header">
          <button className="close-detail" onClick={onClose}>×</button>
          <h2>{campaignDetails?.name || 'Campaign Name'}</h2>
          <div className="detail-header-info">
            <span>{campaignDetails?.status}</span>
            <span>{campaignDetails?.createdAt}</span>
            <span>{campaignDetails?.sender}</span>
          </div>
        </div>
        <div className="detail-content">
          <div className="detail-section">
            <h3>📊 Key Metrics</h3>
            <div className="detail-metrics-grid">
              {campaignDetails?.metrics && (
                <>
                  <div className="metric-card">
                    <div className="metric-value">{campaignDetails.metrics.sent}</div>
                    <div className="metric-label">Sent</div>
                  </div>
                  <div 
                    className="metric-card clickable"
                    onClick={() => openLeadsModal('opened', 'Campaign Leads Who Opened Emails')}
                  >
                    <div className="metric-value">{campaignDetails.metrics.opens}</div>
                    <div className="metric-label">Opens</div>
                    <div className="click-indicator">Click to view details</div>
                  </div>
                  <div 
                    className="metric-card clickable"
                    onClick={() => openLeadsModal('opened', 'Campaign Leads Who Opened Emails')}
                  >
                    <div className="metric-value">{campaignDetails.metrics.openRate.toFixed(1)}%</div>
                    <div className="metric-label">Open Rate</div>
                    <div className="click-indicator">Click to view details</div>
                  </div>
                  <div 
                    className="metric-card clickable"
                    onClick={() => openLeadsModal('clicked', 'Campaign Leads Who Clicked Links')}
                  >
                    <div className="metric-value">{campaignDetails.metrics.clicks}</div>
                    <div className="metric-label">Clicks</div>
                    <div className="click-indicator">Click to view details</div>
                  </div>
                  <div 
                    className="metric-card clickable"
                    onClick={() => openLeadsModal('clicked', 'Campaign Leads Who Clicked Links')}
                  >
                    <div className="metric-value">{campaignDetails.metrics.clickRate.toFixed(1)}%</div>
                    <div className="metric-label">Click Rate</div>
                    <div className="click-indicator">Click to view details</div>
                  </div>
                  <div 
                    className="metric-card clickable"
                    onClick={() => openLeadsModal('replied', 'Campaign Leads Who Replied')}
                  >
                    <div className="metric-value">{campaignDetails.metrics.replies}</div>
                    <div className="metric-label">Replies</div>
                    <div className="click-indicator">Click to view details</div>
                  </div>
                  <div 
                    className="metric-card clickable"
                    onClick={() => openLeadsModal('replied', 'Campaign Leads Who Replied')}
                  >
                    <div className="metric-value">{campaignDetails.metrics.replyRate.toFixed(1)}%</div>
                    <div className="metric-label">Reply Rate</div>
                    <div className="click-indicator">Click to view details</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">{campaignDetails.metrics.meetings}</div>
                    <div className="metric-label">Meetings</div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="heatmap-section">
            <div className="heatmap-header">
              <h3>🕐 Best Performing Times</h3>
              <div className="heatmap-toggle">
                <button 
                  className={`heatmap-toggle-btn ${heatmapView === 'open' ? 'active' : ''}`}
                  onClick={() => setHeatmapView('open')}
                >
                  Open Rate
                </button>
                <button 
                  className={`heatmap-toggle-btn ${heatmapView === 'reply' ? 'active' : ''}`}
                  onClick={() => setHeatmapView('reply')}
                >
                  Reply Rate
                </button>
              </div>
            </div>
            <div className="heatmap-container">
              {renderHeatmap()}
            </div>
          </div>
          
          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
              onClick={() => setActiveTab('charts')}
            >
              📊 Charts
            </button>
            <button
              className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
              onClick={() => setActiveTab('steps')}
            >
              📧 Step Performance
            </button>
            <button
              className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              👥 Leads
            </button>
            <button
              className={`tab-btn ${activeTab === 'replies' ? 'active' : ''}`}
              onClick={() => setActiveTab('replies')}
            >
              💬 Replies
            </button>
            <button
              className={`tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
              onClick={() => setActiveTab('activities')}
            >
              ⚡ Activities
            </button>
            <button
              className={`tab-btn ${activeTab === 'meetings' ? 'active' : ''}`}
              onClick={() => setActiveTab('meetings')}
            >
              📅 Meetings
            </button>
          </div>

          <div className={`tab-content ${activeTab === 'charts' ? 'active' : ''}`}>
            <div className="detail-section">
              {renderCharts()}
            </div>
          </div>

          <div className={`tab-content ${activeTab === 'steps' ? 'active' : ''}`}>
            <div className="detail-section">
              <table className="detail-table">
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
                    <th>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignDetails?.steps.map((step, index) => (
                    <tr key={index}>
                      <td>{step.step}</td>
                      <td>{step.type}</td>
                      <td>{step.sent}</td>
                      <td>{step.opens}</td>
                      <td>{step.openRate.toFixed(1)}%</td>
                      <td>{step.clicks}</td>
                      <td>{step.clickRate.toFixed(1)}%</td>
                      <td>{step.replies}</td>
                      <td>{step.replyRate.toFixed(1)}%</td>
                      <td>{step.remaining}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className={`tab-content ${activeTab === 'leads' ? 'active' : ''}`}>
            <div className="detail-section">
              <table className="detail-table">
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
                  {campaignDetails?.leads && getPaginatedData(campaignDetails.leads, leadsPage).map((lead, index) => (
                    <tr key={index}>
                      <td>{lead.name}</td>
                      <td>{lead.email}</td>
                      <td>{lead.company}</td>
                      <td>{lead.status}</td>
                      <td>{lead.sent}</td>
                      <td>{lead.opens}</td>
                      <td>{lead.clicks}</td>
                      <td>{lead.replies}</td>
                      <td>{lead.lastActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {campaignDetails?.leads && renderPagination(leadsPage, campaignDetails.leads.length, setLeadsPage)}
            </div>
          </div>
          
          <div className={`tab-content ${activeTab === 'replies' ? 'active' : ''}`}>
            <div className="detail-section">
              <table className="detail-table">
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
                  {campaignDetails?.replies && getPaginatedData(campaignDetails.replies, repliesPage).map((reply, index) => (
                    <tr key={index}>
                      <td>{reply.date}</td>
                      <td>{reply.lead}</td>
                      <td>{reply.company}</td>
                      <td>{reply.step}</td>
                      <td>{reply.firstReply ? 'Yes' : 'No'}</td>
                      <td>{reply.responseTime}</td>
                      <td>{reply.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {campaignDetails?.replies && renderPagination(repliesPage, campaignDetails.replies.length, setRepliesPage)}
            </div>
          </div>
          
          <div className={`tab-content ${activeTab === 'activities' ? 'active' : ''}`}>
            <div className="detail-section">
              <table className="detail-table">
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
                  {campaignDetails?.activities && getPaginatedData(campaignDetails.activities, activitiesPage).map((activity, index) => (
                    <tr key={index}>
                      <td>{activity.date}</td>
                      <td>{activity.type}</td>
                      <td>{activity.lead}</td>
                      <td>{activity.company}</td>
                      <td>{activity.step}</td>
                      <td>{activity.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {campaignDetails?.activities && renderPagination(activitiesPage, campaignDetails.activities.length, setActivitiesPage)}
            </div>
          </div>
          
          <div className={`tab-content ${activeTab === 'meetings' ? 'active' : ''}`}>
            <div className="detail-section">
              <table className="detail-table">
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
                  {campaignDetails?.meetings && getPaginatedData(campaignDetails.meetings, meetingsPage).map((meeting, index) => (
                    <tr key={index}>
                      <td>{meeting.lead}</td>
                      <td>{meeting.company}</td>
                      <td>{meeting.type}</td>
                      <td>{meeting.meetingDate}</td>
                      <td>{meeting.bookedDate}</td>
                      <td>{meeting.step}</td>
                      <td>{meeting.daysToBook}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {campaignDetails?.meetings && renderPagination(meetingsPage, campaignDetails.meetings.length, setMeetingsPage)}
            </div>
          </div>
        </div>
        
        {/* Filtered Leads Modal */}
        <FilteredLeadsModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          filterType={modalState.filterType}
          title={modalState.title}
          campaignId={modalState.campaignId}
        />
      </div>
      
      <style jsx>{`
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-top: 1rem;
        }

        .chart-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .chart-container h4 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        @media (min-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .metric-card.clickable {
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .metric-card.clickable:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .click-indicator {
          margin-top: 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
          font-size: 0.75rem;
          color: #3b82f6;
          font-weight: 500;
        }

        .metric-card.clickable:hover .click-indicator {
          opacity: 1;
        }

        .heatmap-loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .heatmap-no-data {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .no-data-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .no-data-subtitle {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .heatmap-container-improved {
          margin-top: 16px;
        }

        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .legend-gradient {
          width: 100px;
          height: 12px;
          background: linear-gradient(to right, #f8f9fa, #dcf8c6, #bbf7d0, #86efac, #4ade80, #22c55e, #15803d);
          border-radius: 6px;
        }

        .legend-range {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .heatmap-grid-improved {
          display: grid;
          grid-template-columns: auto repeat(24, 1fr);
          gap: 2px;
          font-size: 0.75rem;
        }

        .heatmap-row {
          display: contents;
        }

        .heatmap-cell-improved {
          min-height: 32px;
          min-width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-weight: 500;
        }

        .heatmap-cell-improved.header {
          background: transparent;
          color: #6b7280;
          font-size: 0.75rem;
        }

        .hour-header {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }

        .day-header {
          font-weight: 600;
          color: #374151;
        }

        .heatmap-cell-improved.data {
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #e5e7eb;
        }

        .heatmap-cell-improved.data:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10;
          border-color: #3b82f6;
        }

        .cell-value {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1f2937;
        }
      `}</style>
    </>
  );
}