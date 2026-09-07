import React from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, ShieldAlert, Layers } from 'lucide-react';
import { AnalyticsSummary } from '../types/index';

interface AnalyticsPageProps {
  analytics: AnalyticsSummary | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        Loading analytics intelligence...
      </div>
    );
  }

  const {
    summary,
    classificationDistribution,
    riskDistribution,
    temporalTrends,
  } = analytics;

  const COLORS = ['#ef4444', '#a855f7', '#f97316', '#eab308', '#64748b', '#10b981'];

  // Calculate high-level insights
  const industrialRatio = summary.totalAnalyses > 0
    ? Math.round((summary.industrialCount / summary.totalAnalyses) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Page Title */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <span>Thermal Analytics & Predictive Intelligence</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Spatio-temporal distributions, threat categorizations, and radiometric trend telemetry.
        </p>
      </div>

      {/* Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Industrial Footprint Ratio
          </span>
          <div className="text-2xl font-extrabold text-blue-400 font-mono">
            {industrialRatio}%
          </div>
          <p className="text-[11px] text-slate-400">
            Of all thermal anomalies occur at or within industrial buffer zones.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Active Emergency Incidents
          </span>
          <div className="text-2xl font-extrabold text-rose-500 font-mono">
            {summary.activeCriticalAlerts}
          </div>
          <p className="text-[11px] text-slate-400">
            Confirmed high-risk industrial accidents requiring immediate SOP dispatch.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Average System Risk
          </span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            {summary.avgRiskScore}/100
          </div>
          <p className="text-[11px] text-slate-400">
            Platform-wide composite severity average across all detected anomalies.
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temporal Detection Trend Area Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Temporal Detection Trend (Satellite Influx)</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">NASA VIIRS / MODIS</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temporalTrends}>
                <defs>
                  <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="industrialColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="date" stroke="#64748b" textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="count" name="Total Anomalies" stroke="#3b82f6" fillOpacity={1} fill="url(#totalColor)" />
                <Area type="monotone" dataKey="industrial_count" name="Industrial Sources" stroke="#ef4444" fillOpacity={1} fill="url(#industrialColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Classification Breakdown Donut Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Thermal Anomaly Classification Distribution</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Random Forest Ensemble</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classificationDistribution.filter((c) => c.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {classificationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Hazard Severity Tier Distribution</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">0 - 100 Multi-Factor Risk Score</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="tier" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Detections in Tier" radius={[6, 6, 0, 0]}>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

