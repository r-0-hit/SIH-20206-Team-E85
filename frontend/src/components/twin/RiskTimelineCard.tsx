/**
 * THERMOSAFE — Risk Timeline Card
 * Shows the projected risk at NOW / +30 min / +60 min / +120 min.
 * This is the "predictive" panel — the centrepiece of the judge pitch.
 */

import React from 'react';
import { RiskTimeline } from '../../types/index';
import { TrendingUp, TrendingDown, Minus, Clock, AlertTriangle } from 'lucide-react';

interface RiskTimelineCardProps {
  timeline: RiskTimeline | null;
  loading?: boolean;
}

interface RiskTier {
  color: string;
  bg: string;
  border: string;
  label: string;
  emoji: string;
}

function getRiskTier(score: number): RiskTier {
  if (score >= 81) return { color: 'text-red-400',    bg: 'bg-red-950/50',    border: 'border-red-800/60',    label: 'CRITICAL',    emoji: '🔴' };
  if (score >= 61) return { color: 'text-orange-400', bg: 'bg-orange-950/50', border: 'border-orange-800/60', label: 'INVESTIGATE', emoji: '🟠' };
  if (score >= 31) return { color: 'text-amber-400',  bg: 'bg-amber-950/50',  border: 'border-amber-800/60',  label: 'WATCH',       emoji: '🟡' };
  return            { color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/50', label: 'NORMAL',      emoji: '🟢' };
}

interface TimeSlotProps {
  label: string;
  score: number;
  isCurrent?: boolean;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ label, score, isCurrent }) => {
  const tier = getRiskTier(score);
  return (
    <div
      className={`flex flex-col items-center p-3 rounded-xl border ${tier.bg} ${tier.border} ${
        isCurrent ? 'ring-1 ring-white/10' : ''
      } transition-all`}
    >
      <span className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-2xl mb-1">{tier.emoji}</span>
      <span className={`text-xl font-extrabold font-mono ${tier.color}`}>{score}</span>
      <span className="text-[9px] text-slate-400 font-mono mt-0.5">/100</span>
      <span className={`text-[10px] font-bold mt-1.5 px-1.5 py-0.5 rounded ${tier.bg} ${tier.color}`}>
        {tier.label}
      </span>
    </div>
  );
};

const TREND_CONFIG = {
  ESCALATING: {
    icon: TrendingUp,
    color: 'text-red-400',
    bg: 'bg-red-950/40',
    border: 'border-red-800/60',
    label: '↗ ESCALATING — Risk is growing',
  },
  STABLE: {
    icon: Minus,
    color: 'text-amber-400',
    bg: 'bg-amber-950/30',
    border: 'border-amber-800/40',
    label: '→ STABLE — Risk holding steady',
  },
  DECLINING: {
    icon: TrendingDown,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-800/40',
    label: '↘ DECLINING — Risk decreasing',
  },
};

/** Placeholder timeline used when the API hasn't responded yet (demo mode). */
function getDefaultTimeline(baseRisk: number): RiskTimeline {
  return {
    current: baseRisk,
    min_30: Math.min(99, Math.round(baseRisk * 1.08)),
    min_60: Math.min(99, Math.round(baseRisk * 1.14)),
    min_120: Math.min(99, Math.round(baseRisk * 1.2)),
    trend: baseRisk >= 70 ? 'ESCALATING' : 'STABLE',
    growth_rate_pct: 12,
    alert: baseRisk >= 70 ? '🔴 Potential escalation detected. Rapid thermal growth near monitored facility.' : null,
    lead_time_minutes: baseRisk >= 70 ? 90 : null,
  };
}

export const RiskTimelineCard: React.FC<RiskTimelineCardProps & { baseRisk?: number }> = ({
  timeline: timelineProp,
  loading,
  baseRisk = 65,
}) => {
  const timeline = timelineProp ?? getDefaultTimeline(baseRisk);
  const trendCfg = TREND_CONFIG[timeline.trend];
  const TrendIcon = trendCfg.icon;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Risk Trajectory</h3>
            <p className="text-[11px] text-slate-400">Projected over the next 2 hours</p>
          </div>
        </div>
        {timeline.growth_rate_pct > 0 && (
          <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
            FRP growth: +{timeline.growth_rate_pct.toFixed(0)}% /revisit
          </div>
        )}
      </div>

      {/* 4-column timeline */}
      <div className="grid grid-cols-4 gap-2">
        <TimeSlot label="NOW" score={timeline.current} isCurrent />
        <TimeSlot label="+30 min" score={timeline.min_30} />
        <TimeSlot label="+60 min" score={timeline.min_60} />
        <TimeSlot label="+2 hr"   score={timeline.min_120} />
      </div>

      {/* Trend indicator */}
      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${trendCfg.bg} ${trendCfg.border}`}>
        <TrendIcon className={`w-4 h-4 ${trendCfg.color} shrink-0`} />
        <span className={`text-xs font-semibold ${trendCfg.color}`}>{trendCfg.label}</span>
      </div>

      {/* Lead time */}
      {timeline.lead_time_minutes !== null && timeline.lead_time_minutes > 0 && (
        <div className="text-[11px] text-slate-400 font-mono px-1">
          ⏱ Risk projected to cross <strong className="text-red-400">80/100</strong> in approximately{' '}
          <strong className="text-white">{timeline.lead_time_minutes} min</strong>
        </div>
      )}

      {/* Alert banner */}
      {timeline.alert && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-800/60">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 leading-relaxed font-medium">{timeline.alert}</p>
        </div>
      )}
    </div>
  );
};
