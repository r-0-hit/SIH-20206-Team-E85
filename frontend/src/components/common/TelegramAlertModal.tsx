import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Send,
  X,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Radio,
  Factory,
  Flame,
  Satellite,
  MapPin,
  ChevronDown,
  Navigation,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { detectionService } from '../../services/detectionService';
import { Detection } from '../../types/index';

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

/**
 * Resolves an accurate, human-understandable location title for any hotspot.
 * Prevents showing a facility name that is hundreds of kilometers away.
 */
function getHotspotLocationTitle(d: Detection): string {
  const dist = d.nearest_facility_dist_km;
  // If the hotspot is inside or adjacent to an industrial facility (< 15 km)
  if (dist !== undefined && dist <= 15.0 && d.nearest_facility_name) {
    return `${d.nearest_facility_name} (${dist < 1 ? '<1' : dist.toFixed(1)} km)`;
  }

  // Geographic regional identification based on satellite coordinates
  const lat = d.lat;
  const lon = d.lon;
  let region = '';
  if (lat >= 13 && lat <= 19 && lon >= 77 && lon <= 84) region = 'Andhra Pradesh / Rayalaseema';
  else if (lat >= 19 && lat <= 23 && lon >= 83 && lon <= 88) region = 'Odisha Forest Corridor';
  else if (lat >= 23 && lat <= 25 && lon >= 84 && lon <= 87) region = 'Jharkhand Mining Basin';
  else if (lat >= 21 && lat <= 26 && lon >= 68 && lon <= 74) region = 'Gujarat Coastal Sector';
  else if (lat >= 28 && lat <= 33 && lon >= 74 && lon <= 78) region = 'Punjab Agriculture Belt';
  else if (lat >= 5 && lat <= 10 && lon >= 79 && lon <= 82) region = 'Southern Ocean / Sri Lanka';
  else if (lat >= 20 && lat <= 25 && lon >= 93 && lon <= 97) region = 'Northeast / Myanmar Border';
  else if (d.nearest_facility_name && dist !== undefined) {
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E (${Math.round(dist)} km from ${d.nearest_facility_name.split(' ')[0]})`;
  } else {
    region = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  }

  return `${region} (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
}

export const TelegramAlertModal: React.FC<TelegramAlertModalProps> = ({ isOpen, onClose }) => {
  // Source selection: Live Hotspots vs Benchmark vs Custom
  const [sourceTab, setSourceTab] = useState<'HOTSPOTS' | 'BENCHMARK' | 'CUSTOM'>('HOTSPOTS');
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [loadingDetections, setLoadingDetections] = useState<boolean>(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('');

  // Benchmark place state
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('IND-REF-001');

  // Custom GPS state
  const [customName, setCustomName] = useState<string>('Custom Monitored Site');
  const [customLat, setCustomLat] = useState<string>('22.3619');
  const [customLon, setCustomLon] = useState<string>('69.8318');
  const [customFrp, setCustomFrp] = useState<string>('420.0');

  const [severityMode, setSeverityMode] = useState<'CRITICAL' | 'ELEVATED' | 'EXTREME'>('CRITICAL');
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null);
  const [pingLoading, setPingLoading] = useState<boolean>(false);

  // Dynamic OpenStreetMap facility enrichment state
  const [dynamicFacilities, setDynamicFacilities] = useState<any[]>([]);
  const [osmSyncing, setOsmSyncing] = useState<boolean>(false);
  const [osmSyncMessage, setOsmSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDispatchResult(null);
      setOsmSyncMessage(null);
      setLoadingDetections(true);

      // Load dynamically enriched facilities from backend & SQLite
      detectionService.getFacilities()
        .then((facs) => {
          if (facs && facs.length > 0) setDynamicFacilities(facs);
        })
        .catch(() => {});

      detectionService.getDetections({ limit: 100 })
        .then((res) => {
          if (res && res.detections && res.detections.length > 0) {
            // Deduplicate by coordinate so each location in the selector is a distinct physical site
            const uniqueMap = new Map<string, Detection>();
            for (const d of res.detections) {
              const key = `${d.lat.toFixed(3)},${d.lon.toFixed(3)}`;
              if (!uniqueMap.has(key) || (uniqueMap.get(key)!.risk_score < d.risk_score)) {
                uniqueMap.set(key, d);
              }
            }
            const uniqueList = Array.from(uniqueMap.values());
            // Sort by risk score descending
            uniqueList.sort((a, b) => b.risk_score - a.risk_score || b.frp - a.frp);
            setLiveDetections(uniqueList);
            setSelectedHotspotId(uniqueList[0].id);
          }
        })
        .catch((err) => console.warn('Failed to load live detections for modal:', err))
        .finally(() => setLoadingDetections(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOsmPlace = dynamicFacilities.find((f) => f.id === selectedPlaceId);
  const currentPlace: PlaceOption = PRESET_PLACES.find((p) => p.id === selectedPlaceId) ||
    (currentOsmPlace ? {
      id: currentOsmPlace.id,
      name: currentOsmPlace.name,
      category: currentOsmPlace.type,
      state: currentOsmPlace.country || 'India',
      lat: currentOsmPlace.lat,
      lon: currentOsmPlace.lon,
      baselineFrp: 35.0,
      spikeFrp: 350.0,
      type: currentOsmPlace.type || 'industrial',
      classification: 'INDUSTRIAL_ACCIDENTAL_FIRE',
    } : PRESET_PLACES[0]);

  const currentHotspot = liveDetections.find((d) => d.id === selectedHotspotId) || liveDetections[0];

  const getSimulatedFrp = () => {
    if (sourceTab === 'CUSTOM') return parseFloat(customFrp) || 350.0;
    if (sourceTab === 'HOTSPOTS' && currentHotspot) return currentHotspot.frp;
    if (severityMode === 'ELEVATED') return Math.round(currentPlace.baselineFrp * 2.2);
    if (severityMode === 'EXTREME') return Math.round(currentPlace.spikeFrp * 1.6);
    return currentPlace.spikeFrp;
  };

  const handleSendPlaceAlert = async () => {
    setDispatching(true);
    setDispatchResult(null);

    let lat: number;
    let lon: number;
    let name: string;
    let frp: number;
    let classification: string;
    let riskScore: number;
    let facilityType: string;

    if (sourceTab === 'CUSTOM') {
      lat = parseFloat(customLat);
      lon = parseFloat(customLon);
      name = customName;
      frp = parseFloat(customFrp) || 350.0;
      classification = 'MANUAL_OPERATOR_ALERT';
      facilityType = 'industrial';
      riskScore = severityMode === 'EXTREME' ? 99 : severityMode === 'CRITICAL' ? 96 : 84;
    } else if (sourceTab === 'HOTSPOTS' && currentHotspot) {
      lat = currentHotspot.lat;
      lon = currentHotspot.lon;
      name = getHotspotLocationTitle(currentHotspot);
      frp = currentHotspot.frp;
      classification = currentHotspot.classification;
      facilityType = currentHotspot.is_industrial ? 'petroleum_refinery' : 'vegetation';
      riskScore = currentHotspot.risk_score;
    } else {
      lat = currentPlace.lat;
      lon = currentPlace.lon;
      name = currentPlace.name;
      frp = getSimulatedFrp();
      classification = currentPlace.classification;
      facilityType = currentPlace.type;
      riskScore = severityMode === 'EXTREME' ? 99 : severityMode === 'CRITICAL' ? 96 : 84;
    }

    try {
      const res = await detectionService.dispatchCustomAlert({
        lat,
        lon,
        frp,
        brightness: 460.0,
        nearestFacilityName: name,
        facilityType,
        classification,
        riskScore,
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

  const handleSyncOSM = async () => {
    setOsmSyncing(true);
    setOsmSyncMessage(null);
    try {
      const targetLat = currentHotspot ? currentHotspot.lat : 19.04;
      const targetLon = currentHotspot ? currentHotspot.lon : 72.86;
      const res = await detectionService.enrichFromOSM({ lat: targetLat, lon: targetLon, radiusKm: 25 });
      if (res.success) {
        const added = res.data?.addedToML || res.data?.totalAddedToML || 0;
        const fetched = res.data?.fetched || res.data?.totalDiscovered || 0;
        setOsmSyncMessage(`✅ Discovered ${fetched} real facilities from OpenStreetMap (${added} new registered in ML catalog).`);
        const facs = await detectionService.getFacilities();
        if (facs && facs.length > 0) setDynamicFacilities(facs);
      } else {
        setOsmSyncMessage('⚠️ OpenStreetMap scan completed with 0 new facilities.');
      }
    } catch (err: any) {
      setOsmSyncMessage(`⚠️ OpenStreetMap sync error: ${err.message}`);
    } finally {
      setOsmSyncing(false);
    }
  };


  // Group distinct live hotspots by hazard tier
  const criticalHotspots = liveDetections.filter((d) => d.risk_score >= 80);
  const elevatedHotspots = liveDetections.filter((d) => d.risk_score >= 60 && d.risk_score < 80);
  const moderateHotspots = liveDetections.filter((d) => d.risk_score >= 35 && d.risk_score < 60);
  const lowHotspots = liveDetections.filter((d) => d.risk_score < 35);

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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink bg-blueprint text-white">
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
                Select any distinct hotspot or benchmark facility to dispatch an instant GPS alert to <strong className="text-blueprint">@pyroguard_alerts_soham_bot</strong>
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

        {/* Source Mode Selector (Tabs) */}
        <div className="flex border-2 border-ink bg-paper p-1 gap-1">
          <button
            type="button"
            onClick={() => setSourceTab('HOTSPOTS')}
            className={`flex-1 py-1.5 px-2 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all ${
              sourceTab === 'HOTSPOTS'
                ? 'bg-ink text-paper-raised'
                : 'text-ink-muted hover:text-ink hover:bg-signal-soft'
            }`}
          >
            🛰️ Distinct Hotspots ({liveDetections.length})
          </button>
          <button
            type="button"
            onClick={() => setSourceTab('BENCHMARK')}
            className={`flex-1 py-1.5 px-2 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all ${
              sourceTab === 'BENCHMARK'
                ? 'bg-ink text-paper-raised'
                : 'text-ink-muted hover:text-ink hover:bg-signal-soft'
            }`}
          >
            🏭 Facilities ({dynamicFacilities.length || PRESET_PLACES.length})
          </button>
          <button
            type="button"
            onClick={() => setSourceTab('CUSTOM')}
            className={`flex-1 py-1.5 px-2 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all ${
              sourceTab === 'CUSTOM'
                ? 'bg-blueprint text-white'
                : 'text-ink-muted hover:text-ink hover:bg-signal-soft'
            }`}
          >
            📍 Custom GPS
          </button>
        </div>

        {/* Dynamic OpenStreetMap Live Overpass Sync Banner */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-2 border-blueprint/40 bg-blueprint/5 p-2 text-xs">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blueprint shrink-0" />
            <span className="font-mono text-[10.5px] text-ink">
              Spatial Catalog: <strong>{dynamicFacilities.length || PRESET_PLACES.length}</strong> facilities (16 seed + {(dynamicFacilities.length > 16 ? dynamicFacilities.length - 16 : 0)} OSM dynamic)
            </span>
          </div>
          <button
            type="button"
            onClick={handleSyncOSM}
            disabled={osmSyncing}
            className="flex items-center justify-center gap-1.5 py-1 px-2.5 font-mono text-[10px] font-bold uppercase tracking-wider border-2 border-blueprint text-blueprint bg-white hover:bg-blueprint hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${osmSyncing ? 'animate-spin' : ''}`} />
            {osmSyncing ? 'Querying Overpass...' : 'Sync OpenStreetMap'}
          </button>
        </div>

        {osmSyncMessage && (
          <div className="border border-signal-dark bg-signal-soft p-2 font-mono text-[11px] text-signal-dark">
            {osmSyncMessage}
          </div>
        )}


        {/* TAB 1: ALL DISTINCT DETECTED HOTSPOTS */}
        {sourceTab === 'HOTSPOTS' && (
          <div className="space-y-2">
            <label className="label flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5 text-blueprint" />
                <span>Select from {liveDetections.length} Unique Geographical Hotspots</span>
              </span>
              {loadingDetections && <span className="font-mono text-[10px] text-ink-muted animate-pulse">Syncing...</span>}
            </label>

            {/* Quick Pills for Distinct High-Risk Locations */}
            {liveDetections.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {liveDetections.slice(0, 5).map((d) => {
                  const locationName = getHotspotLocationTitle(d).split(' (')[0].split(' / ')[0];
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedHotspotId(d.id)}
                      className={`border-2 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                        selectedHotspotId === d.id
                          ? 'border-ink bg-ink text-paper-raised'
                          : d.risk_score >= 80
                          ? 'border-risk-critical bg-paper-raised text-risk-critical hover:bg-risk-critical hover:text-white'
                          : 'border-ink bg-paper-raised text-ink hover:bg-signal-soft'
                      }`}
                    >
                      [{d.risk_score}] {locationName} ({d.frp} MW)
                    </button>
                  );
                })}
              </div>
            )}

            {/* Dropdown with all distinct hotspots */}
            <div className="relative">
              <select
                value={selectedHotspotId}
                onChange={(e) => setSelectedHotspotId(e.target.value)}
                className="input cursor-pointer appearance-none pr-10 text-xs"
              >
                {criticalHotspots.length > 0 && (
                  <optgroup label={`🚨 Critical Hazards (Risk >= 80) — ${criticalHotspots.length} sites`}>
                    {criticalHotspots.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.risk_score}/100] {d.classification.replace(/_/g, ' ')} • {d.frp} MW — {getHotspotLocationTitle(d)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {elevatedHotspots.length > 0 && (
                  <optgroup label={`⚠️ Elevated Risk (Risk 60-79) — ${elevatedHotspots.length} sites`}>
                    {elevatedHotspots.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.risk_score}/100] {d.classification.replace(/_/g, ' ')} • {d.frp} MW — {getHotspotLocationTitle(d)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {moderateHotspots.length > 0 && (
                  <optgroup label={`⚡ Moderate / Operational (Risk 35-59) — ${moderateHotspots.length} sites`}>
                    {moderateHotspots.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.risk_score}/100] {d.classification.replace(/_/g, ' ')} • {d.frp} MW — {getHotspotLocationTitle(d)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {lowHotspots.length > 0 && (
                  <optgroup label={`🟢 Low / Satellite Noise (Risk < 35) — ${lowHotspots.length} sites`}>
                    {lowHotspots.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.risk_score}/100] {d.classification.replace(/_/g, ' ')} • {d.frp} MW — {getHotspotLocationTitle(d)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            </div>
          </div>
        )}

        {/* TAB 2: BENCHMARK FACILITIES */}
        {sourceTab === 'BENCHMARK' && (
          <div className="space-y-2">
            <label className="label flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-blueprint" />
              <span>Select Benchmark Industrial Facility</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PLACES.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlaceId(p.id)}
                  className={`border-2 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                    selectedPlaceId === p.id
                      ? 'border-ink bg-ink text-paper-raised'
                      : 'border-ink bg-paper-raised text-ink hover:bg-signal-soft'
                  }`}
                >
                  {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
                </button>
              ))}
            </div>

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
                {dynamicFacilities.some((f) => f.id && f.id.startsWith('OSM-')) && (
                  <optgroup label={`🌐 Live OpenStreetMap Discovered Facilities (${dynamicFacilities.filter((f) => f.id.startsWith('OSM-')).length})`}>
                    {dynamicFacilities.filter((f) => f.id.startsWith('OSM-')).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.type}) — {Number(f.lat).toFixed(2)}°N, {Number(f.lon).toFixed(2)}°E
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM GPS */}
        {sourceTab === 'CUSTOM' && (
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

        {/* Selected Target Live Preview Box */}
        <div className="space-y-2.5 border-2 border-ink bg-paper p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-ink flex items-center gap-2">
              {sourceTab === 'HOTSPOTS' ? (
                <Flame className="w-4 h-4 text-signal" />
              ) : (
                <Factory className="w-4 h-4 text-blueprint" />
              )}
              <span className="truncate max-w-[280px]">
                {sourceTab === 'CUSTOM'
                  ? customName
                  : sourceTab === 'HOTSPOTS' && currentHotspot
                  ? `${currentHotspot.classification.replace(/_/g, ' ')}`
                  : currentPlace.name}
              </span>
            </span>
            <span className="tag-blueprint shrink-0">
              {sourceTab === 'CUSTOM'
                ? `${customLat}° N, ${customLon}° E`
                : sourceTab === 'HOTSPOTS' && currentHotspot
                ? `${currentHotspot.lat.toFixed(3)}° N, ${currentHotspot.lon.toFixed(3)}° E`
                : `${currentPlace.lat}° N, ${currentPlace.lon}° E`}
            </span>
          </div>

          {/* Subtitle with real location name */}
          {sourceTab === 'HOTSPOTS' && currentHotspot && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-blueprint font-bold">
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{getHotspotLocationTitle(currentHotspot)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="border-2 border-ink bg-paper-raised p-2">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                {sourceTab === 'HOTSPOTS' ? 'Measured FRP' : 'Simulated FRP'}
              </span>
              <span className="font-bold text-risk-moderate">{getSimulatedFrp()} MW</span>
            </div>
            <div className="border-2 border-ink bg-paper-raised p-2">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                {sourceTab === 'HOTSPOTS' ? 'Risk Score' : 'Baseline Heat'}
              </span>
              <span className="font-bold text-ink">
                {sourceTab === 'HOTSPOTS' && currentHotspot
                  ? `${currentHotspot.risk_score}/100`
                  : sourceTab === 'CUSTOM'
                  ? 'Dynamic'
                  : `${currentPlace.baselineFrp} MW`}
              </span>
            </div>
            <div className="col-span-2 border-2 border-ink bg-paper-raised p-2 sm:col-span-1">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                {sourceTab === 'HOTSPOTS' ? 'Status' : 'Surge Ratio'}
              </span>
              <span className="font-bold text-signal">
                {sourceTab === 'HOTSPOTS' && currentHotspot
                  ? currentHotspot.status
                  : sourceTab === 'CUSTOM'
                  ? '3.5× Spike'
                  : currentPlace.baselineFrp > 0
                  ? `${(getSimulatedFrp() / currentPlace.baselineFrp).toFixed(1)}× Spike`
                  : 'Wildfire'}
              </span>
            </div>
          </div>

          {/* Severity Mode Selector (for Benchmark and Custom modes) */}
          {sourceTab !== 'HOTSPOTS' && (
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
          )}
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
                : sourceTab === 'CUSTOM'
                ? `📢 Send Telegram Alert for ${customName}`
                : sourceTab === 'HOTSPOTS' && currentHotspot
                ? `📢 Send Alert for ${getHotspotLocationTitle(currentHotspot).split(' (')[0]}`
                : `📢 Send Telegram Alert for ${currentPlace.name}`}
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
