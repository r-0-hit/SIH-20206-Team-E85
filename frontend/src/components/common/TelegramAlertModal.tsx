import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Send,
  ShieldCheck,
  X,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Radio,
  Factory,
  Flame,
  Zap,
  MapPin,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { detectionService } from '../../services/detectionService';

interface TelegramAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlaceOption {
  id: string;
  name: string;
  category: string;
  state: string;
  lat: number;
  lon: number;
  baselineFrp: number;
  spikeFrp: number;
  type: string;
  classification: string;
}

const PRESET_PLACES: PlaceOption[] = [
  {
    id: 'IND-REF-001',
    name: 'Reliance Jamnagar Refinery Complex',
    category: 'Petroleum Refinery',
    state: 'Gujarat',
    lat: 22.3619,
    lon: 69.8318,
    baselineFrp: 50.0,
    spikeFrp: 460.0,
    type: 'petroleum_refinery',
    classification: 'INDUSTRIAL_ACCIDENTAL_FIRE',
  },
  {
    id: 'IND-REF-002',
    name: 'IOCL Panipat Refinery & Petrochemical Complex',
    category: 'Petrochemical Complex',
    state: 'Haryana',
    lat: 29.3941,
    lon: 76.8833,
    baselineFrp: 39.0,
    spikeFrp: 320.0,
    type: 'petroleum_refinery',
    classification: 'INDUSTRIAL_ACCIDENTAL_FIRE',
  },
  {
    id: 'IND-REF-003',
    name: 'BPCL Mumbai Refinery, Mahul',
    category: 'Petroleum Refinery',
    state: 'Maharashtra',
    lat: 19.0062,
    lon: 72.8953,
    baselineFrp: 35.0,
    spikeFrp: 280.0,
    type: 'petroleum_refinery',
    classification: 'INDUSTRIAL_ACCIDENTAL_FIRE',
  },
  {
    id: 'IND-REF-004',
    name: 'HPCL Visakhapatnam Refinery',
    category: 'Petroleum Refinery',
    state: 'Andhra Pradesh',
    lat: 17.6981,
    lon: 83.2575,
    baselineFrp: 40.0,
    spikeFrp: 310.0,
    type: 'petroleum_refinery',
    classification: 'INDUSTRIAL_ACCIDENTAL_FIRE',
  },
  {
    id: 'IND-STL-001',
    name: 'Tata Steel Works, Jamshedpur',
    category: 'Steel & Heavy Metallurgy',
    state: 'Jharkhand',
    lat: 22.7925,
    lon: 86.1950,
    baselineFrp: 55.0,
    spikeFrp: 380.0,
    type: 'steel_mill',
    classification: 'INDUSTRIAL_ACCIDENTAL_FIRE',
  },
  {
    id: 'IND-PWR-001',
    name: 'Mundra Thermal Power Station',
    category: 'Thermal Power Generation',
    state: 'Gujarat',
    lat: 22.8256,
    lon: 69.5292,
    baselineFrp: 45.0,
    spikeFrp: 290.0,
    type: 'thermal_power_plant',
    classification: 'INDUSTRIAL_ACCIDENTAL_FIRE',
  },
  {
    id: 'IND-FLR-001',
    name: 'Mumbai High Offshore Platform Complex',
    category: 'Offshore Extraction',
    state: 'Arabian Sea',
    lat: 19.4167,
    lon: 71.3333,
    baselineFrp: 60.0,
    spikeFrp: 410.0,
    type: 'offshore_flaring_platform',
    classification: 'INDUSTRIAL_ACCIDENTAL_FIRE',
  },
  {
    id: 'WLD-SIM-001',
    name: 'Simlipal National Park Wildfire Front',
    category: 'Forest & Biosphere Reserve',
    state: 'Odisha',
    lat: 21.7512,
    lon: 86.3325,
    baselineFrp: 0.0,
    spikeFrp: 185.0,
    type: 'forest',
    classification: 'WILDFIRE',
  },
  {
    id: 'MIN-JHA-001',
    name: 'Jharia Coalfield Underground Fire Zone',
    category: 'Mining Extraction Basin',
    state: 'Jharkhand',
    lat: 23.7431,
    lon: 86.4175,
    baselineFrp: 30.0,
    spikeFrp: 210.0,
    type: 'coal_mine',
    classification: 'MINING_EXTRACTION',
  },
];

