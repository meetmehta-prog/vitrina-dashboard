'use client';

import { useState } from 'react';
import { ExecutiveMetrics } from '@/types';
import FilteredLeadsModal from './FilteredLeadsModal';

interface MetricsGridProps {
  metrics: ExecutiveMetrics;
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    filterType: '',
    title: ''
  });
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const openLeadsModal = (filterType: string, title: string) => {
    setModalState({
      isOpen: true,
      filterType,
      title
    });
  };

  const scrollToCampaigns = () => {
    const element = document.getElementById('campaign-performance-section');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      filterType: '',
      title: ''
    });
  };

  const metricCards = [
    {
      icon: '🎯',
      value: metrics.totalCampaigns,
      label: 'Total Campaigns',
      sublabel: `${metrics.runningCampaigns} Running • ${metrics.archivedCampaigns} Archived`,
      clickable: true,
      onClick: scrollToCampaigns,
      clickTitle: 'View Campaign Performance'
    },
    {
      icon: '👥',
      value: formatNumber(metrics.totalLeads),
      label: 'Total Leads',
      sublabel: 'Across all campaigns',
      clickable: true,
      filterType: 'all',
      clickTitle: 'All Leads'
    },
    {
      icon: '📧',
      value: formatNumber(metrics.totalEmailsSent),
      label: 'Emails Sent',
      sublabel: 'Total outreach volume',
      clickable: false
    },
    {
      icon: '📈',
      value: `${metrics.avgOpenRate}%`,
      label: 'Avg Open Rate',
      sublabel: 'Email engagement',
      clickable: true,
      filterType: 'opened',
      clickTitle: 'Leads Who Opened Emails'
    },
    {
      icon: '👆',
      value: `${metrics.avgCTR}%`,
      label: 'Avg Click Rate',
      sublabel: 'Link engagement',
      clickable: true,
      filterType: 'clicked',
      clickTitle: 'Leads Who Clicked Links'
    },
    {
      icon: '💬',
      value: formatNumber(metrics.totalReplies),
      label: 'Total Replies',
      sublabel: `${metrics.avgReplyRate}% avg reply rate`,
      clickable: true,
      filterType: 'replied',
      clickTitle: 'Leads Who Replied'
    },
    {
      icon: '📅',
      value: formatNumber(metrics.totalMeetings),
      label: 'Meetings Booked',
      sublabel: 'Qualified conversations',
      clickable: false
    },
    {
      icon: '✅',
      value: formatNumber(metrics.completedCampaigns),
      label: 'Completed',
      sublabel: 'Finished campaigns',
      clickable: false
    }
  ];

  return (
    <>
      <div className="metrics-grid">
        {metricCards.map((card, index) => (
          <div 
            key={index} 
            className={`metric-card ${card.clickable ? 'clickable' : ''}`}
            onClick={() => {
              if (card.clickable) {
                if (card.onClick) {
                  card.onClick();
                } else if (card.filterType && card.clickTitle) {
                  openLeadsModal(card.filterType, card.clickTitle);
                }
              }
            }}
          >
            <span className="metric-icon">{card.icon}</span>
            <div className="metric-value">{card.value}</div>
            <div className="metric-label">{card.label}</div>
            <div className="metric-sublabel">{card.sublabel}</div>
            {card.clickable && (
              <div className="click-indicator">
                <span>{card.clickTitle || 'Click to view details'}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <FilteredLeadsModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        filterType={modalState.filterType}
        title={modalState.title}
      />

      <style jsx>{`
        .metric-card.clickable {
          cursor: pointer;
          transition: all 0.2s ease;
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
      `}</style>
    </>
  );
}