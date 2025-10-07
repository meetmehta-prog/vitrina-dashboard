import { useState, useEffect } from 'react';
import MetricCard from './MetricCard';
import CampaignTable from './CampaignTable';
import DetailModal from './DetailModal';
import ComparisonModal from './ComparisonModal';
import AllLeadsModal from './AllLeadsModal';
import Charts from './Charts';
import ActivityFeed from './ActivityFeed';

export default function Dashboard({ data, loading, error, lastUpdated, onRefresh, onReload }) {
  const [metrics, setMetrics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showAllLeadsModal, setShowAllLeadsModal] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [modalType, setModalType] = useState('');

  useEffect(() => {
    loadMetrics();
    loadCampaigns();
  }, [data]);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/executive-metrics');
      const metricsData = await response.json();
      setMetrics(metricsData);
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaign-performance');
      const campaignsData = await response.json();
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Error loading campaigns:', err);
    }
  };

  const handleCampaignClick = (campaign) => {
    setCurrentCampaign(campaign);
    setShowDetailModal(true);
  };

  const handleCampaignSelect = (campaignId, selected) => {
    const newSelection = new Set(selectedCampaigns);
    if (selected) {
      if (newSelection.size < 5) {
        newSelection.add(campaignId);
      }
    } else {
      newSelection.delete(campaignId);
    }
    setSelectedCampaigns(newSelection);
  };

  const handleCompare = () => {
    if (selectedCampaigns.size >= 2) {
      setShowComparisonModal(true);
    }
  };

  const handleShowAllLeads = () => {
    setModalType('leads');
    setShowAllLeadsModal(true);
  };

  const handleShowAllReplies = () => {
    setModalType('replies');
    setShowAllLeadsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="text-white text-xl mt-4">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={onReload}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeInDown">
          <h1 className="text-4xl font-bold text-white mb-4">
            📊 Vitrina Analytics Dashboard
          </h1>
          <div className="flex items-center justify-center gap-4">
            <span className="text-white/90">
              Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
            </span>
            <button
              onClick={onRefresh}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full 
                       border-2 border-white/40 transition-all duration-300 hover:transform hover:-translate-y-1"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              icon="🎯"
              value={metrics.totalCampaigns}
              label="Total Campaigns"
              sublabel={`Running: ${metrics.runningCampaigns} | Completed: ${metrics.completedCampaigns}`}
              color="#667eea"
            />
            <MetricCard
              icon="📧"
              value={metrics.totalEmailsSent.toLocaleString()}
              label="Total Emails Sent"
              color="#667eea"
            />
            <MetricCard
              icon="👥"
              value={metrics.totalLeads.toLocaleString()}
              label="Total Leads"
              color="#764ba2"
              onClick={handleShowAllLeads}
            />
            <MetricCard
              icon="💬"
              value={metrics.totalReplies.toLocaleString()}
              label="Total Replies"
              color="#f093fb"
              onClick={handleShowAllReplies}
            />
            <MetricCard
              icon="📊"
              value={`${metrics.avgReplyRate}%`}
              label="Avg Reply Rate"
              color="#4facfe"
            />
            <MetricCard
              icon="👁️"
              value={`${metrics.avgOpenRate}%`}
              label="Avg Open Rate"
              color="#43e97b"
            />
            <MetricCard
              icon="🎯"
              value={metrics.totalMeetings.toLocaleString()}
              label="Meetings Booked"
              color="#fa709a"
            />
          </div>
        )}

        {/* Charts */}
        <Charts />

        {/* Campaign Table */}
        <CampaignTable
          campaigns={campaigns}
          selectedCampaigns={selectedCampaigns}
          onCampaignClick={handleCampaignClick}
          onCampaignSelect={handleCampaignSelect}
        />

        {/* Activity Feed */}
        <ActivityFeed />

        {/* Compare FAB */}
        {selectedCampaigns.size >= 2 && (
          <button
            onClick={handleCompare}
            className="fixed bottom-8 right-8 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-800 
                     text-white rounded-full shadow-lg hover:shadow-2xl transform hover:-translate-y-1 
                     transition-all duration-300 font-bold text-lg"
          >
            📊 Compare Selected ({selectedCampaigns.size})
          </button>
        )}

        {/* Modals */}
        {showDetailModal && currentCampaign && (
          <DetailModal
            campaignId={currentCampaign.campaignId}
            campaignName={currentCampaign.campaignName}
            onClose={() => setShowDetailModal(false)}
          />
        )}

        {showComparisonModal && (
          <ComparisonModal
            campaignIds={Array.from(selectedCampaigns)}
            onClose={() => setShowComparisonModal(false)}
          />
        )}

        {showAllLeadsModal && (
          <AllLeadsModal
            type={modalType}
            onClose={() => setShowAllLeadsModal(false)}
          />
        )}
      </div>
    </div>
  );
}