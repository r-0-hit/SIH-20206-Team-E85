import React from 'react';
import {
  Flame,
  Factory,
  Trees,
  Wheat,
  ShieldAlert,
  Gauge,
  Satellite,
  ArrowRight,
  Eye,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { AnalyticsSummary, Detection, Facility } from '../types/index';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { GISMap } from '../components/map/GISMap';

interface DashboardPageProps {
  analytics: AnalyticsSummary | null;
  detections: Detection[];
  facilities: Facility[];
  onNavigate: (page: string) => void;
  onSelectDetection: (detection: Detection) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  analytics,
  detections,
  facilities,
  onNavigate,
  onSelectDetection,
  onRefresh,
  loading,
}) => {
  const summary = analytics?.summary;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Thermal Intelligence Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geospatial classification of industrial facilities, operational flares, and wildfire anomalies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={() => onNavigate('analyze')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Submit Observation</span>
          </button>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Monitored"
          value={summary?.totalAnalyses ?? detections.length}
          subtitle="All satellite swaths"
          icon={<Satellite className="w-5 h-5 text-blue-400" />}
          accentColor="bg-blue-500"
          trend="+14% this week"
          trendPositive={true}
        />

        <StatCard
          title="Industrial Fires"
          value={summary?.industrialAccidents ?? 0}
          subtitle="High-risk accidental fires"
          icon={<ShieldAlert className="w-5 h-5 text-rose-500" />}
          accentColor="bg-rose-500"
          trend="Emergency priority"
          trendPositive={false}
          onClick={() => onNavigate('history')}
        />

        <StatCard
          title="Persistent Flares"
          value={summary?.industrialPersistent ?? 0}
          subtitle="Operational facilities"
          icon={<Factory className="w-5 h-5 text-purple-400" />}
          accentColor="bg-purple-500"
          trend="Routine flaring"
          trendPositive={true}
        />

        <StatCard
          title="Wildfires & Biomass"
          value={(summary?.wildfires ?? 0) + (summary?.agriculturalFires ?? 0)}
          subtitle="Forest & crop residue"
          icon={<Trees className="w-5 h-5 text-orange-400" />}
          accentColor="bg-orange-500"
          trend="Vegetation fuel index"
          trendPositive={true}
        />

        <StatCard
          title="Average Risk Index"
          value={`${summary?.avgRiskScore ?? 62}/100`}
          subtitle="Composite hazard metric"
          icon={<Gauge className="w-5 h-5 text-amber-400" />}
          accentColor="bg-amber-500"
        />
      </div>

      {/* Main Interactive GIS Preview & Incident Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Live GIS Thermal Anomaly Map</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                MULTI-LAYER
              </span>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
            >
              <span>Full Screen GIS Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <GISMap
            detections={detections}
            facilities={facilities}
            onSelectDetection={onSelectDetection}
            height="440px"
            zoom={5}
          />
        </div>

        {/* Right 1 Col: Critical Hazards & Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Priority Incidents</span>
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-slate-400 hover:text-white"
            >
              View All
            </button>
          </div>

          {/* STANDOUT: Forward Escalation Alerts Feed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-rose-400">Escalation Trajectory Alerts</span>
              </h2>
              <button
                onClick={() => onNavigate('prediction')}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
              >
                What-If Sim →
              </button>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-slate-900 to-indigo-950/30 border border-red-800/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-red-300 flex items-center gap-1.5">
                  🔴 Jamnagar Petrochemical Sector
                </span>
                <span className="font-mono font-extrabold text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800">
                  94/100 in 2hr
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Hotspot behaviour is <strong className="text-amber-400">3.2× above</strong> learned baseline. Exponential spread projected near volatile fuel buffer.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {detections
              .filter((d) => d.risk_score >= 70 || d.classification === 'INDUSTRIAL_ACCIDENTAL_FIRE')
              .slice(0, 4)
              .map((d) => (
                <div
                  key={d.id}
                  onClick={() => onSelectDetection(d)}
                  className="glass-panel p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer hover:shadow-md relative overflow-hidden group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-slate-400 block">{d.id}</span>
                      <h3 className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition">
                        {d.nearest_facility_name || 'Thermal Source'}
                      </h3>
                    </div>
                    <RiskBadge classification={d.classification} riskScore={d.risk_score} showScore />
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>FRP: <strong className="text-amber-400">{d.frp} MW</strong></span>
                    <span>Temp: <strong className="text-rose-400">{d.brightness} K</strong></span>
                    <span className="text-blue-400 flex items-center gap-1 font-sans">
                      Inspect <Eye className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Rapid Ingest Quick Card */}
          <div className="glass-panel p-4 rounded-xl border border-blue-900/40 space-y-2.5 bg-gradient-to-br from-blue-950/30 to-slate-900">
            <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Satellite className="w-3.5 h-3.5" />
              Automated Satellite Ingestion
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly fetch and classify live thermal anomaly swaths from NASA FIRMS VIIRS/MODIS sensors.
            </p>
            <button
              onClick={() => onNavigate('analyze')}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>Launch Ingestion Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Table Preview */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recent Thermal Anomaly Detections</h2>
            <p className="text-xs text-slate-400">Validated through AI multi-spectral model</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Full History & Search</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800 font-mono">
              <tr>
                <th className="py-2.5 px-3">ID / Time</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3">FRP / Brightness</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Nearest Facility</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {detections.slice(0, 6).map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-200">{d.id}</span>
                    <span className="block text-[10px] text-slate-400">{d.acq_date || '2026-09-07'}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {d.lat.toFixed(4)}, {d.lon.toFixed(4)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-amber-400 font-bold">{d.frp} MW</span>
                    <span className="text-slate-400 block text-[10px]">{d.brightness} K</span>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <RiskBadge classification={d.classification} />
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300">
                    {d.nearest_facility_name ? (
                      <div>
                        <span className="font-medium text-slate-200">{d.nearest_facility_name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {d.nearest_facility_dist_km ?? '0.2'} km away
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Rural/Remote</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        d.risk_score >= 80
                          ? 'bg-red-500/20 text-red-400'
                          : d.risk_score >= 60
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {d.risk_score}/100
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectDetection(d)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 font-sans text-xs transition"
                    >
                      Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

