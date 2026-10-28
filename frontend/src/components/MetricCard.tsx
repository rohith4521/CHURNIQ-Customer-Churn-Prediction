import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor = 'var(--accent-primary)',
  tooltip,
}) => {
  return (
    <div className="metric-card" title={tooltip}>
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        {subValue && <div className="metric-sub">{subValue}</div>}
      </div>
      <div className="metric-icon-wrap" style={{ color: iconColor }}>
        <Icon size={22} />
      </div>
    </div>
  );
};