export const TelegramAlertModal: React.FC<TelegramAlertModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('IND-REF-001');
  const [isCustomPlace, setIsCustomPlace] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('Custom Monitored Site');
  const [customLat, setCustomLat] = useState<string>('22.3619');
  const [customLon, setCustomLon] = useState<string>('69.8318');
  const [customFrp, setCustomFrp] = useState<string>('420.0');

  const [severityMode, setSeverityMode] = useState<'CRITICAL' | 'ELEVATED' | 'EXTREME'>('CRITICAL');
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null);
  const [pingLoading, setPingLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setDispatchResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlace = PRESET_PLACES.find((p) => p.id === selectedPlaceId) || PRESET_PLACES[0];

  const getSimulatedFrp = () => {
    if (isCustomPlace) return parseFloat(customFrp) || 350.0;
    if (severityMode === 'ELEVATED') return Math.round(currentPlace.baselineFrp * 2.2);
    if (severityMode === 'EXTREME') return Math.round(currentPlace.spikeFrp * 1.6);
    return currentPlace.spikeFrp;
  };

  const handleSendPlaceAlert = async () => {
    setDispatching(true);
    setDispatchResult(null);

    const lat = isCustomPlace ? parseFloat(customLat) : currentPlace.lat;
    const lon = isCustomPlace ? parseFloat(customLon) : currentPlace.lon;
    const name = isCustomPlace ? customName : currentPlace.name;
    const frp = getSimulatedFrp();
    const classification = isCustomPlace ? 'MANUAL_OPERATOR_ALERT' : currentPlace.classification;

    try {
      const res = await detectionService.dispatchCustomAlert({
        lat,
        lon,
        frp,
        brightness: 460.0,
        nearestFacilityName: name,
        facilityType: isCustomPlace ? 'industrial' : currentPlace.type,
        classification,
        riskScore: severityMode === 'EXTREME' ? 99 : severityMode === 'CRITICAL' ? 96 : 84,
      });

      setDispatchResult({
        success: true,
        message: `Telegram emergency alert dispatched for ${name}!`,
        messageId: res.data?.messageId,
      });
    } catch (err: any) {
      setDispatchResult({
        success: false,
        message: err.message || 'Failed to dispatch Telegram alert.',
      });
    } finally {
      setDispatching(false);
    }
  };

  const handleSendTestPing = async () => {
    setPingLoading(true);
    setDispatchResult(null);
    try {
      const res = await detectionService.sendTestAlertPing();
      setDispatchResult({
        success: true,
        message: res.message || 'Diagnostic ping delivered to your Telegram chat!',
      });
    } catch (err: any) {
      setDispatchResult({
        success: false,
        message: err.message || 'Failed to dispatch Telegram ping.',
      });
    } finally {
      setPingLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center min-h-screen"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl my-auto bg-[#0a0f1d] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] p-5 sm:p-6 space-y-4 text-slate-200 z-[1000000]"
      >
        
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Telegram Emergency Alert Console
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE BOT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Select any location to dispatch an instant GPS alert to <strong className="text-cyan-300">@pyroguard_alerts_soham_bot</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Location Pills */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Target Location / Facility</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PLACES.slice(0, 5).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setIsCustomPlace(false);
                  setSelectedPlaceId(p.id);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  !isCustomPlace && selectedPlaceId === p.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
              </button>
            ))}
            <button
              onClick={() => setIsCustomPlace(true)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                isCustomPlace
                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              📍 Custom GPS
            </button>
          </div>
        </div>

        {/* Main Select Dropdown or Custom Coordinate Inputs */}
        {!isCustomPlace ? (
          <div className="space-y-1.5">
            <div className="relative">
              <select
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                className="w-full appearance-none px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-cyan-500 transition cursor-pointer pr-10"
              >
                <optgroup label="🏭 Major Refineries & Petrochemical Hubs">
                  {PRESET_PLACES.filter((p) => p.type === 'petroleum_refinery' || p.type === 'offshore_flaring_platform').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.state})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="⚡ Power Generation & Heavy Metallurgy">
                  {PRESET_PLACES.filter((p) => p.type === 'steel_mill' || p.type === 'thermal_power_plant').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.state})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌲 High-Risk Wildfire & Mining Basins">
                  {PRESET_PLACES.filter((p) => p.type === 'forest' || p.type === 'coal_mine').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.state})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Custom Location / Facility Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Gujarat Industrial Estate Pin 4"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Latitude</label>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Longitude</label>
                <input
                  type="text"
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">FRP (MW)</label>
                <input
                  type="text"
                  value={customFrp}
                  onChange={(e) => setCustomFrp(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Selected Place Live Preview Box */}
        <div className="bg-gradient-to-r from-slate-900/90 to-[#0c1424] border border-cyan-900/50 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-2">
              <Factory className="w-4 h-4 text-cyan-400" />
              <span>{isCustomPlace ? customName : currentPlace.name}</span>
            </span>
            <span className="font-mono text-[11px] text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
              {isCustomPlace ? `${customLat}° N, ${customLon}° E` : `${currentPlace.lat}° N, ${currentPlace.lon}° E`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Simulated FRP</span>
              <span className="font-bold text-amber-400">{getSimulatedFrp()} MW</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block">Baseline Heat</span>
              <span className="font-bold text-slate-300">
                {isCustomPlace ? 'Dynamic' : `${currentPlace.baselineFrp} MW (Normal)`}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 font-sans block">Surge Ratio</span>
              <span className="font-bold text-rose-400">
                {isCustomPlace
                  ? '3.5× Spike'
                  : currentPlace.baselineFrp > 0
                  ? `${(getSimulatedFrp() / currentPlace.baselineFrp).toFixed(1)}× Spike`
                  : 'Wildfire Breakout'}
              </span>
            </div>
          </div>

          {/* Severity Mode Selector */}
          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Alert Threat Level:</span>
            <div className="flex gap-1">
              {(['ELEVATED', 'CRITICAL', 'EXTREME'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSeverityMode(mode)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition border ${
                    severityMode === mode
                      ? mode === 'EXTREME'
                        ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                        : mode === 'CRITICAL'
                        ? 'bg-rose-900/60 border-rose-500 text-rose-200'
                        : 'bg-amber-900/60 border-amber-500 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {dispatchResult && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn ${
              dispatchResult.success
                ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-600/70 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {dispatchResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{dispatchResult.message}</span>
            </div>
            <button onClick={() => setDispatchResult(null)} className="text-slate-400 hover:text-white p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleSendPlaceAlert}
            disabled={dispatching}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-600 to-blue-600 hover:from-cyan-400 hover:via-sky-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 group"
          >
            <Send className={`w-4 h-4 group-hover:scale-110 transition-transform ${dispatching ? 'animate-spin' : ''}`} />
            <span>
              {dispatching
                ? 'Dispatching Emergency Alert to Telegram...'
                : `📢 Send Telegram Alert for ${isCustomPlace ? customName : currentPlace.name}`}
            </span>
          </button>

          {/* Secondary Utilities */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              onClick={handleSendTestPing}
              disabled={pingLoading}
              className="text-slate-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${pingLoading ? 'animate-spin' : ''}`} />
              <span>{pingLoading ? 'Pinging Bot...' : '⚡ Send Diagnostic Test Ping'}</span>
            </button>

            <a
              href="https://t.me/pyroguard_alerts_soham_bot"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition"
            >
              <span>Open @pyroguard_alerts_soham_bot</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
