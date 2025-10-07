import { useState, useEffect } from 'react';

export default function AllLeadsModal({ type, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData(1);
  }, [type]);

  const loadData = async (page) => {
    setLoading(true);
    try {
      const endpoint = type === 'leads' ? '/api/leads-paginated' : '/api/replies-paginated';
      const response = await fetch(`${endpoint}?page=${page}&pageSize=50`);
      const result = await response.json();
      setData(result);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-3xl font-bold">
            {type === 'leads' ? '👥 All Leads' : '💬 All Replies'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="text-center py-8">
              <div className="spinner"></div>
              <p>Loading {type}...</p>
            </div>
          ) : data ? (
            <>
              {type === 'leads' ? (
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Lead Name</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Sent</th>
                      <th>Opens</th>
                      <th>Clicks</th>
                      <th>Replies</th>
                      <th>Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.leads.map((lead, i) => (
                      <tr key={i}>
                        <td className="text-sm">{lead.campaignName}</td>
                        <td className="font-semibold">{lead.leadName}</td>
                        <td>{lead.leadEmail}</td>
                        <td>{lead.companyName}</td>
                        <td>{lead.phone}</td>
                        <td>
                          <span className={`status-badge ${
                            lead.status === 'active' ? 'status-active' : 
                            lead.status === 'bounced' ? 'status-ended' : 'status-paused'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td>{lead.emailsSent}</td>
                        <td>{lead.opens}</td>
                        <td>{lead.clicks}</td>
                        <td className="font-bold">{lead.replies}</td>
                        <td>{lead.lastActivityDate ? new Date(lead.lastActivityDate).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Reply Date</th>
                      <th>Campaign</th>
                      <th>Lead Name</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Step</th>
                      <th>First Reply</th>
                      <th>Response Time</th>
                      <th>Content Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.replies.map((reply, i) => (
                      <tr key={i}>
                        <td>{new Date(reply.replyDate).toLocaleString()}</td>
                        <td className="text-sm">{reply.campaignName}</td>
                        <td className="font-semibold">{reply.leadName}</td>
                        <td>{reply.leadEmail}</td>
                        <td>{reply.companyName}</td>
                        <td>Step {reply.stepNumber}</td>
                        <td>{reply.isFirstReply ? '✅ Yes' : 'No'}</td>
                        <td>{reply.responseTime ? `${reply.responseTime.toFixed(1)} hrs` : 'N/A'}</td>
                        <td>
                          <div className="max-w-xs truncate text-gray-600">
                            {reply.replyContent ? reply.replyContent.substring(0, 100) + '...' : 'No content'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Pagination */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => loadData(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="font-semibold">
                  Page {data.currentPage} of {data.totalPages} 
                  ({type === 'leads' ? data.totalLeads : data.totalReplies} total)
                </span>
                <button
                  onClick={() => loadData(currentPage + 1)}
                  disabled={currentPage === data.totalPages}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}