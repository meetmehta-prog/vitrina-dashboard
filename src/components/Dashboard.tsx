'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import MetricsGrid from './MetricsGrid';
import ChartsGrid from './ChartsGrid';
import CampaignTable from './CampaignTable';
import ActivityFeed from './ActivityFeed';
import CampaignDetailModal from './CampaignDetailModal';
import ComparisonModal from './ComparisonModal';
import LoadingSpinner from './LoadingSpinner';

import {
  DashboardData,
  ExecutiveMetrics,
  CampaignPerformanceData,
  FunnelData,
  StepPerformanceData,
  ReplyTimelineData,
  LeadStatusBreakdown,
  RecentActivity
} from '@/types';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [executiveMetrics, setExecutiveMetrics] = useState<ExecutiveMetrics | null>(null);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformanceData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [stepPerformanceData, setStepPerformanceData] = useState<StepPerformanceData[]>([]);
  const [replyTimelineData, setReplyTimelineData] = useState<ReplyTimelineData[]>([]);
  const [leadStatusData, setLeadStatusData] = useState<LeadStatusBreakdown | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch all data concurrently
      const [
        dashboardResponse,
        executiveResponse,
        campaignsResponse,
        funnelResponse,
        stepsResponse,
        timelineResponse,
        statusResponse,
        activitiesResponse
      ] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/analytics/executive'),
        fetch('/api/analytics/campaigns'),
        fetch('/api/analytics/funnel'),
        fetch('/api/analytics/steps'),
        fetch('/api/analytics/replies-timeline'),
        fetch('/api/analytics/lead-status'),
        fetch('/api/analytics/recent-activities?limit=20')
      ]);

      if (!dashboardResponse.ok) throw new Error('Failed to fetch dashboard data');
      if (!executiveResponse.ok) throw new Error('Failed to fetch executive metrics');
      if (!campaignsResponse.ok) throw new Error('Failed to fetch campaign data');
      if (!funnelResponse.ok) throw new Error('Failed to fetch funnel data');
      if (!stepsResponse.ok) throw new Error('Failed to fetch steps data');
      if (!timelineResponse.ok) throw new Error('Failed to fetch timeline data');
      if (!statusResponse.ok) throw new Error('Failed to fetch status data');
      if (!activitiesResponse.ok) throw new Error('Failed to fetch activities data');

      const [
        dashboard,
        executive,
        campaigns,
        funnel,
        steps,
        timeline,
        status,
        activities
      ] = await Promise.all([
        dashboardResponse.json(),
        executiveResponse.json(),
        campaignsResponse.json(),
        funnelResponse.json(),
        stepsResponse.json(),
        timelineResponse.json(),
        statusResponse.json(),
        activitiesResponse.json()
      ]);

      setDashboardData(dashboard);
      setExecutiveMetrics(executive);
      setCampaignPerformance(campaigns);
      setFunnelData(funnel);
      setStepPerformanceData(steps);
      setReplyTimelineData(timeline);
      setLeadStatusData(status);
      setRecentActivities(activities);
      setLastUpdated(new Date().toLocaleString());

    } catch (err: any) {
      setError(err.message);
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSyncData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch('/api/sync', { method: 'POST' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync data');
      }

      // Reload dashboard after successful sync
      await loadDashboard();
      
      alert(`Data sync completed successfully!\nDuration: ${result.duration}s\nRecords processed: ${result.recordsProcessed}`);

    } catch (err: any) {
      setError(err.message);
      console.error('Error syncing data:', err);
      alert('Failed to sync data: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCampaignSelect = (campaignId: string, selected: boolean) => {
    setSelectedCampaigns(prev => {
      if (selected) {
        return [...prev, campaignId];
      } else {
        return prev.filter(id => id !== campaignId);
      }
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCampaigns(campaignPerformance.map(c => c.campaignId));
    } else {
      setSelectedCampaigns([]);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>📊 Vitrina Analytics Dashboard</h1>
        <div className="last-updated">
          <span>Last Updated: <span id="lastUpdated">{lastUpdated}</span></span>
          <button 
            className="refresh-btn" 
            onClick={loadDashboard} 
            disabled={refreshing}
          >
            🔄 Refresh
          </button>
          <button 
            className="refresh-btn" 
            onClick={handleSyncData} 
            disabled={refreshing}
          >
            🔄 Sync Data
          </button>
          <button 
            className="refresh-btn" 
            onClick={() => signOut()}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* Loading State */}
      {refreshing && (
        <div className="loading" style={{ display: 'block' }}>
          <div className="spinner"></div>
          <p>Refreshing dashboard data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="text-red-400 text-xl mr-3">❌</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {!refreshing && dashboardData && (
        <div id="dashboard">
          {/* Metrics Grid */}
          {executiveMetrics && (
            <MetricsGrid metrics={executiveMetrics} />
          )}

          {/* Charts Grid */}
          <ChartsGrid
            funnelData={funnelData}
            stepPerformanceData={stepPerformanceData}
            replyTimelineData={replyTimelineData}
            leadStatusData={leadStatusData}
          />

          {/* Campaign Performance Table */}
          <div id="campaign-performance-section">
            <CampaignTable
              campaigns={campaignPerformance}
              selectedCampaigns={selectedCampaigns}
              onCampaignSelect={handleCampaignSelect}
              onSelectAll={handleSelectAll}
              onCampaignClick={setSelectedCampaignId}
            />
          </div>

          {/* Recent Activities */}
          <ActivityFeed activities={recentActivities} />
        </div>
      )}

      {/* Compare FAB */}
      {selectedCampaigns.length >= 2 && (
        <button 
          className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50"
          onClick={() => setShowComparison(true)}
        >
          📊 Compare Selected ({selectedCampaigns.length})
        </button>
      )}

      {/* Campaign Detail Modal */}
      <CampaignDetailModal
        isOpen={selectedCampaignId !== null}
        campaignId={selectedCampaignId}
        onClose={() => setSelectedCampaignId(null)}
      />

      {/* Comparison Modal */}
      {showComparison && (
        <ComparisonModal
          campaignIds={selectedCampaigns}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}