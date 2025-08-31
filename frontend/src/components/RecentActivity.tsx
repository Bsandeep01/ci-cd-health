import React from 'react';
import { RecentActivity as RecentActivityType } from '../types';

interface RecentActivityProps {
  data: RecentActivityType[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Recent Activity</h3>
      </div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Status</th>
              <th>Branch</th>
              <th>Duration</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((activity) => (
              <tr key={activity.id}>
                <td>
                  <strong>{activity.name}</strong>
                  <br />
                  <small>#{activity.run_number}</small>
                </td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(activity.is_success, activity.is_failure)}`}>
                    {activity.conclusion || activity.status}
                  </span>
                </td>
                <td>{activity.branch}</td>
                <td>
                  {activity.duration_minutes 
                    ? `${activity.duration_minutes.toFixed(1)} min`
                    : '-'
                  }
                </td>
                <td>{formatDate(activity.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentActivity;
