/**
 * THERMOSAFE — What-If Risk Simulator
 * Interactive slider panel that lets judges manipulate scenario variables
 * and watch the projected risk timeline update in real time.
 * Calls POST /api/predictions/whatif (proxied to ML service).
 */

import React, { useState, useCallback, useRef } from 'react';
import { RiskTimeline } from '../../types/index';
import { RiskTimelineCard } from './RiskTimelineCard';
import { Sliders, RotateCcw, Zap } from 'lucide-react';

interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  color: string;
  description: string;
}

const SLIDERS: SliderConfig[] = [
  {
    id: 'base_frp',
    label: 'Current FRP',
    min: 10,
    max: 800,
    step: 10,
    unit: 'MW',
    color: '#B47A00',
    description: 'Fire Radiative Power — current satellite measurement',
  },
  {
    id: 'growth_rate_pct',
    label: 'FRP Growth Rate',
    min: 0,
    max: 150,
    step: 5,
    unit: '% / revisit',
    color: '#D42200',
    description: 'How fast the thermal intensity is increasing per satellite pass',
  },
  {
    id: 'population_thousands',
    label: 'Exposed Population',
    min: 0,
    max: 500,
    step: 10,
    unit: 'K people',
    color: '#4A576A',
    description: 'Estimated population within 3 km of the hotspot',
  },
  {
    id: 'distance_km',
    label: 'Distance to Facility',
    min: 0.1,
    max: 15,
    step: 0.5,
    unit: 'km',
    color: '#1438AA',
    description: 'Proximity to the nearest industrial facility',
  },
];

const FACILITY_OPTIONS = [
  { value: 'chemical',  label: '⚗ Chemical Plant' },
  { value: 'refinery',  label: '🛢 Petroleum Refinery' },
  { value: 'steel',     label: '🔩 Steel / Blast Furnace' },
  { value: 'power',     label: '⚡ Thermal Power Station' },
  { value: 'warehouse', label: '📦 Industrial Warehouse' },
  { value: 'other',     label: '🏭 Other Industrial' },
];

const DEFAULT_SCENARIO = {
  base_frp: 220,
  growth_rate_pct: 30,
  population_thousands: 50,
  distance_km: 1.5,
  facility_type: 'chemical',
  persistence_score: 0.15,
};

interface WhatIfSimulatorProps {
  mlServiceUrl?: string;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  mlServiceUrl = 'http://localhost:8000',
}) => {
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [timeline, setTimeline] = useState<RiskTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Calls the What-If API (ML service) and updates the timeline. */
  const runSimulation = useCallback(
    async (params: typeof scenario) => {
      setLoading(true);
      try {
        const res = await fetch(`${mlServiceUrl}/predict/whatif`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const data = await res.json();
          setTimeline(data.timeline as RiskTimeline);
        } else {
          // Graceful fallback: compute a simple projection client-side
          setTimeline(clientSideProjection(params));
        }
      } catch {
        setTimeline(clientSideProjection(params));
      } finally {
        setLoading(false);
      }
    },
    [mlServiceUrl]
  );

  /** Client-side approximation when ML service is offline (demo resilience). */
  const clientSideProjection = (p: typeof scenario): RiskTimeline => {
    const facilityWeights: Record<string, number> = {
      chemical: 1.3, refinery: 1.25, steel: 1.1, power: 1.05, warehouse: 0.95, other: 1.0,
    };
    const fw = facilityWeights[p.facility_type] ?? 1.0;
    const frpScore = Math.min(20, (p.base_frp / 500) * 20);
    const popScore = Math.min(12, (p.population_thousands / 200) * 12);
    const proxScore = Math.max(0, (5 - p.distance_km) * 2.5);
    const base = 30 + frpScore + popScore + proxScore;
    const current = Math.min(99, Math.round(base * fw));

    const growFactor = 1 + p.growth_rate_pct / 100;
    const min30  = Math.min(99, Math.round(current * Math.pow(growFactor, 1)));
    const min60  = Math.min(99, Math.round(current * Math.pow(growFactor, 1.5)));
    const min120 = Math.min(99, Math.round(current * Math.pow(growFactor, 2.5)));

    const trend =
      min120 > current + 10 ? 'ESCALATING' : min120 < current - 5 ? 'DECLINING' : 'STABLE';

    return {
      current,
      min_30: min30,
      min_60: min60,
      min_120: min120,
      trend,
      growth_rate_pct: p.growth_rate_pct,
      alert:
        trend === 'ESCALATING' && min120 >= 80
          ? '🔴 Potential escalation detected. This scenario projects critical risk within 2 hours.'
          : null,
      lead_time_minutes:
        min120 >= 80 && current < 80
          ? Math.round(120 * ((80 - current) / (min120 - current)))
          : null,
    };
  };

  /** Debounced slider change handler — runs simulation 300ms after last change. */
  const handleChange = (id: string, value: number | string) => {
    const updated = { ...scenario, [id]: value };
    setScenario(updated);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSimulation(updated);
    }, 300);
  };

  const handleReset = () => {
    setScenario(DEFAULT_SCENARIO);
    setTimeline(null);
  };

  const handleRunNow = () => {
    runSimulation(scenario);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-blueprint" />
          <div>
            <h3 className="panel-title">What-if scenario simulator</h3>
            <p className="annotation mt-0.5">Adjust parameters to project how risk could evolve</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="btn-secondary btn-sm"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
          <button
            onClick={handleRunNow}
            className="btn-primary btn-sm"
          >
            <Zap className="h-3 w-3" />
            Simulate
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SLIDERS.map((s) => {
          const val = scenario[s.id as keyof typeof scenario] as number;
          const pct = ((val - s.min) / (s.max - s.min)) * 100;
          return (
            <div key={s.id} className="sheet space-y-2 border-2 border-ink p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="key">{s.label}</span>
                <span className="font-display text-sm font-extrabold text-ink">
                  {val} <span className="font-mono text-[10px] text-ink-muted">{s.unit}</span>
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={val}
                onChange={(e) => handleChange(s.id, parseFloat(e.target.value))}
                className="range-ink h-1.5 w-full cursor-pointer appearance-none border border-ink"
                style={{
                  background: `linear-gradient(to right, ${s.color} ${pct}%, #EAE9E4 ${pct}%)`,
                }}
              />
              <p className="text-[10px] leading-relaxed text-ink-muted">{s.description}</p>
            </div>
          );
        })}
      </div>

      {/* Facility type picker */}
      <div className="sheet p-3.5 border-2 border-ink space-y-2">
        <span className="key">Facility type</span>
        <div className="flex flex-wrap gap-2">
          {FACILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleChange('facility_type', opt.value)}
              className={`border-2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                scenario.facility_type === opt.value
                  ? 'border-ink bg-ink text-paper-raised'
                  : 'border-ink bg-paper-raised text-ink hover:bg-signal-soft'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output timeline */}
      {(timeline || loading) && (
        <div className="sheet border-2 border-ink bg-paper p-4">
          <RiskTimelineCard timeline={timeline} loading={loading} baseRisk={scenario.base_frp > 0 ? Math.round(scenario.base_frp / 10) : 65} />
        </div>
      )}

      {!timeline && !loading && (
        <div className="border-2 border-dashed border-ink/30 py-6 text-center font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Adjust sliders and press <strong className="text-ink">Simulate</strong> to project risk
        </div>
      )}
    </div>
  );
};
