'use client';

import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { downloadCSV, exportChartsToPDF } from '@/lib/exportUtils';

interface ComparisonModalProps {
  campaignIds: string[];
  onClose: () => void;
}

interface CampaignComparison {
  id: string;
  name: string;
  overview: {
    totalLeads: number;
    totalEmailsSent: number;
    uniqueLeadsEmailed: number;
    emailOpens: number;
    emailOpenRate: number;
    emailClicks: number;
    emailCTR: number;
    emailReplies: number;
    emailReplyRate: number;
    emailBounceRate: number;
    meetingsBooked: number;
  };
  steps: Array<{
    step: string;
    uniqueLeadsSent: number;
    opens: number;
    openRate: number;
    clicks: number;
    ctr: number;
    replies: number;
    replyRate: number;
  }>;
}

interface ComparisonData {
  campaigns: CampaignComparison[];
  insights: Array<{
    type: string;
    title: string;
    message: string;
  }>;
}

const CAMPAIGN_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

export default function ComparisonModal({ campaignIds, onClose }: ComparisonModalProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignIds.length > 0) {
      loadComparisonData();
    }
  }, [campaignIds]);

  const loadComparisonData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/campaigns/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignIds }),
      });

      if (response.ok) {
        const data = await response.json();
        setComparisonData(data);
      } else {
        setError('Failed to load comparison data');
      }
    } catch (err) {
      setError('Error loading comparison data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBestPerformer = (metric: string, campaigns: CampaignComparison[]) => {
    if (metric === 'emailBounceRate') {
      return campaigns.reduce((best, current) => 
        current.overview[metric as keyof typeof current.overview] < best.overview[metric as keyof typeof best.overview] ? current : best
      );
    }
    return campaigns.reduce((best, current) => 
      current.overview[metric as keyof typeof current.overview] > best.overview[metric as keyof typeof best.overview] ? current : best
    );
  };

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

  const handleExportCSV = () => {
    if (!comparisonData) return;

    const csvData = comparisonData.campaigns.flatMap(campaign =>
      campaign.steps.map((step, index) => ({
        'Campaign': campaign.name,
        'Step': index + 1,
        'Sent': step.uniqueLeadsSent,
        'Opens': step.opens,
        'Open Rate %': step.openRate,
        'Clicks': step.clicks,
        'CTR %': step.ctr,
        'Replies': step.replies,
        'Reply Rate %': step.replyRate,
        'Total Leads': campaign.overview.totalLeads,
        'Total Emails': campaign.overview.totalEmailsSent,
        'Overall Open Rate %': campaign.overview.emailOpenRate,
        'Overall Reply Rate %': campaign.overview.emailReplyRate,
        'Meetings': campaign.overview.meetingsBooked,
      }))
    );

    downloadCSV(csvData, 'campaign_comparison');
  };

  const handleExportPDF = () => {
    exportChartsToPDF('comparison-modal-content', 'campaign_comparison');
  };

  const renderOverviewChart = () => {
    if (!comparisonData) return null;

    const chartData = {
      labels: ['Open Rate %', 'CTR %', 'Reply Rate %', 'Meeting Rate %'],
      datasets: comparisonData.campaigns.map((campaign, index) => ({
        label: campaign.name,
        data: [
          campaign.overview.emailOpenRate,
          campaign.overview.emailCTR,
          campaign.overview.emailReplyRate,
          (campaign.overview.meetingsBooked / campaign.overview.totalLeads) * 100,
        ],
        backgroundColor: CAMPAIGN_COLORS[index] + '80',
        borderColor: CAMPAIGN_COLORS[index],
        borderWidth: 2,
      })),
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Key Metrics Comparison',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Percentage (%)',
          },
        },
      },
    };

    return <Bar data={chartData} options={options} />;
  };

  const renderStepChart = () => {
    if (!comparisonData) return null;

    const maxSteps = Math.max(...comparisonData.campaigns.map(c => c.steps.length));
    const stepNumbers = Array.from({ length: maxSteps }, (_, i) => `Step ${i + 1}`);

    const chartData = {
      labels: stepNumbers,
      datasets: comparisonData.campaigns.map((campaign, index) => ({
        label: campaign.name,
        data: campaign.steps.map(step => step.replyRate),
        backgroundColor: CAMPAIGN_COLORS[index] + '80',
        borderColor: CAMPAIGN_COLORS[index],
        borderWidth: 2,
      })),
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Reply Rate by Step',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Reply Rate (%)',
          },
        },
      },
    };

    return <Bar data={chartData} options={options} />;
  };

  if (!comparisonData && !loading) {
    return null;
  }

  return (
    <>
      <div className="comparison-overlay" onClick={onClose}></div>
      <div className="comparison-modal">
        <div className="comparison-header">
          <button className="close-comparison" onClick={onClose}>×</button>
          <h2>📊 Campaign Comparison</h2>
          <div className="comparison-header-actions">
            <button className="export-btn" onClick={handleExportCSV}>
              📥 Export CSV
            </button>
            <button className="export-btn" onClick={handleExportPDF}>
              📄 Export PDF
            </button>
          </div>
        </div>

        <div className="comparison-content" id="comparison-modal-content">
          {loading && (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p>Loading comparison data...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 text-xl mb-4">❌</div>
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {comparisonData && (
            <>
              {/* Insights */}
              {comparisonData.insights.length > 0 && (
                <div className="comparison-insights">
                  {comparisonData.insights.map((insight, index) => (
                    <div key={index} className={`insight-card ${insight.type}`}>
                      <div className="insight-title">{insight.title}</div>
                      <div className="insight-message">{insight.message}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campaign Legend */}
              <div className="campaign-colors">
                {comparisonData.campaigns.map((campaign, index) => (
                  <div key={campaign.id} className="campaign-legend-item">
                    <span 
                      className="campaign-color-dot" 
                      style={{ background: CAMPAIGN_COLORS[index] }}
                    ></span>
                    <strong>{campaign.name}</strong>
                  </div>
                ))}
              </div>

              {/* Overview Metrics Table */}
              <div className="comparison-section">
                <h3>📊 Overview Metrics Comparison</h3>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      {comparisonData.campaigns.map((campaign, index) => (
                        <th key={campaign.id}>
                          <span 
                            className="campaign-color-dot" 
                            style={{ background: CAMPAIGN_COLORS[index] }}
                          ></span>
                          {campaign.name}
                        </th>
                      ))}
                      <th>Best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Total Leads', 'totalLeads', false],
                      ['Emails Sent', 'totalEmailsSent', false],
                      ['Unique Emailed', 'uniqueLeadsEmailed', false],
                      ['Opens', 'emailOpens', false],
                      ['Open Rate', 'emailOpenRate', true],
                      ['Clicks', 'emailClicks', false],
                      ['CTR', 'emailCTR', true],
                      ['Replies', 'emailReplies', false],
                      ['Reply Rate', 'emailReplyRate', true],
                      ['Bounce Rate', 'emailBounceRate', true],
                      ['Meetings', 'meetingsBooked', false],
                    ].map(([label, key, isPercent]) => {
                      const bestCampaign = getBestPerformer(key as string, comparisonData.campaigns);
                      const bestValue = bestCampaign.overview[key as keyof typeof bestCampaign.overview];
                      
                      return (
                        <tr key={key as string}>
                          <td><strong>{label}</strong></td>
                          {comparisonData.campaigns.map(campaign => {
                            const value = campaign.overview[key as keyof typeof campaign.overview];
                            const isBest = value === bestValue && bestValue > 0;
                            return (
                              <td key={campaign.id} className={isBest ? 'best-performer' : ''}>
                                {formatNumber(value as any)}{isPercent ? '%' : ''}
                              </td>
                            );
                          })}
                          <td>{bestCampaign.name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Charts */}
              <div className="comparison-charts">
                <div className="comparison-chart-card">
                  <h4>Key Metrics Comparison</h4>
                  <div className="comparison-chart-container">
                    {renderOverviewChart()}
                  </div>
                </div>
                <div className="comparison-chart-card">
                  <h4>Reply Rate by Step</h4>
                  <div className="comparison-chart-container">
                    {renderStepChart()}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Performance */}
              <div className="comparison-section">
                <h3>📧 Step-by-Step Performance</h3>
                
                {Array.from({ length: Math.max(...comparisonData.campaigns.map(c => c.steps.length)) }, (_, i) => {
                  const stepNum = i + 1;
                  return (
                    <div key={stepNum}>
                      <h4 style={{ marginTop: '20px', color: '#667eea' }}>
                        Step {stepNum} Performance
                      </h4>
                      <table className="comparison-table">
                        <thead>
                          <tr>
                            <th>Metric</th>
                            {comparisonData.campaigns.map((campaign, index) => (
                              <th key={campaign.id}>
                                <span 
                                  className="campaign-color-dot" 
                                  style={{ background: CAMPAIGN_COLORS[index] }}
                                ></span>
                                {campaign.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['Sent', 'uniqueLeadsSent', false],
                            ['Opens', 'opens', false],
                            ['Open Rate', 'openRate', true],
                            ['Clicks', 'clicks', false],
                            ['CTR', 'ctr', true],
                            ['Replies', 'replies', false],
                            ['Reply Rate', 'replyRate', true],
                          ].map(([label, key, isPercent]) => (
                            <tr key={key as string}>
                              <td><strong>{label}</strong></td>
                              {comparisonData.campaigns.map(campaign => {
                                const step = campaign.steps[i];
                                if (step) {
                                  const value = step[key as keyof typeof step] || 0;
                                  return (
                                    <td key={campaign.id}>
                                      {formatNumber(typeof value === 'number' ? value : parseFloat(value.toString()))}{isPercent ? '%' : ''}
                                    </td>
                                  );
                                } else {
                                  return (
                                    <td key={campaign.id} className="null-value">N/A</td>
                                  );
                                }
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}