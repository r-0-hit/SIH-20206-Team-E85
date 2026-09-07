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
    color: '#f59e0b',
    description: 'Fire Radiative Power — current satellite measurement',
  },
  {
    id: 'growth_rate_pct',
    label: 'FRP Growth Rate',
    min: 0,
    max: 150,
    step: 5,
    unit: '% / revisit',
    color: '#ef4444',
    description: 'How fast the thermal intensity is increasing per satellite pass',
  },
  {
    id: 'population_thousands',
    label: 'Exposed Population',
    min: 0,
    max: 500,
    step: 10,
    unit: 'K people',
    color: '#8b5cf6',
    description: 'Estimated population within 3 km of the hotspot',
  },
  {
    id: 'distance_km',
    label: 'Distance to Facility',
    min: 0.1,
    max: 15,
    step: 0.5,
    unit: 'km',
    color: '#3b82f6',
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
          <Sliders className="w-4 h-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white">What-If Scenario Simulator</h3>
            <p className="text-[11px] text-slate-400">
              Adjust parameters to project how risk could evolve
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={handleRunNow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
          >
            <Zap className="w-3 h-3" />
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
            <div key={s.id} className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-300">{s.label}</span>
                <span
                  className="text-sm font-extrabold font-mono"
                  style={{ color: s.color }}
                >
                  {val} {s.unit}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={val}
                onChange={(e) => handleChange(s.id, parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${s.color} ${pct}%, #334155 ${pct}%)`,
                }}
              />
              <p className="text-[10px] text-slate-500">{s.description}</p>
            </div>
          );
        })}
      </div>

      {/* Facility type picker */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2">
        <span className="text-[11px] font-semibold text-slate-300">Facility Type</span>
        <div className="flex flex-wrap gap-2">
          {FACILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleChange('facility_type', opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                scenario.facility_type === opt.value
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output timeline */}
      {(timeline || loading) && (
        <div className="glass-panel p-4 rounded-xl border border-indigo-900/40 bg-indigo-950/10">
          <RiskTimelineCard timeline={timeline} loading={loading} baseRisk={scenario.base_frp > 0 ? Math.round(scenario.base_frp / 10) : 65} />
        </div>
      )}

      {!timeline && !loading && (
        <div className="text-center py-6 text-slate-500 text-xs">
          Adjust sliders and click <strong>Simulate</strong> to project risk
        </div>
      )}
    </div>
  );
};
