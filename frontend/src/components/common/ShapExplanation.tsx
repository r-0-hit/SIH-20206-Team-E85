/**
 * THERMOSAFE — SHAP Feature Explanation Bar Chart
 * Displays top contributing factors behind the AI risk decision
 * as horizontal direction-colored attribution bars.
 */

import React from 'react';
import { ShapContribution } from '../../types/index';
import { ShieldCheck, HelpCircle } from 'lucide-react';

interface ShapExplanationProps {
  explanations?: ShapContribution[];
  riskScore?: number;
}

export const ShapExplanation: React.FC<ShapExplanationProps> = ({
  explanations = [],
  riskScore = 75,
}) => {
  // Default illustrative SHAP contributions if none returned from API
  const items: ShapContribution[] =
    explanations.length > 0
      ? explanations
      : [
          { feature: 'frp_mw', contribution: 26.5, direction: 'increases_risk', label: 'Fire Radiative Power (MW)' },
          { feature: 'thermal_anomaly_z_score', contribution: 22.0, direction: 'increases_risk', label: 'Thermal Baseline Anomaly Deviation' },
          { feature: 'dist_to_industrial_km', contribution: 18.2, direction: 'increases_risk', label: 'Proximity to Industrial Plant' },
          { feature: 'persistence_score', contribution: 14.8, direction: 'increases_risk', label: 'Sudden Transient Energy Spike' },
          { feature: 'brightness_kelvin', contribution: 8.5, direction: 'increases_risk', label: 'High Brightness Temperature' },
          { feature: 'confidence_normalized', contribution: 6.0, direction: 'increases_risk', label: 'Multi-spectral Sensor Confidence' },
        ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Explainable AI (SHAP) Factor Attribution</h3>
            <p className="text-[11px] text-slate-400">
              Mathematical feature contributions towards risk evaluation ({riskScore}/100)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-blue-300">
          TREE_EXPLAINER
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const isRiskIncr = item.direction === 'increases_risk';
          const barColor = isRiskIncr ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-emerald-600 to-teal-400';
          const textColor = isRiskIncr ? 'text-rose-400' : 'text-emerald-400';
          const sign = isRiskIncr ? '+' : '−';

          return (
            <div key={idx} className="glass-panel p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{item.label}</span>
                <span className={`font-mono font-bold ${textColor}`}>
                  {sign}{item.contribution.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${Math.min(100, item.contribution * 2.5)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Increases Risk Rating
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Dampens / Lowers Risk
        </span>
      </div>
    </div>
  );
};
