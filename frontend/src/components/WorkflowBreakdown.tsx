import React from 'react';
import { WorkflowBreakdown as WorkflowBreakdownType } from '../types';

interface WorkflowBreakdownProps {
  data: WorkflowBreakdownType;
}

const WorkflowBreakdown: React.FC<WorkflowBreakdownProps> = ({ data }) => {
  const workflows = Object.entries(data).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Workflow Breakdown</h3>
      </div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Total</th>
              <th>Success</th>
              <th>Failure</th>
              <th>Success Rate</th>
              <th>Avg Duration</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map(([name, stats]) => {
              const successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
              return (
                <tr key={name}>
                  <td>
                    <strong>{name}</strong>
                  </td>
                  <td>{stats.total}</td>
                  <td>
                    <span className="metric-success">{stats.success}</span>
                  </td>
                  <td>
                    <span className="metric-danger">{stats.failure}</span>
                  </td>
                  <td>
                    <span className={`metric-${successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'danger'}`}>
                      {successRate.toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    {stats.averageDuration > 0 
                      ? `${stats.averageDuration.toFixed(1)} min`
                      : '-'
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkflowBreakdown;
