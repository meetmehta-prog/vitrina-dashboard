'use client';

import { useState } from 'react';
import { CampaignPerformanceData } from '@/types';

interface CampaignTableProps {
  campaigns: CampaignPerformanceData[];
  selectedCampaigns: string[];
  onCampaignSelect: (campaignId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onCampaignClick: (campaignId: string) => void;
}

export default function CampaignTable({
  campaigns,
  selectedCampaigns,
  onCampaignSelect,
  onSelectAll,
  onCampaignClick
}: CampaignTableProps) {
  const [showAll, setShowAll] = useState(false);
  
  const displayedCampaigns = showAll ? campaigns : campaigns.slice(0, 10);
  const allSelected = campaigns.length > 0 && selectedCampaigns.length === campaigns.length;
  const someSelected = selectedCampaigns.length > 0 && selectedCampaigns.length < campaigns.length;

  const getStatusBadge = (status?: string, isArchived?: boolean) => {
    if (isArchived) {
      return <span className="status-badge status-ended">Archived</span>;
    }
    
    switch (status?.toLowerCase()) {
      case 'active':
      case 'running':
        return <span className="status-badge status-active">Active</span>;
      case 'paused':
        return <span className="status-badge status-paused">Paused</span>;
      case 'ended':
      case 'completed':
        return <span className="status-badge status-ended">Ended</span>;
      default:
        return <span className="status-badge status-active">{status || 'Active'}</span>;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3 className="table-title">🎯 Campaign Performance (Click to View Details)</h3>
        <button 
          className="show-all-btn" 
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? `Show Top 10` : `Show All ${campaigns.length} Campaigns`}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <th className="p-3 text-left" style={{ width: '50px' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="p-3 text-left">Campaign</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Leads</th>
              <th className="p-3 text-left">Emails Sent</th>
              <th className="p-3 text-left">Opens</th>
              <th className="p-3 text-left">Clicks</th>
              <th className="p-3 text-left">Replies</th>
              <th className="p-3 text-left">Reply Rate</th>
              <th className="p-3 text-left">Meetings</th>
            </tr>
          </thead>
          <tbody>
            {displayedCampaigns.map((campaign) => (
              <tr
                key={campaign.campaignId}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.includes(campaign.campaignId)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onCampaignSelect(campaign.campaignId, e.target.checked);
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-3">
                  <div>
                    <div 
                      className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => onCampaignClick(campaign.campaignId)}
                    >
                      {campaign.campaignName}
                    </div>
                    <div className="text-sm text-gray-500">{campaign.accountId}</div>
                  </div>
                </td>
                <td className="p-3">
                  {getStatusBadge(campaign.status, campaign.isArchived)}
                </td>
                <td className="p-3 text-gray-900">{formatNumber(campaign.leads)}</td>
                <td className="p-3 text-gray-900">{formatNumber(campaign.emailsSent)}</td>
                <td className="p-3 text-gray-900">{formatNumber(campaign.opens)}</td>
                <td className="p-3 text-gray-900">{formatNumber(campaign.clicks)}</td>
                <td className="p-3 text-gray-900">{formatNumber(campaign.replies)}</td>
                <td className="p-3">
                  <span className={`font-medium ${campaign.replyRate >= 5 ? 'text-green-600' : campaign.replyRate >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {formatPercentage(campaign.replyRate)}
                  </span>
                </td>
                <td className="p-3 text-gray-900">{formatNumber(campaign.meetings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {campaigns.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No campaigns found</p>
          <p className="text-sm">Try syncing data to load campaigns</p>
        </div>
      )}
    </div>
  );
}