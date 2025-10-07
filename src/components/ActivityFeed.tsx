'use client';

import { RecentActivity } from '@/types';

interface ActivityFeedProps {
  activities: RecentActivity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'emailsSent':
        return '📧';
      case 'emailsOpened':
        return '👀';
      case 'emailsClicked':
        return '👆';
      case 'emailsReplied':
        return '💬';
      case 'emailsBounced':
        return '🚫';
      case 'emailsUnsubscribed':
        return '❌';
      case 'emailsInterested':
        return '👍';
      case 'emailsNotInterested':
        return '👎';
      case 'meetingBooked':
        return '📅';
      default:
        return '⚡';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'emailsSent':
        return 'border-blue-500';
      case 'emailsOpened':
        return 'border-green-500';
      case 'emailsClicked':
        return 'border-purple-500';
      case 'emailsReplied':
        return 'border-yellow-500';
      case 'emailsBounced':
        return 'border-red-500';
      case 'emailsUnsubscribed':
        return 'border-gray-500';
      case 'emailsInterested':
        return 'border-green-600';
      case 'emailsNotInterested':
        return 'border-orange-500';
      case 'meetingBooked':
        return 'border-indigo-500';
      default:
        return 'border-blue-500';
    }
  };

  const getActivityTitle = (type: string) => {
    switch (type) {
      case 'emailsSent':
        return 'Email Sent';
      case 'emailsOpened':
        return 'Email Opened';
      case 'emailsClicked':
        return 'Email Clicked';
      case 'emailsReplied':
        return 'Email Reply';
      case 'emailsBounced':
        return 'Email Bounced';
      case 'emailsUnsubscribed':
        return 'Unsubscribed';
      case 'emailsInterested':
        return 'Marked Interested';
      case 'emailsNotInterested':
        return 'Not Interested';
      case 'meetingBooked':
        return 'Meeting Booked';
      default:
        return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays > 7) {
      return date.toLocaleDateString();
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="bg-white bg-opacity-95 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        ⚡ Recent Activities
      </h3>
      
      <div className="max-h-96 overflow-y-auto space-y-3">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div
              key={index}
              className={`p-4 bg-gray-50 rounded-lg border-l-4 ${getActivityColor(activity.type)} transition-all duration-200 hover:shadow-md hover:transform hover:translate-x-1`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-600 text-sm mb-1">
                      {getActivityTitle(activity.type)}
                    </div>
                    <div className="text-sm text-gray-900 mb-1">
                      {activity.leadName || activity.leadEmail}
                    </div>
                    <div className="text-xs text-gray-600">
                      Campaign: {activity.campaignName}
                      {activity.step && ` • Step ${activity.step}`}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatTimeAgo(activity.date)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No recent activities</p>
            <p className="text-sm">Activities will appear here when data is synced</p>
          </div>
        )}
      </div>
    </div>
  );
}