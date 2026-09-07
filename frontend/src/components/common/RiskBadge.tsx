import React from 'react';
import { AnomalyClassification } from '../../types/index';

interface RiskBadgeProps {
  classification?: AnomalyClassification | string;
  riskScore?: number;
  showScore?: boolean;
}

const STYLES: Record<string, string> = {
  INDUSTRIAL_ACCIDENTAL_FIRE: 'border-risk-critical bg-[#FDECE8] text-risk-critical',
  INDUSTRIAL_PERSISTENT: 'border-blueprint bg-blueprint-soft text-blueprint',
  WILDFIRE: 'border-signal bg-signal-soft text-signal-deep',
  AGRICULTURAL_BURNING: 'border-risk-moderate bg-[#FBF3E2] text-risk-moderate',
  MINING_EXTRACTION: 'border-steel bg-steel-soft text-steel',
  OTHER_OR_FALSE_ALARM: 'border-risk-low bg-[#EAF5EF] text-risk-low',
};

const NAMES: Record<string, string> = {
  INDUSTRIAL_ACCIDENTAL_FIRE: 'Industrial Accidental Fire',
  INDUSTRIAL_PERSISTENT: 'Operational Flare',
  WILDFIRE: 'Wildfire / Forest',
  AGRICULTURAL_BURNING: 'Agricultural Burning',
  MINING_EXTRACTION: 'Mining Seam Fire',
  OTHER_OR_FALSE_ALARM: 'False Alarm / Glint',
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  classification,
  riskScore,
  showScore = false,
}) => {
  const key = classification || '';
  const style = STYLES[key] || 'border-ink bg-paper-raised text-ink';
  const name = NAMES[key] || classification || 'Unknown';

  return (
    <span className={`tag whitespace-nowrap ${style}`}>
      <span className="h-1.5 w-1.5 bg-current" />
      {name}
      {showScore && riskScore !== undefined && (
        <span className="ml-1 border-l border-current/30 pl-1.5 font-bold">{riskScore}/100</span>
      )}
    </span>
  );
};
