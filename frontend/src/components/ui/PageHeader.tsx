import React from 'react';

interface PageHeaderProps {
  /** Sheet number in the drawing set, e.g. "DWG 02" */
  sheet?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/** The heavy underscored title that opens every sheet in the drawing set. */
export const PageHeader: React.FC<PageHeaderProps> = ({
  sheet,
  title,
  description,
  actions,
}) => (
  <header className="rule-underline flex flex-col gap-4 pb-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {sheet && (
        <div className="mb-2 flex items-center gap-2">
          <span className="tag-solid">{sheet}</span>
          <span className="h-px w-10 bg-ink/30" />
        </div>
      )}
      <h1 className="rule-title">{title}</h1>
      {description && (
        <p className="mt-2 max-w-3xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.08em] text-ink-muted">
          {description}
        </p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);
