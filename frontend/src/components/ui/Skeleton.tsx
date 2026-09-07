import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

/** Placeholder used while KPI telemetry is still in flight. */
export const StatSkeleton: React.FC = () => (
  <div className="sheet shadow-hard-sm p-4">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="mt-3 h-8 w-20" />
    <Skeleton className="mt-3 h-2.5 w-28" />
  </div>
);
