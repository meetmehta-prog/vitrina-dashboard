import { useState, useEffect } from 'react';

export default function Heatmap({ campaignId }) {
  const [heatmapData, setHeatmapData] = useState(null);
  const [currentView, setCurrentView] = useState('open');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeatmapData();
  }, [campaignId]);

  const loadHeatmapData = async () => {
    try {
      const response = await fetch(`/api/time-performance-heatmap?campaignId=${campaignId}`);
      const data = await response.json();
      setHeatmapData(data);
    } catch (error) {
      console.error('Error loading heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (intensity) => {
    const r = Math.round(102 + (67 - 102) * intensity);
    const g = Math.round(178 + (233 - 178) * intensity);
    const b = Math.round(234 + (123 - 234) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  };

  if (loading || !heatmapData) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <div className="text-center py-8 text-gray-500">Loading heatmap...</div>
      </div>
    );
  }

  const data = currentView === 'open' ? heatmapData.openRates : heatmapData.replyRates;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  let maxValue = 0;
  days.forEach(day => {
    for (let hour = 0; hour < 24; hour++) {
      maxValue = Math.max(maxValue, parseFloat(data[day][hour]));
    }
  });

  return (
    <div className="bg-gray-50 p-6 rounded-lg mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">🕐 Best Performing Times</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('open')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'open' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-purple-600 border-2 border-purple-600'
            }`}
          >
            Open Rate
          </button>
          <button
            onClick={() => setCurrentView('reply')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'reply' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-purple-600 border-2 border-purple-600'
            }`}
          >
            Reply Rate
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="heatmap-grid min-w-[1000px]">
          <div className="heatmap-cell header"></div>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="heatmap-cell header">{i}</div>
          ))}
          
          {days.map(day => (
            <React.Fragment key={day}>
              <div className="heatmap-cell header">{day.substring(0, 3)}</div>
              {Array.from({ length: 24 }, (_, hour) => {
                const value = parseFloat(data[day][hour]);
                const intensity = maxValue > 0 ? value / maxValue : 0;
                const color = getHeatmapColor(intensity);
                const displayValue = value > 0 ? value.toFixed(1) : '';
                
                return (
                  <div
                    key={hour}
                    className="heatmap-cell data"
                    style={{ background: color }}
                    title={`${day} at ${hour}:00 - ${currentView === 'open' ? 'Open' : 'Reply'} Rate: ${value.toFixed(2)}%`}
                  >
                    {displayValue}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}