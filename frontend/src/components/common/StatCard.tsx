import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
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
  accentColor = 'border-blue-500/30',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card group relative overflow-hidden p-5 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 font-mono text-2xl font-extrabold tracking-tight text-slate-50 lg:text-3xl">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-slate-200 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
          <span className={trendPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {trend}
          </span>
          <span className="text-slate-400">vs 7-day baseline</span>
        </div>
      )}

      {/* Subtle top indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />
    </div>
  );
};

