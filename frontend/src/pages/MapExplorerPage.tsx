import React, { useState } from 'react';
import {
  Filter,
  Eye,
  X,
  Compass,
  ArrowUpRight,
  Flame,
  Radio,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Detection, Facility } from '../types/index';
import { GISMap } from '../components/map/GISMap';
import { RiskBadge } from '../components/common/RiskBadge';
import { RiskMeter } from '../components/common/RiskMeter';

interface MapExplorerPageProps {
  detections: Detection[];
  facilities: Facility[];
  onInspectDetection: (detection: Detection) => void;
  onRefresh?: () => void;
}

export const MapExplorerPage: React.FC<MapExplorerPageProps> = ({
  detections,
  facilities,
  onInspectDetection,
  onRefresh,
}) => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<Detection | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const filteredDetections = detections.filter((d) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CRITICAL') return d.risk_score >= 80;
    if (activeFilter === 'INDUSTRIAL') return d.is_industrial;
    if (activeFilter === 'NATURAL') return d.classification === 'WILDFIRE' || d.classification === 'AGRICULTURAL_BURNING';
    return d.classification === activeFilter;
  });

  return (
    <div className="h-[calc(100vh-4.5rem)] flex flex-col relative overflow-hidden">
      {/* Top Filter & Control Strip */}
      <div className="bg-[#0b101c]/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-2 overflow-x-auto text-xs py-1">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[11px] pr-2 border-r border-slate-800">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>GIS Filter:</span>
          </div>

          {[
            { id: 'ALL', label: `All Anomaly Pins (${detections.length})` },
            { id: 'CRITICAL', label: 'Critical Hazards (>= 80)' },
            { id: 'INDUSTRIAL', label: 'Industrial Facilities' },
            { id: 'NATURAL', label: 'Wildfires & Stubble' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeFilter === f.id
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>Active Swath: <strong className="text-emerald-400">VIIRS 375m</strong></span>
        </div>
      </div>

      {/* Main Fullscreen GIS Map with Inspector Drawer */}
      <div className="flex-1 relative">
        <GISMap
          detections={filteredDetections}
          facilities={facilities}
          selectedDetection={selectedAnomaly}
          onSelectDetection={(d) => setSelectedAnomaly(d)}
          onRefresh={onRefresh}
          height="100%"
          zoom={5}
        />

        {/* Floating Side Inspector Drawer */}
        {selectedAnomaly && (
          <div className="absolute top-4 right-4 bottom-4 w-96 max-w-[calc(100vw-2rem)] glass-panel-elevated p-5 rounded-2xl border border-slate-700 shadow-2xl flex flex-col justify-between z-[1001] animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-400 font-bold">{selectedAnomaly.id}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedAnomaly.acq_date || '2026-09-07'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {selectedAnomaly.nearest_facility_name || 'Thermal Target'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Risk Gauge Header */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-around">
                <RiskMeter score={selectedAnomaly.risk_score} size="md" />
                <div className="space-y-1.5 text-left">
                  <RiskBadge classification={selectedAnomaly.classification} />
                  <div className="text-[11px] text-slate-400">
                    AI Confidence: <strong className="text-slate-200 font-mono">{Math.round(selectedAnomaly.confidence_score * 100)}%</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sensor: <strong className="text-slate-200 font-mono">{selectedAnomaly.satellite}</strong>
                  </div>
                </div>
              </div>

              {/* Radiometric Telemetry */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="glass-panel p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Fire Radiative Power</span>
                  <span className="text-amber-400 font-bold text-base">{selectedAnomaly.frp} MW</span>
                </div>
                <div className="glass-panel p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Brightness Temp</span>
                  <span className="text-rose-400 font-bold text-base">{selectedAnomaly.brightness} K</span>
                </div>
              </div>

              {/* Geographic Proximity */}
              <div className="space-y-1.5 text-xs">
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                  Geospatial Infrastructure
                </h4>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Coordinates:</span>
                    <span className="font-mono text-slate-200">
                      {selectedAnomaly.lat.toFixed(4)}, {selectedAnomaly.lon.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Facility Proximity:</span>
                    <span className="font-mono text-blue-400 font-bold">
                      {selectedAnomaly.nearest_facility_dist_km ?? (selectedAnomaly.nearest_facility?.distance_km ?? 'N/A')} km
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Explainable Indicators */}
              <div className="space-y-1.5 text-xs">
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                  Explainable AI Indicators
                </h4>
                <div className="space-y-1.5">
                  {(selectedAnomaly.indicators || []).slice(0, 2).map((ind, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                      <span>{ind}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => onInspectDetection(selectedAnomaly)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <span>View Full AI Intelligence Report</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

