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

  const toggleSop = (index: number) => {
    setCompletedSop((prev) => ({ ...prev, [index]: !prev[index] }));
  };

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
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-extrabold text-white font-mono">
                {detection.id}
              </h1>
              <RiskBadge classification={detection.classification} riskScore={detection.risk_score} showScore />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Acquisition: {detection.acq_date || '2026-09-07'} at {detection.acq_time || '2145'} UTC | {detection.satellite} ({detection.daynight === 'N' ? 'Night Swath' : 'Daytime Swath'})
            </p>
          </div>
        </div>

        {/* Status Dropdown, Simulator Toggle & Print */}
        <div className="flex items-center gap-3">
          {statusMsg && (
            <span className="text-xs text-emerald-400 font-semibold animate-pulse">
              {statusMsg}
            </span>
          )}

          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              showSimulator
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showSimulator ? 'Close What-If' : 'What-If Simulator'}</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-400">Incident Status:</span>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="ACTIVE" className="bg-slate-900 text-white">ACTIVE</option>
              <option value="VERIFIED" className="bg-slate-900 text-white">VERIFIED</option>
              <option value="RESOLVED" className="bg-slate-900 text-white">RESOLVED</option>
              <option value="FALSE_ALARM" className="bg-slate-900 text-white">FALSE_ALARM</option>
            </select>
          </div>

          {/* STANDOUT: Manual Telegram Alert Button */}
          <button
            onClick={handleDispatchTelegramAlert}
            disabled={dispatchingAlert}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-md shadow-sky-500/20 disabled:opacity-50"
            title="Immediately send Telegram emergency alert for this specific incident location"
          >
            <Send className={`w-3.5 h-3.5 ${dispatchingAlert ? 'animate-spin' : ''}`} />
            <span>{dispatchingAlert ? 'Sending Alert...' : '📢 Send Telegram Alert'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Manual Alert Feedback Toast */}
      {alertFeedback && (
        <div className="p-3 rounded-xl bg-sky-950/80 border border-sky-600/80 text-sky-200 text-xs flex items-center justify-between shadow-lg shadow-sky-950/50 animate-fadeIn">
          <div className="flex items-center gap-2.5 font-medium">
            <Send className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{alertFeedback}</span>
          </div>
          <button onClick={() => setAlertFeedback(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Threat Gauge & Key Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Risk Gauge */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
          <RiskMeter score={detection.risk_score} size="lg" />
          <p className="text-[11px] text-slate-400 mt-3 font-mono">Composite AI Hazard Index</p>
        </div>

        {/* Radiometric Stats */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Radiometric Energy
          </span>
          <div>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">
              {detection.frp} MW
            </div>
            <p className="text-xs text-slate-400">Fire Radiative Power</p>
          </div>
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-lg font-bold text-rose-400 font-mono">
              {detection.brightness} K
            </div>
            <p className="text-[11px] text-slate-400">Brightness Temperature</p>
          </div>
        </div>

        {/* Spatial Proximity Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Infrastructure Proximity
          </span>
          <div>
            <div className="text-lg font-bold text-blue-400 truncate">
              {nearestFac?.name || detection.nearest_facility_name || 'Rural Land'}
            </div>
            <p className="text-xs text-slate-400">
              Distance:{' '}
              <strong className="text-slate-200 font-mono">
                {nearestFac?.distance_km ?? detection.nearest_facility_dist_km ?? 'N/A'} km
              </strong>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            {nearestFac?.type ? (
              <span className="capitalize">Type: {nearestFac.type.replace('_', ' ')}</span>
            ) : (
              <span>No industrial plant within 5km</span>
            )}
          </div>
        </div>

        {/* Spatio-Temporal Persistence & Digital Twin Anomaly */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Twin Anomaly Status
          </span>
          <div>
            <div className="text-2xl font-extrabold text-purple-400 font-mono">
              {twin ? `${twin.anomaly_ratio.toFixed(1)}× Baseline` : pers?.persistence_score ? `${Math.round(pers.persistence_score * 100)}% Persist` : 'Normal'}
            </div>
            <p className="text-xs text-slate-400">
              {twin ? `Severity: ${twin.anomaly_severity}` : 'Stationary Recurrence Index'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Z-Score: <strong className="text-slate-200 font-mono">{twin?.z_score?.toFixed(1) ?? '0.0'}</strong> | Detections: <strong className="text-slate-200 font-mono">{pers?.historical_detections ?? 1}</strong>
          </div>
        </div>
      </div>

      {/* Interactive What-If Simulator Drawer (Expandable) */}
      {showSimulator && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-700/50 bg-indigo-950/20 animate-fadeIn">
          <WhatIfSimulator />
        </div>
      )}

      {/* STANDOUT INNOVATION: Digital Thermal Twin & Predictive Risk Trajectory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Facility Digital Thermal Twin Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <ThermalBaselineChart
            baseline={null}
            currentFrp={detection.frp}
            currentHour={detection.acq_time ? parseInt(detection.acq_time.slice(0, 2)) : 22}
            twinResult={twin || null}
            facilityName={nearestFac?.name || detection.nearest_facility_name || 'Industrial Facility'}
          />
        </div>

        {/* Right: Future Risk Timeline (+30, +60, +120 min) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <RiskTimelineCard
            timeline={detection.prediction || null}
            baseRisk={detection.risk_score}
          />
        </div>
      </div>

      {/* Two Column Layout: SHAP Explainable Attribution & SOP Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Explainable AI SHAP Attribution & Indicators */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <ShapExplanation
            explanations={detection.shap_explanation}
            riskScore={detection.risk_score}
          />

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Evidence Log
            </span>
            <div className="space-y-2">
              {(detection.indicators || []).map((indicator, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <div className="w-4 h-4 rounded-full bg-blue-950 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5 border border-blue-800">
                    {idx + 1}
                  </div>
                  <p className="leading-relaxed">{indicator}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Standard Operating Procedure (SOP) Action Checklist */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <span>Recommended Emergency Response SOP</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Standard operating procedures for plant safety managers and disaster responders.
            </p>
          </div>

          <div className="space-y-2.5">
            {(detection.recommended_action || []).map((action, idx) => {
              const isDone = completedSop[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleSop(idx)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex items-start gap-3 ${
                    isDone
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <button className="mt-0.5 shrink-0 text-slate-400">
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <p className={`leading-relaxed ${isDone ? 'line-through opacity-80' : ''}`}>
                    {action}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mini Interactive GIS Map Centered on Target */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Target Geospatial Context & Buffer Zone</span>
          </h2>
          <span className="font-mono text-xs text-slate-400">
            Coordinates: {detection.lat.toFixed(4)}°N, {detection.lon.toFixed(4)}°E
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
      </div>
    </div>
  );
};
