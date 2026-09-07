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
      className={`glass-panel p-5 rounded-2xl border transition-all duration-300 hover:border-slate-600 hover:shadow-lg relative overflow-hidden group ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-100 font-mono mt-2 tracking-tight">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 text-slate-200 border border-slate-700/60 shadow-inner group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
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

