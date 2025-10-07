import { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ComparisonModal({ campaignIds, onClose }) {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const CAMPAIGN_COLORS = ['#667eea', '#764ba2', '#43e97b', '#fa709a', '#4facfe'];

  useEffect(() => {
    loadComparisonData();
  }, [campaignIds]);

  const loadComparisonData = async () => {
    try {
      const response = await fetch('/api/compare-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignIds })
      });
      const data = await response.json();
      setComparisonData(data);
    } catch (error) {
      console.error('Error loading comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch('/api/export-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comparisonData })
      });
      const data = await response.json();
      
      // Download overview CSV
      const overviewBlob = new Blob([data.overview], { type: 'text/csv' });
      const overviewUrl = URL.createObjectURL(overviewBlob);
      const overviewLink = document.createElement('a');
      overviewLink.href = overviewUrl;
      overviewLink.download = 'campaign_comparison_overview.csv';
      overviewLink.click();
      
      // Download steps CSV
      const stepsBlob = new Blob([data.steps], { type: 'text/csv' });
      const stepsUrl = URL.createObjectURL(stepsBlob);
      const stepsLink = document.createElement('a');
      stepsLink.href = stepsUrl;
      stepsLink.download = 'campaign_comparison_steps.csv';
      stepsLink.click();
      
      alert('CSV files downloaded successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById('comparisonContent');
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save('campaign_comparison.pdf');
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="p-8 text-center">
            <div className="spinner"></div>
            <p>Loading comparison data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!comparisonData) return null;

  const { campaigns, insights, bestPerformers } = comparisonData;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-7xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8 rounded-t-2xl sticky top-0 z-10">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:rotate-90"
          >
            <span className="text-2xl">×</span>
          </button>
          <h2 className="text-3xl font-bold mb-4">📊 Campaign Comparison</h2>
          <div className="flex gap-4">
            <button
              onClick={exportCSV}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              📥 Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              📄 Export PDF
            </button>
          </div>
        </div>

        {/* Content */}
        <div id="comparisonContent" className="p-8">
          {/* Insights */}
          {insights && insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'success' ? 'bg-green-50 border-green-500' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="font-bold mb-1">{insight.title}</div>
                  <div className="text-sm">{insight.message}</div>
                </div>
              ))}
            </div>
          )}

          {/* Campaign Legend */}
          <div className="flex gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
            {campaigns.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: CAMPAIGN_COLORS[i] }}
                />
                <span className="font-semibold">{c.name}</span>
              </div>
            ))}
          </div>

          {/* Overview Table */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">📊 Overview Metrics</h3>
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Metric</th>
                  {campaigns.map((c, i) => (
                    <th key={i}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: CAMPAIGN_COLORS[i] }}
                        />
                        {c.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Total Leads', 'totalLeads'],
                  ['Emails Sent', 'totalEmailsSent'],
                  ['Open Rate %', 'emailOpenRate'],
                  ['CTR %', 'emailCTR'],
                  ['Reply Rate %', 'emailReplyRate'],
                  ['Meetings', 'meetingsBooked']
                ].map(([label, key]) => (
                  <tr key={key}>
                    <td className="font-semibold">{label}</td>
                    {campaigns.map((c, i) => {
                      const value = c.overview[key];
                      const isBest = bestPerformers[key] === c.id;
                      const isPercent = key.includes('Rate') || key.includes('CTR');
                      
                      return (
                        <td key={i} className={isBest ? 'bg-yellow-50 font-bold' : ''}>
                          {value}{isPercent ? '%' : ''}
                          {isBest && ' ⭐'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-bold mb-4">Key Metrics Comparison</h4>
              <div className="h-64">
                <Bar
                  data={{
                    labels: ['Open Rate %', 'CTR %', 'Reply Rate %'],
                    datasets: campaigns.map((c, i) => ({
                      label: c.name,
                      data: [
                        c.overview.emailOpenRate,
                        c.overview.emailCTR,
                        c.overview.emailReplyRate
                      ],
                      backgroundColor: CAMPAIGN_COLORS[i] + '80',
                      borderColor: CAMPAIGN_COLORS[i],
                      borderWidth: 2
                    }))
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

            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-bold mb-4">Reply Rate by Step</h4>
              <div className="h-64">
                <Line
                  data={{
                    labels: Array.from(
                      { length: Math.max(...campaigns.map(c => c.steps.length)) },
                      (_, i) => `Step ${i + 1}`
                    ),
                    datasets: campaigns.map((c, i) => ({
                      label: c.name,
                      data: c.steps.map(s => s.replyRate),
                      borderColor: CAMPAIGN_COLORS[i],
                      backgroundColor: CAMPAIGN_COLORS[i] + '20',
                      tension: 0.4,
                      fill: true
                    }))
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
          </div>
        </div>
      </div>
    </div>
  );
}