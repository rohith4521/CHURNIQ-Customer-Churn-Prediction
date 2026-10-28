import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface RiskBadgeProps {
  tier?: string | null;
  probability?: number | null;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ tier, probability, showIcon = true }) => {
  // If tier not explicitly provided, deduce from probability
  let resolvedTier = tier;
  if (!resolvedTier && probability !== undefined && probability !== null) {
    if (probability >= 0.65) resolvedTier = 'High';
    else if (probability >= 0.35) resolvedTier = 'Medium';
    else resolvedTier = 'Low';
  }

  if (!resolvedTier) {
    return <span className="badge badge-neutral">Unassessed</span>;
  }

  const normalized = resolvedTier.toLowerCase();

  if (normalized === 'high' || normalized === 'yes') {
    return (
      <span className="badge badge-high" title={`High Risk: ${(probability ? (probability * 100).toFixed(1) + '%' : 'Critical')}`}>
        {showIcon && <AlertCircle size={13} />}
        <span>High Risk</span>
      </span>
    );
  }

  if (normalized === 'medium') {
    return (
      <span className="badge badge-medium" title={`Medium Risk: ${(probability ? (probability * 100).toFixed(1) + '%' : 'Moderate')}`}>
        {showIcon && <AlertTriangle size={13} />}
        <span>Medium Risk</span>
      </span>
    );
  }

  return (
    <span className="badge badge-low" title={`Low Risk: ${(probability ? (probability * 100).toFixed(1) + '%' : 'Retained')}`}>
      {showIcon && <CheckCircle size={13} />}
      <span>Low Risk</span>
    </span>
  );
};
