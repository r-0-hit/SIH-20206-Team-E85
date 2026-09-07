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
      className="fixed inset-0 z-[999999] flex min-h-screen items-center justify-center overflow-y-auto bg-ink/70 p-4 backdrop-blur-sm sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="sheet sheet-framed shadow-hard relative z-[1000000] my-auto w-full max-w-xl space-y-4 p-5 text-ink sm:p-6"
      >
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-ink pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink bg-blueprint text-ink">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-extrabold uppercase tracking-tight text-ink sm:text-lg">
                  Telegram Emergency Alert Console
                </h2>
                <span className="tag-ok">
                  <span className="h-1.5 w-1.5 animate-blink bg-risk-low" />
                  LIVE BOT
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                Select any location to dispatch an instant GPS alert to <strong className="text-blueprint">@pyroguard_alerts_soham_bot</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon h-8 w-8 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Location Pills */}
        <div className="space-y-2">
          <label className="label flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blueprint" />
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
                className={`border-2 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                  !isCustomPlace && selectedPlaceId === p.id
                    ? 'border-ink bg-ink text-paper-raised'
                    : 'border-ink bg-paper-raised text-ink hover:bg-signal-soft'
                }`}
              >
                {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
              </button>
            ))}
            <button
              onClick={() => setIsCustomPlace(true)}
              className={`border-2 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                isCustomPlace
                  ? 'border-ink bg-blueprint text-white'
                  : 'border-ink bg-paper-raised text-ink hover:bg-signal-soft'
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
                className="input cursor-pointer appearance-none pr-10 text-xs sm:text-sm"
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
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            </div>
          </div>
        ) : (
          <div className="space-y-3 border-2 border-ink bg-paper p-3.5">
            <div>
              <label className="label">Custom Location / Facility Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Gujarat Industrial Estate Pin 4"
                className="input"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <div>
                <label className="label">Latitude</label>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input
                  type="text"
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">FRP (MW)</label>
                <input
                  type="text"
                  value={customFrp}
                  onChange={(e) => setCustomFrp(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Selected Place Live Preview Box */}
        <div className="space-y-2.5 border-2 border-ink bg-paper p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-ink flex items-center gap-2">
              <Factory className="w-4 h-4 text-blueprint" />
              <span>{isCustomPlace ? customName : currentPlace.name}</span>
            </span>
            <span className="tag-blueprint">
              {isCustomPlace ? `${customLat}° N, ${customLon}° E` : `${currentPlace.lat}° N, ${currentPlace.lon}° E`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="border-2 border-ink bg-paper-raised p-2">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">Simulated FRP</span>
              <span className="font-bold text-risk-moderate">{getSimulatedFrp()} MW</span>
            </div>
            <div className="border-2 border-ink bg-paper-raised p-2">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">Baseline Heat</span>
              <span className="font-bold text-ink-soft">
                {isCustomPlace ? 'Dynamic' : `${currentPlace.baselineFrp} MW (Normal)`}
              </span>
            </div>
            <div className="col-span-2 border-2 border-ink bg-paper-raised p-2 sm:col-span-1">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">Surge Ratio</span>
              <span className="font-bold text-signal">
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
            <span className="text-ink-muted">Alert Threat Level:</span>
            <div className="flex gap-1">
              {(['ELEVATED', 'CRITICAL', 'EXTREME'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSeverityMode(mode)}
                  className={`border-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                    severityMode === mode
                      ? mode === 'EXTREME'
                        ? 'border-risk-critical bg-risk-critical text-white'
                        : mode === 'CRITICAL'
                        ? 'border-signal bg-signal text-white'
                        : 'border-risk-moderate bg-risk-moderate text-white'
                      : 'border-ink bg-paper-raised text-ink hover:bg-signal-soft'
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
            className={`flex animate-draw-in items-center justify-between gap-2 border-2 p-3.5 text-xs ${
              dispatchResult.success
                ? 'border-risk-low bg-[#EAF5EF] text-risk-low'
                : 'border-risk-critical bg-[#FDECE8] text-risk-critical'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {dispatchResult.success ? (
                <CheckCircle className="w-4 h-4 text-risk-low shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-signal shrink-0" />
              )}
              <span>{dispatchResult.message}</span>
            </div>
            <button onClick={() => setDispatchResult(null)} className="text-ink-muted hover:text-signal">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleSendPlaceAlert}
            disabled={dispatching}
            className="btn-primary group w-full py-3.5 text-xs sm:text-sm"
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
              className="text-ink-muted hover:text-blueprint font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${pingLoading ? 'animate-spin' : ''}`} />
              <span>{pingLoading ? 'Pinging Bot...' : '⚡ Send Diagnostic Test Ping'}</span>
            </button>

            <a
              href="https://t.me/pyroguard_alerts_soham_bot"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-blueprint transition-colors duration-150 hover:text-signal"
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
