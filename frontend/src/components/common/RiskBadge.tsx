import React from 'react';
import { AnomalyClassification } from '../../types/index';

interface RiskBadgeProps {
  classification?: AnomalyClassification | string;
  riskScore?: number;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ classification, riskScore, showScore = false }) => {
  const getBadgeStyle = () => {
    switch (classification) {
      case 'INDUSTRIAL_ACCIDENTAL_FIRE':
        return 'bg-red-950/70 text-red-400 border-red-800/80 shadow-[0_0_12px_rgba(239,68,68,0.25)]';
      case 'INDUSTRIAL_PERSISTENT':
        return 'bg-purple-950/70 text-purple-400 border-purple-800/80 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
      case 'WILDFIRE':
        return 'bg-orange-950/70 text-orange-400 border-orange-800/80';
      case 'AGRICULTURAL_BURNING':
        return 'bg-amber-950/70 text-amber-400 border-amber-800/80';
      case 'MINING_EXTRACTION':
        return 'bg-slate-800/80 text-slate-300 border-slate-700';
      case 'OTHER_OR_FALSE_ALARM':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getReadableName = () => {
    switch (classification) {
      case 'INDUSTRIAL_ACCIDENTAL_FIRE':
        return 'Industrial Accidental Fire';
      case 'INDUSTRIAL_PERSISTENT':
        return 'Industrial Operational Flare';
      case 'WILDFIRE':
        return 'Wildfire / Forest Fire';
      case 'AGRICULTURAL_BURNING':
        return 'Agricultural Stubble Burning';
      case 'MINING_EXTRACTION':
        return 'Mining Seam Fire';
      case 'OTHER_OR_FALSE_ALARM':
        return 'False Alarm / Solar Glint';
      default:
        return classification || 'Unknown';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {getReadableName()}
      {showScore && riskScore !== undefined && (
        <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-black/40 font-mono font-bold">
          {riskScore}/100
        </span>
      )}
    </span>
  );
};

