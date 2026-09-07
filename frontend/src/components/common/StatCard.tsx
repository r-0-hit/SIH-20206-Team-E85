import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  /** Rule colour along the top edge of the card */
  accentColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive,
  accentColor = 'bg-blueprint',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`sheet shadow-hard-sm group relative overflow-hidden p-4 transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard' : ''
      }`}
    >
      {/* Measurement rule along the top edge */}
      <div className={`absolute inset-x-0 top-0 h-1 ${accentColor}`} />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
            {title}
          </p>
          <p className="kpi mt-2">{value}</p>
          {subtitle && (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              {subtitle}
            </p>
          )}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink bg-paper text-ink transition-colors duration-150 group-hover:bg-signal group-hover:text-white">
          {icon}
        </span>
      </div>

      {trend && (
        <div className="mt-3 flex items-center justify-between border-t border-ink/15 pt-2 font-mono text-[10px] uppercase tracking-wider">
          <span className={trendPositive ? 'font-bold text-risk-low' : 'font-bold text-signal'}>
            {trend}
          </span>
          <span className="text-ink-faint">vs 7-day</span>
        </div>
      )}
    </div>
  );
};
