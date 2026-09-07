/**
 * SHAP feature attribution, drawn as a measured bar schedule:
 * each contributing factor gets a labelled, dimensioned bar.
 */

import React from 'react';
import { ShapContribution } from '../../types/index';
import { ShieldCheck } from 'lucide-react';

interface ShapExplanationProps {
  explanations?: ShapContribution[];
  riskScore?: number;
}

export const ShapExplanation: React.FC<ShapExplanationProps> = ({
  explanations = [],
  riskScore = 75,
}) => {
  const items: ShapContribution[] =
    explanations.length > 0
      ? explanations
      : [
          { feature: 'frp_mw', contribution: 26.5, direction: 'increases_risk', label: 'Fire Radiative Power (MW)' },
          { feature: 'thermal_anomaly_z_score', contribution: 22.0, direction: 'increases_risk', label: 'Thermal Baseline Deviation' },
          { feature: 'dist_to_industrial_km', contribution: 18.2, direction: 'increases_risk', label: 'Proximity to Industrial Plant' },
          { feature: 'persistence_score', contribution: 14.8, direction: 'increases_risk', label: 'Sudden Transient Energy Spike' },
          { feature: 'brightness_kelvin', contribution: 8.5, direction: 'increases_risk', label: 'High Brightness Temperature' },
          { feature: 'confidence_normalized', contribution: 6.0, direction: 'increases_risk', label: 'Multi-spectral Sensor Confidence' },
        ];

  const max = Math.max(...items.map((i) => i.contribution), 1);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
        <h3 className="panel-title">
          <ShieldCheck className="h-4 w-4 text-blueprint" />
          Explainable AI — Factor Attribution
        </h3>
        <span className="tag-blueprint">TREE_EXPLAINER</span>
      </div>

      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
        Feature contributions toward risk evaluation ({riskScore}/100)
      </p>

      <div className="mt-4 space-y-3">
        {items.map((item, idx) => {
          const increases = item.direction === 'increases_risk';
          return (
            <div key={idx}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="font-mono text-[10px] text-ink-faint">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate text-xs font-semibold text-ink">{item.label}</span>
                </span>
                <span
                  className={`shrink-0 font-mono text-[11px] font-bold ${
                    increases ? 'text-signal' : 'text-risk-low'
                  }`}
                >
                  {increases ? '+' : '−'}
                  {item.contribution.toFixed(1)}%
                </span>
              </div>

              {/* Dimensioned bar */}
              <div className="mt-1.5 h-3 border border-ink bg-paper-sunk">
                <div
                  className={`h-full ${increases ? 'bg-signal' : 'bg-risk-low'}`}
                  style={{ width: `${Math.max(2, (item.contribution / max) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-ink/15 pt-3 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-signal" /> Increases risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-risk-low" /> Lowers risk
        </span>
      </div>
    </div>
  );
};
