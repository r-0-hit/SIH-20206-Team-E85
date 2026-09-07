import React, { useState } from 'react';
import {
  ArrowLeft,
  Flame,
  Factory,
  CheckSquare,
  Square,
  Printer,
  Compass,
  AlertTriangle,
  Layers,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Activity,
  Sliders,
  Send,
  X,
} from 'lucide-react';
import { Detection } from '../types/index';
import { RiskBadge } from '../components/common/RiskBadge';
import { RiskMeter } from '../components/common/RiskMeter';
import { GISMap } from '../components/map/GISMap';
import { detectionService } from '../services/detectionService';
import { ThermalBaselineChart } from '../components/twin/ThermalBaselineChart';
import { RiskTimelineCard } from '../components/twin/RiskTimelineCard';
import { ShapExplanation } from '../components/common/ShapExplanation';
import { WhatIfSimulator } from '../components/twin/WhatIfSimulator';
import { Sheet, SheetHead } from '../components/ui/Sheet';
import { TitleBlock } from '../components/ui/TitleBlock';

interface ResultDetailPageProps {
  detection: Detection;
  onBack: () => void;
  onStatusUpdated?: (updated: Detection) => void;
}

export const ResultDetailPage: React.FC<ResultDetailPageProps> = ({
  detection,
  onBack,
  onStatusUpdated,
}) => {
  const [status, setStatus] = useState<string>(detection.status);
  const [completedSop, setCompletedSop] = useState<Record<number, boolean>>({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [dispatchingAlert, setDispatchingAlert] = useState<boolean>(false);
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  const handleDispatchTelegramAlert = async () => {
    setDispatchingAlert(true);
    setAlertFeedback(null);
    try {
      const res = await detectionService.dispatchIncidentAlert(detection.id);
      setAlertFeedback(res.message || 'Telegram emergency alert dispatched successfully!');
      setTimeout(() => setAlertFeedback(null), 5000);
    } catch (err: any) {
      setAlertFeedback(err.message || 'Failed to dispatch Telegram alert.');
      setTimeout(() => setAlertFeedback(null), 5000);
    } finally {
      setDispatchingAlert(false);
    }
  };

  const toggleSop = (index: number) => {
    setCompletedSop((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await detectionService.updateDetectionStatus(detection.id, newStatus);
      setStatus(newStatus);
      setStatusMsg(`Status updated to ${newStatus}`);
      if (onStatusUpdated) {
        onStatusUpdated({ ...detection, status: newStatus as any });
      }
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const nearestFac = detection.nearest_facility;
  const pers = detection.persistence;
  const twin = detection.thermal_twin;

  return (
    <div className="page-shell space-y-5">
      {/* Report header */}
      <div className="rule-underline flex flex-col justify-between gap-4 pb-3 lg:flex-row lg:items-end">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="btn-icon mt-1 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="tag-solid">INCIDENT REPORT</span>
              <RiskBadge
                classification={detection.classification}
                riskScore={detection.risk_score}
                showScore
              />
            </div>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
              {detection.id}
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
              ACQ: {detection.acq_date || '—'} @ {detection.acq_time || '—'} UTC · {detection.satellite} ·{' '}
              {detection.daynight === 'N' ? 'NIGHT SWATH' : 'DAYTIME SWATH'}
            </p>
          </div>
        </div>

        {/* Status Dropdown, Simulator Toggle & Print */}
        <div className="flex flex-wrap items-center gap-2">
          {statusMsg && <span className="tag-ok">{statusMsg}</span>}

          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={showSimulator ? 'btn-blueprint' : 'btn-secondary'}
          >
            <Sliders className="h-3.5 w-3.5" />
            {showSimulator ? 'Close what-if' : 'What-if simulator'}
          </button>

          <label className="flex items-center gap-2 border-2 border-ink bg-paper-raised px-3 py-1.5">
            <span className="key">Status</span>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="cursor-pointer bg-transparent font-mono text-[11px] font-bold uppercase text-ink focus:outline-none"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="FALSE_ALARM">FALSE_ALARM</option>
            </select>
          </label>

          <button
            onClick={handleDispatchTelegramAlert}
            disabled={dispatchingAlert}
            className="btn-blueprint no-print"
            title="Immediately send a Telegram emergency alert for this incident location"
          >
            <Send className={`h-3.5 w-3.5 ${dispatchingAlert ? 'animate-spin' : ''}`} />
            {dispatchingAlert ? 'Sending…' : 'Send alert'}
          </button>

          <button onClick={() => window.print()} className="btn-secondary no-print">
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Alert dispatch feedback */}
      {alertFeedback && (
        <div className="sheet shadow-hard-sm flex animate-draw-in items-center justify-between gap-3 px-4 py-3">
          <span className="flex items-center gap-2.5">
            <Send className="h-4 w-4 shrink-0 text-blueprint" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink">
              {alertFeedback}
            </span>
          </span>
          <button onClick={() => setAlertFeedback(null)} className="text-ink-muted hover:text-signal">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Threat Gauge & Key Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Risk Gauge */}
        <Sheet className="flex flex-col items-center justify-center p-5" framed>
          <RiskMeter score={detection.risk_score} size="lg" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            Composite hazard index
          </p>
        </Sheet>

        {/* Radiometric Stats */}
        <Sheet className="space-y-3 p-5">
          <span className="key block">Radiometric energy</span>
          <div>
            <div className="kpi">{detection.frp} MW</div>
            <p className="val mt-1">Fire radiative power</p>
          </div>
          <div className="border-t border-ink/15 pt-2">
            <div className="font-display text-lg font-extrabold text-ink">{detection.brightness} K</div>
            <p className="val mt-0.5">Brightness temperature</p>
          </div>
        </Sheet>

        {/* Spatial Proximity Card */}
        <Sheet className="space-y-3 p-5">
          <span className="key block">Infrastructure proximity</span>
          <div>
            <div className="truncate font-display text-base font-extrabold uppercase text-blueprint">
              {nearestFac?.name || detection.nearest_facility_name || 'Rural land'}
            </div>
            <p className="val mt-1">
              DISTANCE:{' '}
              <strong className="text-ink">
                {nearestFac?.distance_km ?? detection.nearest_facility_dist_km ?? 'N/A'} KM
              </strong>
            </p>
          </div>
          <div className="border-t border-ink/15 pt-2">
            <span className="val">
              {nearestFac?.type
                ? `TYPE: ${nearestFac.type.replace('_', ' ')}`
                : 'NO INDUSTRIAL PLANT WITHIN 5 KM'}
            </span>
          </div>
        </Sheet>

        {/* Spatio-Temporal Persistence & Digital Twin Anomaly */}
        <Sheet className="space-y-3 p-5">
          <span className="key block">Twin anomaly status</span>
          <div>
            <div className="kpi">
              {twin
                ? `${twin.anomaly_ratio.toFixed(1)}×`
                : pers?.persistence_score
                ? `${Math.round(pers.persistence_score * 100)}%`
                : 'NORMAL'}
            </div>
            <p className="val mt-1">
              {twin ? `SEVERITY: ${twin.anomaly_severity}` : 'STATIONARY RECURRENCE INDEX'}
            </p>
          </div>
          <div className="border-t border-ink/15 pt-2">
            <span className="val">
              Z-SCORE: <strong className="text-ink">{twin?.z_score?.toFixed(1) ?? '0.0'}</strong> ·
              DETECTIONS: <strong className="text-ink">{pers?.historical_detections ?? 1}</strong>
            </span>
          </div>
        </Sheet>
      </div>

      {/* Interactive What-If Simulator Drawer (Expandable) */}
      {showSimulator && (
        <Sheet className="animate-draw-in p-5" tab>
          <WhatIfSimulator />
        </Sheet>
      )}

      {/* STANDOUT INNOVATION: Digital Thermal Twin & Predictive Risk Trajectory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Facility Digital Thermal Twin Chart */}
        <Sheet className="space-y-4 p-5">
          <ThermalBaselineChart
            baseline={null}
            currentFrp={detection.frp}
            currentHour={detection.acq_time ? parseInt(detection.acq_time.slice(0, 2)) : 22}
            twinResult={twin || null}
            facilityName={nearestFac?.name || detection.nearest_facility_name || 'Industrial Facility'}
          />
        </Sheet>

        {/* Right: Future Risk Timeline (+30, +60, +120 min) */}
        <Sheet className="space-y-4 p-5">
          <RiskTimelineCard timeline={detection.prediction || null} baseRisk={detection.risk_score} />
        </Sheet>
      </div>

      {/* Two Column Layout: SHAP Explainable Attribution & SOP Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Explainable AI SHAP Attribution & Indicators */}
        <Sheet className="space-y-5 p-5">
          <ShapExplanation
            explanations={detection.shap_explanation}
            riskScore={detection.risk_score}
          />

          <div className="space-y-2 border-t-2 border-ink pt-4">
            <span className="key block">Evidence log</span>
            <ol className="space-y-2">
              {(detection.indicators || []).map((indicator, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 border-2 border-ink bg-paper p-2.5 text-[11px] leading-relaxed text-ink-soft"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center border border-ink bg-blueprint font-mono text-[9px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <p>{indicator}</p>
                </li>
              ))}
            </ol>
          </div>
        </Sheet>

        {/* Right Col: Standard Operating Procedure (SOP) Action Checklist */}
        <Sheet className="p-0">
          <SheetHead
            title="Recommended emergency response SOP"
            icon={<Flame className="h-4 w-4 text-signal" />}
            meta={`${Object.values(completedSop).filter(Boolean).length}/${
              (detection.recommended_action || []).length
            } done`}
          />

          <ul className="space-y-2.5 p-5">
            {(detection.recommended_action || []).map((action, idx) => {
              const isDone = completedSop[idx];
              return (
                <li key={idx}>
                  <button
                    onClick={() => toggleSop(idx)}
                    className={`flex w-full items-start gap-3 border-2 p-3 text-left text-[11px] leading-relaxed transition-colors duration-150 ${
                      isDone
                        ? 'border-risk-low bg-[#EAF5EF] text-risk-low'
                        : 'border-ink bg-paper-raised text-ink-soft hover:bg-signal-soft'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border-2 ${
                        isDone ? 'border-risk-low' : 'border-ink'
                      }`}
                    >
                      {isDone ? <CheckCircle className="h-3 w-3" /> : <Square className="h-2 w-2 opacity-0" />}
                    </span>
                    <span className={isDone ? 'line-through opacity-80' : ''}>{action}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      </div>

      {/* Mini Interactive GIS Map Centered on Target */}
      <Sheet className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
          <h2 className="panel-title">
            <Compass className="h-4 w-4 text-signal" />
            Target geospatial context & buffer zone
          </h2>
          <span className="annotation">
            {detection.lat.toFixed(4)}°N, {detection.lon.toFixed(4)}°E
          </span>
        </div>

        <GISMap
          detections={[detection]}
          facilities={nearestFac ? [{
            id: nearestFac.id,
            name: nearestFac.name,
            type: nearestFac.type,
            lat: detection.lat + 0.002,
            lon: detection.lon + 0.002,
            country: 'India',
            risk_category: 'CRITICAL',
            operational_flaring: 1,
            buffer_km: 3.5,
          }] : []}
          height="320px"
          center={[detection.lat, detection.lon]}
          zoom={12}
        />
      </Sheet>

      <TitleBlock sheetNo={detection.id} view="Incident intelligence report" status={status} />
    </div>
  );
};
