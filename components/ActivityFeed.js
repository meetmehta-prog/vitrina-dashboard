import { useState, useEffect } from 'react';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const response = await fetch('/api/recent-activities');
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      emailsSent: '📧',
      emailsOpened: '👁️',
      emailsClicked: '🖱️',
      emailsReplied: '💬',
      emailsBounced: '⚠️',
      meetingBooked: '📅',
      emailsInterested: '✅',
      emailsNotInterested: '❌'
    };
    return icons[type] || '📌';
  };

  const getActivityLabel = (type) => {
    const labels = {
      emailsSent: 'Email Sent',
      emailsOpened: 'Email Opened',
      emailsClicked: 'Link Clicked',
      emailsReplied: 'Reply Received',
      emailsBounced: 'Email Bounced',
      meetingBooked: 'Meeting Booked',
      emailsInterested: 'Marked Interested',
      emailsNotInterested: 'Marked Not Interested'
    };
    return labels[type] || type;
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    return 'just now';
  };

  if (loading) {
    return (
      <div className="bg-white/95 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold mb-4">⚡ Recent Activities</h3>
        <div className="text-center py-8">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 rounded-2xl p-6 shadow-xl max-h-96 overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">⚡ Recent Activities</h3>
      <div className="space-y-3">
        {activities.map((activity, i) => (
          <div 
            key={i}
            className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-600 hover:shadow-md transition-shadow"
          >
            <div className="font-semibold text-purple-600 mb-1">
              {getActivityIcon(activity.type)} {getActivityLabel(activity.type)}
            </div>
            <div className="text-sm text-gray-700">
              <strong>{activity.leadName}</strong> ({activity.leadEmail})
              <br />
              Campaign: {activity.campaignName} - Step {activity.step}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {getTimeAgo(activity.date)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}