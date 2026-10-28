import React from 'react';
import { Database, Cpu, Presentation, ShieldCheck, Sparkles } from 'lucide-react';
import { DatasetSummary } from '../types';

interface HeaderProps {
  summary: DatasetSummary | null;
  activeModels: string[];
  onOpenPresentation: () => void;
}

export const Header: React.FC<HeaderProps> = ({ summary, activeModels, onOpenPresentation }) => {
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #FFF, #A5B4FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CHURNIQ
            </span>
            <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
              v1.0 PBL
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Statistical Machine Learning & Churn Intelligence Platform
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Dataset Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>
          <Database size={14} color="var(--accent-secondary)" />
          <span style={{ color: 'var(--text-secondary)' }}>Dataset:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {summary ? `IBM Telco (${summary.total_rows.toLocaleString()} records)` : 'Loading...'}
          </span>
        </div>

        {/* Model Engine Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>
          <Cpu size={14} color="var(--accent-primary)" />
          <span style={{ color: 'var(--text-secondary)' }}>Models:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {activeModels.length > 0 ? 'Logistic Regression & SVM Active' : 'Initializing...'}
          </span>
        </div>

        {/* PBL Presentation Button */}
        <button
          onClick={onOpenPresentation}
          className="btn btn-primary btn-sm"
          style={{ gap: '6px' }}
          title="Launch Interactive PBL Defense Presentation Mode"
        >
          <Presentation size={15} />
          <span>PBL Presentation</span>
        </button>
      </div>
    </header>
  );
};
