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
    <div className="relative flex h-[calc(100vh-5rem)] flex-col overflow-hidden">
      {/* Filter strip */}
      <div className="z-10 flex shrink-0 items-center justify-between gap-3 border-b-2 border-ink bg-paper-raised px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <div className="flex shrink-0 items-center gap-1.5 border-r-2 border-ink pr-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink">
            <Filter className="h-3.5 w-3.5 text-signal" />
            <span>GIS Filter</span>
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
              className={`whitespace-nowrap border-2 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                activeFilter === f.id
                  ? 'border-ink bg-ink text-paper-raised'
                  : 'border-transparent text-ink-muted hover:border-ink hover:bg-signal-soft hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="hidden shrink-0 sm:block">
          <span className="tag-ok">SWATH: VIIRS 375M</span>
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
          <div className="sheet shadow-hard absolute bottom-4 right-4 top-4 z-[1001] flex w-96 max-w-[calc(100vw-2rem)] animate-draw-in flex-col justify-between overflow-y-auto p-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b-2 border-ink pb-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-blueprint">
                      {selectedAnomaly.id}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-ink-muted">
                      {selectedAnomaly.acq_date || '—'}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-base font-extrabold uppercase leading-tight text-ink">
                    {selectedAnomaly.nearest_facility_name || 'Thermal target'}
                  </h3>
                </div>
                <button onClick={() => setSelectedAnomaly(null)} className="btn-icon h-7 w-7 shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Risk Gauge Header */}
              <div className="flex items-center justify-around gap-3 border-2 border-ink bg-paper p-4">
                <RiskMeter score={selectedAnomaly.risk_score} size="md" />
                <div className="space-y-2 text-left">
                  <RiskBadge classification={selectedAnomaly.classification} />
                  <div className="val">
                    CONFIDENCE:{' '}
                    <strong className="text-ink">
                      {Math.round(selectedAnomaly.confidence_score * 100)}%
                    </strong>
                  </div>
                  <div className="val">
                    SENSOR: <strong className="text-ink">{selectedAnomaly.satellite}</strong>
                  </div>
                </div>
              </div>

              {/* Radiometric Telemetry */}
              <div className="grid grid-cols-2 gap-2">
                <div className="border-2 border-ink bg-paper p-2.5">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                    Fire radiative power
                  </span>
                  <span className="font-display text-lg font-extrabold text-ink">
                    {selectedAnomaly.frp} MW
                  </span>
                </div>
                <div className="border-2 border-ink bg-paper p-2.5">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                    Brightness temp
                  </span>
                  <span className="font-display text-lg font-extrabold text-ink">
                    {selectedAnomaly.brightness} K
                  </span>
                </div>
              </div>

              {/* Geographic Proximity */}
              <div className="space-y-1.5">
                <h4 className="key">Geospatial infrastructure</h4>
                <dl className="space-y-1 border-2 border-ink bg-paper p-3">
                  <div className="flex justify-between gap-2">
                    <dt className="val">Coordinates</dt>
                    <dd className="font-mono text-[11px] font-bold text-ink">
                      {selectedAnomaly.lat.toFixed(4)}, {selectedAnomaly.lon.toFixed(4)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="val">Facility proximity</dt>
                    <dd className="font-mono text-[11px] font-bold text-blueprint">
                      {selectedAnomaly.nearest_facility_dist_km ??
                        selectedAnomaly.nearest_facility?.distance_km ??
                        'N/A'}{' '}
                      km
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Top Explainable Indicators */}
              <div className="space-y-1.5">
                <h4 className="key">Explainable AI indicators</h4>
                <ul className="space-y-1.5">
                  {(selectedAnomaly.indicators || []).slice(0, 2).map((ind, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 border-2 border-ink bg-paper p-2.5 text-[11px] leading-relaxed text-ink-soft"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-signal" />
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 border-t-2 border-ink pt-4">
              <button onClick={() => onInspectDetection(selectedAnomaly)} className="btn-primary w-full">
                View full intelligence report
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

