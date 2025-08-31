import React, { useState, useEffect } from 'react';
import { getAlerts, sendTestAlert, retryAlert } from '../services/api';
import { Alert, AlertsResponse } from '../types';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    workflow_run_id: ''
  });
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [pagination.page, filters]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAlerts(pagination.page, pagination.limit, filters);
      if (response.success && response.data) {
        setAlerts(response.data.alerts);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError('Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleSendTestAlert = async () => {
    if (!testEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      setSendingTest(true);
      const response = await sendTestAlert(testEmail);
      if (response.success) {
        alert('Test alert sent successfully!');
        setTestEmail('');
        fetchAlerts(); // Refresh the list
      } else {
        alert(`Failed to send test alert: ${response.error}`);
      }
    } catch (err) {
      alert('Failed to send test alert');
      console.error('Error sending test alert:', err);
    } finally {
      setSendingTest(false);
    }
  };

  const handleRetryAlert = async (alertId: number) => {
    try {
      const response = await retryAlert(alertId);
      if (response.success) {
        alert('Alert retry initiated successfully!');
        fetchAlerts(); // Refresh the list
      } else {
        alert(`Failed to retry alert: ${response.error}`);
      }
    } catch (err) {
      alert('Failed to retry alert');
      console.error('Error retrying alert:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'sent':
        return 'status-success';
      case 'failed':
        return 'status-failure';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '📧';
      case 'slack':
        return '💬';
      case 'webhook':
        return '🔗';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading alerts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchAlerts}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Alerts</h2>
        </div>
      </div>

      {/* Test Alert */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Send Test Alert</h3>
        </div>
        <div className="d-flex align-center">
          <input
            type="email"
            className="form-control"
            placeholder="Enter email address"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            style={{ marginRight: '1rem' }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSendTestAlert}
            disabled={sendingTest}
          >
            {sendingTest ? 'Sending...' : 'Send Test Alert'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Filters</h3>
        </div>
        <div className="grid grid-3">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-control"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Workflow Run ID</label>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by workflow run ID"
              value={filters.workflow_run_id}
              onChange={(e) => handleFilterChange('workflow_run_id', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Alert History ({pagination.total} total)</h3>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Status</th>
                <th>Recipient</th>
                <th>Workflow</th>
                <th>Created</th>
                <th>Sent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>
                    <span style={{ fontSize: '1.2rem' }}>
                      {getTypeIcon(alert.type)}
                    </span>
                    <br />
                    <small>{alert.type}</small>
                  </td>
                  <td>
                    <strong>{alert.title}</strong>
                    <br />
                    <small style={{ color: '#6c757d' }}>
                      {alert.message.substring(0, 50)}...
                    </small>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(alert.status)}`}>
                      {alert.status}
                    </span>
                    {alert.retry_count > 0 && (
                      <br />
                      <small>Retries: {alert.retry_count}</small>
                    )}
                  </td>
                  <td>{alert.recipient || '-'}</td>
                  <td>
                    {alert.workflow_name ? (
                      <>
                        <strong>{alert.workflow_name}</strong>
                        {alert.workflow_run_id && (
                          <br />
                          <small>Run #{alert.workflow_run_id}</small>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{formatDate(alert.created_at)}</td>
                  <td>
                    {alert.sent_at ? formatDate(alert.sent_at) : '-'}
                  </td>
                  <td>
                    {alert.status === 'failed' && alert.retry_count < 3 && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleRetryAlert(alert.id)}
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="d-flex justify-between align-center mt-3">
            <div>
              <span>
                Page {pagination.page} of {pagination.totalPages} 
                ({pagination.total} total items)
              </span>
            </div>
            <div>
              <button
                className="btn btn-secondary btn-sm"
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary btn-sm ml-2"
                disabled={!pagination.hasNext}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
