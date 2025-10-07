import { useState } from 'react';

export default function CampaignTable({ campaigns, selectedCampaigns, onCampaignClick, onCampaignSelect }) {
  const [showAll, setShowAll] = useState(false);
  const displayCampaigns = showAll ? campaigns : campaigns.slice(0, 10);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      campaigns.slice(0, 5).forEach(c => onCampaignSelect(c.campaignId, true));
    } else {
      campaigns.forEach(c => onCampaignSelect(c.campaignId, false));
    }
  };

  return (
    <div className="bg-white/95 rounded-2xl p-6 shadow-xl mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">🎯 Campaign Performance</h3>
        <button
          onClick={() => setShowAll(!showAll)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showAll ? 'Show Top 10' : 'Show All'}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="w-12">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  className="w-4 h-4"
                />
              </th>
              <th>Campaign</th>
              <th>Status</th>
              <th>Leads</th>
              <th>Emails Sent</th>
              <th>Opens</th>
              <th>Clicks</th>
              <th>Replies</th>
              <th>Reply Rate</th>
              <th>Meetings</th>
            </tr>
          </thead>
          <tbody>
            {displayCampaigns.map(campaign => {
              const statusClass = campaign.status === 'active' ? 'status-active' : 
                                 campaign.status === 'paused' ? 'status-paused' : 'status-ended';
              const isSelected = selectedCampaigns.has(campaign.campaignId);
              
              return (
                <tr key={campaign.campaignId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onCampaignSelect(campaign.campaignId, e.target.checked)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td 
                    className="font-semibold cursor-pointer hover:text-purple-600"
                    onClick={() => onCampaignClick(campaign)}
                  >
                    {campaign.campaignName}
                  </td>
                  <td>
                    <span className={`status-badge ${statusClass}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td>{campaign.leads.toLocaleString()}</td>
                  <td>{campaign.emailsSent.toLocaleString()}</td>
                  <td>{campaign.opens.toLocaleString()}</td>
                  <td>{campaign.clicks.toLocaleString()}</td>
                  <td className="font-bold">{campaign.replies.toLocaleString()}</td>
                  <td className="font-bold">{campaign.replyRate.toFixed(2)}%</td>
                  <td>{campaign.meetings.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}