import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  height?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 4, height = '20px' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', padding: '10px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            width: `${100 - (i % 3) * 15}%`,
            background: 'linear-gradient(90deg, var(--bg-surface-2) 25%, var(--bg-surface-3) 50%, var(--bg-surface-2) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-pulse 1.5s infinite ease-in-out',
            borderRadius: 'var(--radius-sm)',
          }}
        />
      ))}
      <style>{`
        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};
