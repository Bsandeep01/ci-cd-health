import React, { useState, useEffect } from 'react';
import { getMetrics } from '../services/api';
import { MetricsData } from '../types';
import MetricCard from '../components/MetricCard';
import RecentActivity from '../components/RecentActivity';
import WorkflowBreakdown from '../components/WorkflowBreakdown';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchMetrics();
  }, [days]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMetrics(days);
      if (response.success && response.data) {
        setMetrics(response.data);
      } else {
        setError(response.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError('Failed to fetch metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchMetrics}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="card">
        <div className="text-center">
          <h3>No Data Available</h3>
          <p>No metrics data is available for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Pipeline Overview</h2>
          <div>
            <select
              className="form-control"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-4">
        <MetricCard
          title="Total Runs"
          value={metrics.summary.totalRuns}
          type="info"
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.summary.successRate.toFixed(1)}%`}
          type="success"
        />
        <MetricCard
          title="Failure Rate"
          value={`${metrics.summary.failureRate.toFixed(1)}%`}
          type="danger"
        />
        <MetricCard
          title="Avg Build Time"
          value={`${metrics.summary.averageBuildTime.toFixed(1)} min`}
          type="warning"
        />
      </div>

      {/* Last Build Status */}
      {metrics.lastBuild && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Last Build Status</h3>
          </div>
          <div className="d-flex justify-between align-center">
            <div>
              <h4>{metrics.lastBuild.name} #{metrics.lastBuild.run_number}</h4>
              <p>Branch: {metrics.lastBuild.head_branch}</p>
              <p>Commit: {metrics.lastBuild.head_sha.substring(0, 8)}</p>
              <p>Triggered by: {metrics.lastBuild.actor?.login || 'Unknown'}</p>
            </div>
            <div className="text-right">
              <span className={`status-badge ${
                metrics.lastBuild.is_success ? 'status-success' : 
                metrics.lastBuild.is_failure ? 'status-failure' : 'status-pending'
              }`}>
                {metrics.lastBuild.conclusion || metrics.lastBuild.status}
              </span>
              {metrics.lastBuild.duration_minutes && (
                <p className="mt-2">
                  Duration: {metrics.lastBuild.duration_minutes.toFixed(1)} min
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workflow Breakdown */}
      <div className="grid grid-2">
        <WorkflowBreakdown data={metrics.workflowBreakdown} />
        <RecentActivity data={metrics.recentActivity} />
      </div>
    </div>
  );
};

export default Dashboard;
