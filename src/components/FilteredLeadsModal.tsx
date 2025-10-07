'use client';

import { useState, useEffect } from 'react';

interface Lead {
  id: number;
  leadEmail: string;
  leadName: string;
  companyName: string;
  campaignName: string;
  status: string;
  opens: number;
  clicks: number;
  replies: number;
  lastActivityDate: string;
  lastActivityType: string;
}

interface FilteredLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterType: string;
  title: string;
  campaignId?: string;
}

export default function FilteredLeadsModal({ isOpen, onClose, filterType, title, campaignId }: FilteredLeadsModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  useEffect(() => {
    if (isOpen && filterType) {
      fetchFilteredLeads();
    }
  }, [isOpen, filterType, currentPage, campaignId]);

  const fetchFilteredLeads = async () => {
    setLoading(true);
    try {
      const campaignParam = campaignId ? `&campaignId=${campaignId}` : '';
      const response = await fetch(`/api/leads/filtered?type=${filterType}&page=${currentPage}&pageSize=50${campaignParam}`);
      const data = await response.json();
      
      if (response.ok) {
        setLeads(data.leads);
        setTotalPages(data.pagination.totalPages);
        setTotalLeads(data.pagination.totalLeads);
      } else {
        console.error('Failed to fetch filtered leads:', data.message);
      }
    } catch (error) {
      console.error('Error fetching filtered leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getFilterDescription = (type: string) => {
    switch (type) {
      case 'opened': return 'Leads who have opened emails';
      case 'clicked': return 'Leads who have clicked email links';
      case 'replied': return 'Leads who have replied to emails';
      case 'bounced': return 'Leads with bounced emails';
      case 'all': return 'All leads across campaigns';
      default: return 'Filtered leads';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <p className="modal-subtitle">{getFilterDescription(filterType)}</p>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading leads...</p>
            </div>
          ) : (
            <>
              <div className="leads-summary">
                <p><strong>{totalLeads}</strong> leads found</p>
                {totalPages > 1 && (
                  <div className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                )}
              </div>

              <div className="leads-table-container">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>Lead Name</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th>Opens</th>
                      <th>Clicks</th>
                      <th>Replies</th>
                      <th>Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div className="lead-name">
                            {lead.leadName || 'Unknown'}
                          </div>
                        </td>
                        <td>
                          <div className="lead-email">
                            {lead.leadEmail}
                          </div>
                        </td>
                        <td>
                          <div className="company-name">
                            {lead.companyName || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div className="campaign-name">
                            {lead.campaignName}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${lead.status}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="metric-cell">{lead.opens}</td>
                        <td className="metric-cell">{lead.clicks}</td>
                        <td className="metric-cell">{lead.replies}</td>
                        <td>
                          <div className="activity-info">
                            <div className="activity-date">{formatDate(lead.lastActivityDate)}</div>
                            <div className="activity-type">{lead.lastActivityType || 'N/A'}</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i;
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .large-modal {
          width: 95%;
          max-width: 1200px;
          max-height: 90vh;
          overflow: hidden;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
        }

        .modal-header h2 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .modal-subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .modal-body {
          padding: 24px;
          flex: 1;
          overflow: auto;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .leads-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .pagination-info {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .leads-table-container {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: auto;
          max-height: 400px;
        }

        .leads-table {
          width: 100%;
          border-collapse: collapse;
        }

        .leads-table th {
          background: #f8fafc;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .leads-table td {
          padding: 12px;
          border-bottom: 1px solid #f3f4f6;
        }

        .leads-table tbody tr:hover {
          background: #f8fafc;
        }

        .lead-name {
          font-weight: 500;
          color: #1f2937;
        }

        .lead-email {
          color: #3b82f6;
          font-size: 0.875rem;
        }

        .company-name {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .campaign-name {
          color: #1f2937;
          font-size: 0.875rem;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-active {
          background: #dcfce7;
          color: #166534;
        }

        .status-replied {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-bounced {
          background: #fecaca;
          color: #dc2626;
        }

        .metric-cell {
          text-align: center;
          font-weight: 500;
          color: #1f2937;
        }

        .activity-info {
          font-size: 0.875rem;
        }

        .activity-date {
          color: #1f2937;
          font-weight: 500;
        }

        .activity-type {
          color: #6b7280;
          text-transform: capitalize;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
        }

        .pagination-btn, .page-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .pagination-btn:hover:not(:disabled), .page-btn:hover {
          background: #f3f4f6;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .page-numbers {
          display: flex;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}