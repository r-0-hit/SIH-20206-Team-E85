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
  swatch: string;
}

function getRiskTier(score: number): RiskTier {
  if (score >= 81)
    return { color: 'text-risk-critical', bg: 'bg-[#FDECE8]', border: 'border-risk-critical', swatch: 'bg-risk-critical', label: 'CRITICAL' };
  if (score >= 61)
    return { color: 'text-signal', bg: 'bg-signal-soft', border: 'border-signal', swatch: 'bg-signal', label: 'INVESTIGATE' };
  if (score >= 31)
    return { color: 'text-risk-moderate', bg: 'bg-[#FBF3E2]', border: 'border-risk-moderate', swatch: 'bg-risk-moderate', label: 'WATCH' };
  return { color: 'text-risk-low', bg: 'bg-[#EAF5EF]', border: 'border-risk-low', swatch: 'bg-risk-low', label: 'NORMAL' };
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
      className={`flex flex-col items-center border-2 p-3 transition-all duration-150 ${
        isCurrent ? 'border-ink bg-paper' : `${tier.border} ${tier.bg}`
      }`}
    >
      <span className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </span>
      <span className={`mb-2 h-2.5 w-8 ${tier.swatch}`} />
      <span className="font-display text-2xl font-extrabold leading-none text-ink">{score}</span>
      <span className="mt-0.5 font-mono text-[9px] text-ink-muted">/100</span>
      <span
        className={`mt-2 border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${tier.border} ${tier.color}`}
      >
        {tier.label}
      </span>
    </div>
  );
};

const TREND_CONFIG = {
  ESCALATING: {
    icon: TrendingUp,
    color: 'text-risk-critical',
    bg: 'bg-[#FDECE8]',
    border: 'border-risk-critical',
    label: '↗ ESCALATING — Risk is growing',
  },
  STABLE: {
    icon: Minus,
    color: 'text-risk-moderate',
    bg: 'bg-[#FBF3E2]',
    border: 'border-risk-moderate',
    label: '→ STABLE — Risk holding steady',
  },
  DECLINING: {
    icon: TrendingDown,
    color: 'text-risk-low',
    bg: 'bg-[#EAF5EF]',
    border: 'border-risk-low',
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
    alert: baseRisk >= 70 ? 'Potential escalation detected. Rapid thermal growth near monitored facility.' : null,
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
        <div className="skeleton h-4 w-48" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28" />
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
          <Clock className="h-4 w-4 text-blueprint" />
          <div>
            <h3 className="panel-title">Risk trajectory</h3>
            <p className="annotation mt-0.5">Projected over the next 2 hours</p>
          </div>
        </div>
        {timeline.growth_rate_pct > 0 && (
          <span className="tag-ink">FRP +{timeline.growth_rate_pct.toFixed(0)}% / REVISIT</span>
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
      <div className={`flex items-center gap-2.5 border-2 px-3 py-2 ${trendCfg.bg} ${trendCfg.border}`}>
        <TrendIcon className={`h-4 w-4 shrink-0 ${trendCfg.color}`} />
        <span className={`font-mono text-[11px] font-bold uppercase tracking-wider ${trendCfg.color}`}>
          {trendCfg.label}
        </span>
      </div>

      {/* Lead time */}
      {timeline.lead_time_minutes !== null && timeline.lead_time_minutes > 0 && (
        <div className="border-l-4 border-ink px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Risk projected to cross <strong className="text-risk-critical">80/100</strong> in approximately{' '}
          <strong className="text-ink">{timeline.lead_time_minutes} MIN</strong>
        </div>
      )}

      {/* Alert banner */}
      {timeline.alert && (
        <div className="flex items-start gap-2.5 border-2 border-risk-critical bg-[#FDECE8] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical" />
          <p className="text-[11px] font-semibold leading-relaxed text-risk-critical">{timeline.alert}</p>
        </div>
      )}
    </div>
  );
};
