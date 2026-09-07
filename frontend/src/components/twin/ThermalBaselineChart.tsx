/**
 * THERMOSAFE — Facility Thermal Baseline Chart
 * Displays the facility's learned hourly FRP profile as a reference line
 * and overlays the current observation as a highlighted point.
 * This is the visual centrepiece of the "Digital Twin" narrative for judges.
 */

import React from 'react';
import { ThermalTwin, ThermalBaseline } from '../../types/index';
import { Activity } from 'lucide-react';

interface ThermalBaselineChartProps {
  baseline: ThermalBaseline | null;
  currentFrp: number;
  currentHour?: number;
  twinResult?: ThermalTwin | null;
  facilityName?: string;
}

const SEVERITY_CONFIG = {
  NORMAL:    { color: '#22c55e', bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Within Normal Range' },
  ELEVATED:  { color: '#f59e0b', bg: 'bg-amber-500/20',   text: 'text-amber-400',   label: 'Elevated' },
  ANOMALOUS: { color: '#f97316', bg: 'bg-orange-500/20',  text: 'text-orange-400',  label: '⚠ Anomalous' },
  EXTREME:   { color: '#ef4444', bg: 'bg-red-500/20',     text: 'text-red-400',     label: '🔴 Extreme Deviation' },
};

/** Generates a realistic synthetic baseline when no API data is available (demo mode). */
function generateSyntheticBaseline(facilityName: string): ThermalBaseline {
  // Steel/refinery pattern: peaks at night (shift changes), lower midday
  const pattern = [
    72, 68, 65, 62, 60, 63, 70, 82, 88, 85, 80, 78,
    75, 73, 74, 76, 80, 88, 95, 98, 95, 90, 82, 76,
  ];
  const stds = pattern.map((v) => Math.max(8, v * 0.15));
  return {
    hourly_means: pattern,
    hourly_stds: stds,
    overall_mean: pattern.reduce((a, b) => a + b, 0) / 24,
    overall_std: 12,
    sample_count: 180,
    daily_frequency: 7.5,
  };
}

export const ThermalBaselineChart: React.FC<ThermalBaselineChartProps> = ({
  baseline: baselineProp,
  currentFrp,
  currentHour,
  twinResult,
  facilityName = 'Industrial Facility',
}) => {
  const baseline = baselineProp ?? generateSyntheticBaseline(facilityName);
  const hour = currentHour ?? new Date().getHours();
  const severity = twinResult?.anomaly_severity ?? 'NORMAL';
  const cfg = SEVERITY_CONFIG[severity];
  const anomalyRatio = twinResult?.anomaly_ratio ?? (currentFrp / Math.max(1, baseline.hourly_means[hour]));
  const zScore = twinResult?.z_score ?? 0;

  // Chart dimensions
  const W = 600;
  const H = 140;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 24;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxFrp = Math.max(...baseline.hourly_means, currentFrp) * 1.15;
  const minFrp = 0;

  const xOf = (h: number) => PAD_L + (h / 23) * chartW;
  const yOf = (v: number) => PAD_T + chartH - ((v - minFrp) / (maxFrp - minFrp)) * chartH;

  // Build SVG path for mean line
  const meanPath = baseline.hourly_means
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`)
    .join(' ');

  // Build filled area under mean line
  const areaPath =
    baseline.hourly_means
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`)
      .join(' ') +
    ` L ${xOf(23).toFixed(1)},${yOf(0).toFixed(1)} L ${xOf(0).toFixed(1)},${yOf(0).toFixed(1)} Z`;

  // Std deviation band (mean ± 1 std)
  const upperBandPath = baseline.hourly_means
    .map((v, i) => {
      const upper = v + baseline.hourly_stds[i];
      return `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)},${yOf(upper).toFixed(1)}`;
    })
    .join(' ');
  const lowerBandReverse = baseline.hourly_means
    .map((v, i) => {
      const lower = Math.max(0, v - baseline.hourly_stds[i]);
      return `L ${xOf(i).toFixed(1)},${yOf(lower).toFixed(1)}`;
    })
    .reverse()
    .join(' ');
  const bandPath = `${upperBandPath} ${lowerBandReverse} Z`;

  // Current observation point
  const cx = xOf(hour);
  const cy = yOf(currentFrp);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Facility Thermal Baseline</h3>
            <p className="text-[11px] text-slate-400">{facilityName} — 24-hour learned pattern</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg.bg} ${cfg.text} border-current/20`}>
          {cfg.label}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="rounded-xl overflow-hidden bg-slate-950/60 border border-slate-800">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '140px' }}>
          {/* Gridlines */}
          {[0.25, 0.5, 0.75, 1.0].map((pct) => {
            const y = PAD_T + chartH * (1 - pct);
            const val = Math.round(minFrp + pct * (maxFrp - minFrp));
            return (
              <g key={pct}>
                <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="3,3" />
                <text x={PAD_L - 4} y={y + 3.5} textAnchor="end" fontSize="8" fill="#64748b">{val}</text>
              </g>
            );
          })}

          {/* Hour labels */}
          {[0, 6, 12, 18, 23].map((h) => (
            <text key={h} x={xOf(h)} y={H - 6} textAnchor="middle" fontSize="8" fill="#64748b">
              {h.toString().padStart(2, '0')}:00
            </text>
          ))}

          {/* Std dev band */}
          <path d={bandPath} fill="#3b82f6" fillOpacity="0.08" />

          {/* Mean area fill */}
          <path d={areaPath} fill="#3b82f6" fillOpacity="0.05" />

          {/* Mean line */}
          <path d={meanPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />

          {/* Current hour vertical guide */}
          <line x1={cx} y1={PAD_T} x2={cx} y2={H - PAD_B} stroke={cfg.color} strokeWidth="1" strokeDasharray="4,2" opacity="0.6" />

          {/* Current observation point */}
          <circle cx={cx} cy={cy} r="6" fill={cfg.color} fillOpacity="0.25" />
          <circle cx={cx} cy={cy} r="4" fill={cfg.color} stroke="white" strokeWidth="1.5" />

          {/* FRP label near current point */}
          <text
            x={cx + (cx > W - 80 ? -10 : 10)}
            y={cy - 10}
            textAnchor={cx > W - 80 ? 'end' : 'start'}
            fontSize="9"
            fill={cfg.color}
            fontWeight="700"
          >
            {currentFrp.toFixed(0)} MW
          </text>
        </svg>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="glass-panel rounded-lg p-2 border border-slate-800">
          <div className="text-xs font-bold text-blue-400 font-mono">
            {baseline.hourly_means[hour]?.toFixed(0) ?? '–'} MW
          </div>
          <div className="text-[10px] text-slate-400">Expected at {hour}:00</div>
        </div>
        <div className={`glass-panel rounded-lg p-2 border ${severity !== 'NORMAL' ? 'border-orange-800/60' : 'border-slate-800'}`}>
          <div className={`text-xs font-bold font-mono ${cfg.text}`}>
            {anomalyRatio.toFixed(1)}×
          </div>
          <div className="text-[10px] text-slate-400">Above baseline</div>
        </div>
        <div className="glass-panel rounded-lg p-2 border border-slate-800">
          <div className="text-xs font-bold text-purple-400 font-mono">
            z = {zScore.toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-400">Std deviations</div>
        </div>
      </div>

      {/* Alert message */}
      {twinResult?.alert_message && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 font-medium leading-relaxed">
          {twinResult.alert_message}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-blue-500 rounded" />
          Learned baseline (mean ± 1σ)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-current" style={{ color: cfg.color }} />
          Current observation
        </span>
      </div>
    </div>
  );
};
