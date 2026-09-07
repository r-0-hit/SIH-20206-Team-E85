import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, hint, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
    <div className="flex h-12 w-12 items-center justify-center border-2 border-dashed border-ink/30 text-ink-faint">
      {icon}
    </div>
    <p className="font-display text-sm font-extrabold uppercase tracking-tight text-ink">{title}</p>
    {hint && <p className="max-w-sm font-mono text-[11px] uppercase tracking-wider text-ink-muted">{hint}</p>}
    {action}
  </div>
);
