import React from 'react';

interface RiskMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/** Composite hazard index drawn as an instrument dial with measurement ticks. */
export const RiskMeter: React.FC<RiskMeterProps> = ({ score, size = 'md', showLabel = true }) => {
  const value = Math.max(0, Math.min(100, Math.round(score)));

  const band =
    value >= 80
      ? { stroke: '#D42200', text: 'text-risk-critical', label: 'CRITICAL HAZARD' }
      : value >= 60
      ? { stroke: '#F74B00', text: 'text-risk-elevated', label: 'ELEVATED RISK' }
      : value >= 35
      ? { stroke: '#B47A00', text: 'text-risk-moderate', label: 'MODERATE / ROUTINE' }
      : { stroke: '#1B7A4B', text: 'text-risk-low', label: 'LOW RISK' };

  const radius = size === 'sm' ? 24 : size === 'lg' ? 54 : 38;
  const strokeWidth = size === 'sm' ? 5 : size === 'lg' ? 10 : 7;
  const box = (radius + strokeWidth + 6) * 2;
  const center = box / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  // Measurement ticks every 10 units around the dial
  const ticks = Array.from({ length: 20 }, (_, i) => i * 18);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg width={box} height={box} className="-rotate-90">
          {ticks.map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const outer = radius + strokeWidth / 2 + 5;
            const inner = outer - (i % 5 === 0 ? 5 : 2.5);
            return (
              <line
                key={deg}
                x1={center + Math.cos(rad) * inner}
                y1={center + Math.sin(rad) * inner}
                x2={center + Math.cos(rad) * outer}
                y2={center + Math.sin(rad) * outer}
                stroke="#0A0A0A"
                strokeWidth={1}
                opacity={i % 5 === 0 ? 0.55 : 0.25}
              />
            );
          })}

          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#0A0A0A"
            strokeOpacity={0.12}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={band.stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span
            className={`font-display font-extrabold leading-none ${band.text} ${
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-4xl' : 'text-2xl'
            }`}
          >
            {value}
          </span>
          {size !== 'sm' && (
            <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
              / 100
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        <span className={`mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${band.text}`}>
          {band.label}
        </span>
      )}
    </div>
  );
};
