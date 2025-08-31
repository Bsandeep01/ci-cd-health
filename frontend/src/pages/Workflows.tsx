import React, { useState, useEffect } from 'react';
import { getWorkflowRuns } from '../services/api';
import { WorkflowRun, WorkflowRunsResponse } from '../types';

const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
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
    status: '',
    conclusion: '',
    workflow_name: '',
    branch: '',
    days: 30
  });

  useEffect(() => {
    fetchWorkflows();
  }, [pagination.page, filters]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWorkflowRuns(pagination.page, pagination.limit, filters);
      if (response.success && response.data) {
        setWorkflows(response.data.workflowRuns);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Failed to fetch workflows');
      }
    } catch (err) {
      setError('Failed to fetch workflows');
      console.error('Error fetching workflows:', err);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (isSuccess: boolean, isFailure: boolean) => {
    if (isSuccess) return 'status-success';
    if (isFailure) return 'status-failure';
    return 'status-pending';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading workflows...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchWorkflows}>
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
          <h2 className="card-title">Workflow Runs</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Filters</h3>
        </div>
        <div className="grid grid-4">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="waiting">Waiting</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Conclusion</label>
            <select
              className="form-control"
              value={filters.conclusion}
              onChange={(e) => handleFilterChange('conclusion', e.target.value)}
            >
              <option value="">All Conclusions</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="cancelled">Cancelled</option>
              <option value="skipped">Skipped</option>
              <option value="timed_out">Timed Out</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Workflow Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by workflow name"
              value={filters.workflow_name}
              onChange={(e) => handleFilterChange('workflow_name', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Branch</label>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by branch"
              value={filters.branch}
              onChange={(e) => handleFilterChange('branch', e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Time Period</label>
          <select
            className="form-control"
            value={filters.days}
            onChange={(e) => handleFilterChange('days', e.target.value)}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Workflows Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Workflow Runs ({pagination.total} total)</h3>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Branch</th>
                <th>Commit</th>
                <th>Duration</th>
                <th>Triggered By</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => (
                <tr key={workflow.id}>
                  <td>
                    <strong>{workflow.name}</strong>
                    <br />
                    <small>#{workflow.run_number}</small>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(workflow.is_success, workflow.is_failure)}`}>
                      {workflow.conclusion || workflow.status}
                    </span>
                  </td>
                  <td>{workflow.head_branch}</td>
                  <td>
                    <code>{workflow.head_sha.substring(0, 8)}</code>
                  </td>
                  <td>
                    {workflow.duration_minutes 
                      ? `${workflow.duration_minutes.toFixed(1)} min`
                      : '-'
                    }
                  </td>
                  <td>{workflow.actor?.login || 'Unknown'}</td>
                  <td>{formatDate(workflow.created_at)}</td>
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

export default Workflows;
