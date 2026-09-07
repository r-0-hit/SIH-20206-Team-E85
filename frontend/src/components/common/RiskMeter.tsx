import React from 'react';

interface RiskMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score, size = 'md', showLabel = true }) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  const getColor = () => {
    if (clampedScore >= 80) return { stroke: '#ef4444', text: 'text-red-400', label: 'CRITICAL HAZARD' };
    if (clampedScore >= 60) return { stroke: '#f97316', text: 'text-orange-400', label: 'ELEVATED RISK' };
    if (clampedScore >= 35) return { stroke: '#eab308', text: 'text-amber-400', label: 'MODERATE / ROUTINE' };
    return { stroke: '#10b981', text: 'text-emerald-400', label: 'LOW RISK' };
  };

  const { stroke, text, label } = getColor();

  const radius = size === 'sm' ? 24 : size === 'lg' ? 54 : 38;
  const strokeWidth = size === 'sm' ? 5 : size === 'lg' ? 9 : 7;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg
          width={(radius + strokeWidth) * 2}
          height={(radius + strokeWidth) * 2}
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Progress */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-extrabold ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-3xl' : 'text-xl'} ${text}`}>
            {clampedScore}
          </span>
          {size !== 'sm' && <span className="text-[10px] text-slate-400 font-medium -mt-1">/ 100</span>}
        </div>
      </div>

      {showLabel && (
        <span className={`mt-2 text-[11px] font-bold tracking-wider uppercase font-mono ${text}`}>
          {label}
        </span>
      )}
    </div>
  );
};

