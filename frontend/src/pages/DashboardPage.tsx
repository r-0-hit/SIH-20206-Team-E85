import React from 'react';
import {
  Factory,
  Trees,
  ShieldAlert,
  Gauge,
  Satellite,
  ArrowRight,
  Eye,
  RefreshCw,
  PlusCircle,
  Radar,
} from 'lucide-react';
import { AnalyticsSummary, Detection, Facility } from '../types/index';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { GISMap } from '../components/map/GISMap';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet, SheetHead } from '../components/ui/Sheet';
import { TitleBlock } from '../components/ui/TitleBlock';
import { EmptyState } from '../components/ui/EmptyState';
import { StatSkeleton } from '../components/ui/Skeleton';

interface DashboardPageProps {
  analytics: AnalyticsSummary | null;
  detections: Detection[];
  facilities: Facility[];
  onNavigate: (page: string) => void;
  onSelectDetection: (detection: Detection) => void;
  onRefresh: () => void;
  loading: boolean;
}

const riskTag = (score: number) =>
  score >= 80 ? 'tag-danger' : score >= 60 ? 'tag-warn' : 'tag-ok';

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

  const priority = detections
    .filter((d) => d.risk_score >= 70 || d.classification === 'INDUSTRIAL_ACCIDENTAL_FIRE')
    .slice(0, 4);

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        sheet="DWG 01"
        title="Thermal Intelligence Overview"
        description="Real-time geospatial classification of industrial facilities, operational flares and wildfire anomalies."
        actions={
          <>
            <button onClick={onRefresh} disabled={loading} className="btn-secondary">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh telemetry
            </button>
            <button onClick={() => onNavigate('analyze')} className="btn-primary">
              <PlusCircle className="h-3.5 w-3.5" />
              Submit observation
            </button>
          </>
        }
      />

      {/* KPI schedule */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading && !summary ? (
          Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Total monitored"
              value={summary?.totalAnalyses ?? detections.length}
              subtitle="All satellite swaths"
              icon={<Satellite className="h-4 w-4" />}
              accentColor="bg-blueprint"
              trend="+14% this week"
              trendPositive
            />
            <StatCard
              title="Industrial fires"
              value={summary?.industrialAccidents ?? 0}
              subtitle="High-risk accidental"
              icon={<ShieldAlert className="h-4 w-4" />}
              accentColor="bg-risk-critical"
              trend="Emergency priority"
              trendPositive={false}
              onClick={() => onNavigate('history')}
            />
            <StatCard
              title="Persistent flares"
              value={summary?.industrialPersistent ?? 0}
              subtitle="Operational facilities"
              icon={<Factory className="h-4 w-4" />}
              accentColor="bg-steel"
              trend="Routine flaring"
              trendPositive
            />
            <StatCard
              title="Wildfires & biomass"
              value={(summary?.wildfires ?? 0) + (summary?.agriculturalFires ?? 0)}
              subtitle="Forest & crop residue"
              icon={<Trees className="h-4 w-4" />}
              accentColor="bg-signal"
              trend="Vegetation fuel index"
              trendPositive
            />
            <StatCard
              title="Average risk index"
              value={`${summary?.avgRiskScore ?? 0}/100`}
              subtitle="Composite hazard metric"
              icon={<Gauge className="h-4 w-4" />}
              accentColor="bg-ink"
            />
          </>
        )}
      </div>

      {/* Plan view + incident register */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="panel-title">
              <Radar className="h-4 w-4 text-signal" />
              Live GIS thermal anomaly map
              <span className="tag-blueprint ml-1">MULTI-LAYER</span>
            </h2>
            <button
              onClick={() => onNavigate('map')}
              className="group inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-blueprint hover:text-signal"
            >
              Full screen
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
          </div>

          <GISMap
            detections={detections}
            facilities={facilities}
            onSelectDetection={onSelectDetection}
            height="460px"
            zoom={5}
          />
        </div>

        <div className="space-y-5">
          {/* Escalation notice */}
          <Sheet className="p-0" tab>
            <SheetHead
              title="Escalation trajectory"
              icon={<span className="h-2 w-2 animate-blink bg-risk-critical" />}
              actions={
                <button
                  onClick={() => onNavigate('prediction')}
                  className="font-mono text-[10px] font-bold uppercase tracking-wider text-blueprint hover:text-signal"
                >
                  What-if →
                </button>
              }
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="font-display text-sm font-extrabold uppercase text-ink">
                  Jamnagar petrochemical sector
                </span>
                <span className="tag-danger shrink-0">94/100 IN 2HR</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Hotspot behaviour is <strong className="text-signal">3.2× above</strong> the learned
                baseline. Exponential spread projected near a volatile fuel buffer.
              </p>
            </div>
          </Sheet>

          {/* Priority incidents */}
          <Sheet className="p-0">
            <SheetHead
              title="Priority incidents"
              icon={<ShieldAlert className="h-4 w-4 text-risk-critical" />}
              actions={
                <button
                  onClick={() => onNavigate('history')}
                  className="font-mono text-[10px] font-bold uppercase tracking-wider text-blueprint hover:text-signal"
                >
                  View all
                </button>
              }
            />

            {priority.length === 0 ? (
              <EmptyState
                icon={<ShieldAlert className="h-5 w-5" />}
                title="No priority incidents"
                hint="Nothing above the 70/100 threshold in the current window."
              />
            ) : (
              <ul className="divide-y divide-ink/10">
                {priority.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => onSelectDetection(d)}
                      className="group w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-signal-soft"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                            {d.id}
                          </span>
                          <span className="block truncate font-display text-xs font-extrabold uppercase text-ink group-hover:text-signal">
                            {d.nearest_facility_name || 'Thermal source'}
                          </span>
                        </span>
                        <span className={`${riskTag(d.risk_score)} shrink-0`}>{d.risk_score}/100</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-2 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                        <span>
                          FRP: <strong className="text-ink">{d.frp} MW</strong>
                        </span>
                        <span>
                          BT: <strong className="text-ink">{d.brightness} K</strong>
                        </span>
                        <span className="flex items-center gap-1 text-blueprint">
                          Inspect <Eye className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Sheet>

          {/* Ingestion callout */}
          <Sheet className="p-4" framed>
            <h3 className="key flex items-center gap-1.5">
              <Satellite className="h-3.5 w-3.5 text-blueprint" />
              Automated satellite ingestion
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Fetch and classify live thermal anomaly swaths from NASA FIRMS VIIRS/MODIS sensors.
            </p>
            <button onClick={() => onNavigate('analyze')} className="btn-blueprint mt-3 w-full">
              Launch ingestion pipeline
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Sheet>
        </div>
      </div>

      {/* Detection schedule */}
      <Sheet className="overflow-hidden p-0">
        <SheetHead
          title="Recent thermal anomaly detections"
          meta="Validated through AI multi-spectral model"
          actions={
            <button
              onClick={() => onNavigate('history')}
              className="font-mono text-[10px] font-bold uppercase tracking-wider text-blueprint hover:text-signal"
            >
              Full registry →
            </button>
          }
        />

        <div className="overflow-x-auto">
          <table className="table-shell min-w-[60rem]">
            <thead>
              <tr>
                <th>ID / Date</th>
                <th>Coordinates</th>
                <th>FRP / BT</th>
                <th>Classification</th>
                <th>Nearest facility</th>
                <th>Risk</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {detections.slice(0, 6).map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="block font-mono text-[11px] font-bold text-ink">{d.id}</span>
                    <span className="block font-mono text-[10px] text-ink-muted">
                      {d.acq_date || '—'}
                    </span>
                  </td>
                  <td className="font-mono text-[11px] text-ink-soft">
                    {d.lat.toFixed(4)}, {d.lon.toFixed(4)}
                  </td>
                  <td className="font-mono text-[11px]">
                    <span className="font-bold text-ink">{d.frp} MW</span>
                    <span className="block text-ink-muted">{d.brightness} K</span>
                  </td>
                  <td>
                    <RiskBadge classification={d.classification} />
                  </td>
                  <td className="text-xs text-ink-soft">
                    {d.nearest_facility_name ? (
                      <>
                        <span className="block font-semibold text-ink">{d.nearest_facility_name}</span>
                        <span className="block font-mono text-[10px] text-ink-muted">
                          {d.nearest_facility_dist_km ?? '—'} km away
                        </span>
                      </>
                    ) : (
                      <span className="font-mono text-[10px] uppercase text-ink-faint">Rural / remote</span>
                    )}
                  </td>
                  <td>
                    <span className={riskTag(d.risk_score)}>{d.risk_score}/100</span>
                  </td>
                  <td className="text-right">
                    <button onClick={() => onSelectDetection(d)} className="btn-secondary btn-sm">
                      Report
                    </button>
                  </td>
                </tr>
              ))}
              {detections.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Satellite className="h-5 w-5" />}
                      title="No detections on record"
                      hint="Ingest a NASA FIRMS swath or submit a single observation to begin."
                      action={
                        <button onClick={() => onNavigate('analyze')} className="btn-primary mt-1">
                          Run thermal analysis
                        </button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Sheet>

      <TitleBlock sheetNo="01" view="Thermal intelligence overview" />
    </div>
  );
};
