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
import { TrendingUp, ShieldAlert, Layers } from 'lucide-react';
import { AnalyticsSummary } from '../types/index';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet, SheetHead } from '../components/ui/Sheet';
import { TitleBlock } from '../components/ui/TitleBlock';
import { Skeleton } from '../components/ui/Skeleton';

interface AnalyticsPageProps {
  analytics: AnalyticsSummary | null;
}

/* Blueprint chart palette — flat printed inks, no gradients on the marks */
const INK = '#0A0A0A';
const GRID = 'rgba(10,10,10,0.12)';
const SERIES = ['#1438AA', '#F74B00', '#4A576A', '#B47A00', '#1B7A4B', '#0A0A0A'];
/* Hazard tiers keep their semantic colours: critical → elevated → moderate → low */
const TIER_COLORS = ['#D42200', '#F74B00', '#B47A00', '#1B7A4B'];

const axisProps = {
  stroke: INK,
  tick: { fontSize: 10, fontFamily: 'Roboto Mono, monospace', fill: '#6E6E6E' },
  tickLine: { stroke: INK },
};

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '2px solid #0A0A0A',
  borderRadius: 0,
  boxShadow: '4px 4px 0 0 #0A0A0A',
  fontSize: '11px',
  fontFamily: 'Roboto Mono, monospace',
  textTransform: 'uppercase' as const,
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="page-shell space-y-6">
        <PageHeader sheet="DWG 06" title="Thermal Analytics & Predictive Intelligence" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const { summary, classificationDistribution, riskDistribution, temporalTrends } = analytics;

  const industrialRatio =
    summary.totalAnalyses > 0
      ? Math.round((summary.industrialCount / summary.totalAnalyses) * 100)
      : 0;

  const highlights = [
    {
      label: 'Industrial footprint ratio',
      value: `${industrialRatio}%`,
      note: 'Of all thermal anomalies occurring within industrial buffer zones.',
      rule: 'bg-blueprint',
    },
    {
      label: 'Active emergency incidents',
      value: summary.activeCriticalAlerts,
      note: 'Confirmed high-risk industrial accidents awaiting SOP dispatch.',
      rule: 'bg-risk-critical',
    },
    {
      label: 'Average system risk',
      value: `${summary.avgRiskScore}/100`,
      note: 'Platform-wide composite severity across all detected anomalies.',
      rule: 'bg-ink',
    },
  ];

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        sheet="DWG 06"
        title="Thermal Analytics & Predictive Intelligence"
        description="Spatio-temporal distributions, threat categorisation and radiometric trend telemetry."
      />

      {/* Highlights schedule */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {highlights.map((h) => (
          <Sheet key={h.label} className="relative overflow-hidden p-4">
            <div className={`absolute inset-x-0 top-0 h-1 ${h.rule}`} />
            <span className="mt-1 block font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
              {h.label}
            </span>
            <div className="kpi mt-2">{h.value}</div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">{h.note}</p>
          </Sheet>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Temporal trend */}
        <Sheet className="p-0">
          <SheetHead
            title="Temporal detection trend"
            icon={<TrendingUp className="h-4 w-4 text-blueprint" />}
            meta="NASA VIIRS / MODIS"
          />
          <div className="h-64 w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temporalTrends} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1438AA" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#1438AA" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="industrialColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F74B00" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#F74B00" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} strokeDasharray="0" />
                <XAxis dataKey="date" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: INK, strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Total anomalies"
                  stroke="#1438AA"
                  strokeWidth={2}
                  fill="url(#totalColor)"
                />
                <Area
                  type="monotone"
                  dataKey="industrial_count"
                  name="Industrial sources"
                  stroke="#F74B00"
                  strokeWidth={2}
                  fill="url(#industrialColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Sheet>

        {/* Classification split */}
        <Sheet className="p-0">
          <SheetHead
            title="Classification distribution"
            icon={<Layers className="h-4 w-4 text-steel" />}
            meta="Random forest ensemble"
          />
          <div className="h-64 w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classificationDistribution.filter((c) => c.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={82}
                  paddingAngle={2}
                  dataKey="count"
                  stroke={INK}
                  strokeWidth={2}
                >
                  {classificationDistribution
                    .filter((c) => c.count > 0)
                    .map((_, index) => (
                      <Cell key={`cell-${index}`} fill={SERIES[index % SERIES.length]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    fontSize: '10px',
                    fontFamily: 'Roboto Mono, monospace',
                    textTransform: 'uppercase',
                    paddingTop: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Sheet>

        {/* Hazard tiers */}
        <Sheet className="p-0 lg:col-span-2">
          <SheetHead
            title="Hazard severity tier distribution"
            icon={<ShieldAlert className="h-4 w-4 text-signal" />}
            meta="0–100 multi-factor risk score"
          />
          <div className="h-60 w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
                <XAxis dataKey="tier" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(247,75,0,0.08)' }} />
                <Bar dataKey="count" name="Detections in tier" stroke={INK} strokeWidth={2}>
                  {riskDistribution.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Sheet>
      </div>

      <TitleBlock sheetNo="06" view="Analytics & trends" />
    </div>
  );
};
