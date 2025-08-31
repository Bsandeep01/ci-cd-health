import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  type: 'success' | 'danger' | 'warning' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, type }) => {
  return (
    <div className="metric-card">
      <div className={`metric-value metric-${type}`}>
        {value}
      </div>
      <div className="metric-label">
        {title}
      </div>
    </div>
  );
};

export default MetricCard;
