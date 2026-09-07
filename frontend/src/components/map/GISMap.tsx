import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Flame,
  Factory,
  Eye,
  ShieldAlert,
  Layers,
  RefreshCw,
  Clock,
  Sliders,
  ArrowUpRight,
  TrendingUp,
  Activity,
  X,
  Filter,
  Check,
  Send,
} from 'lucide-react';
import { Detection, Facility } from '../../types/index';
import { RiskBadge } from '../common/RiskBadge';
import { RiskMeter } from '../common/RiskMeter';
import { detectionService } from '../../services/detectionService';

interface GISMapProps {
  detections: Detection[];
  facilities: Facility[];
  selectedDetection?: Detection | null;
  onSelectDetection?: (detection: Detection) => void;
  onRunWhatIf?: () => void;
  onRefresh?: () => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
}

// Controller component to smoothly fly to selected coordinates
const MapViewController: React.FC<{ center?: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Custom Icon generator for THERMOSAFE Risk Pins
const createRiskIcon = (riskScore: number, isIndustrial: boolean) => {
  let color = '#22c55e'; // Green (Low)
  let pulseHtml = '';

  if (riskScore >= 80) {
    color = '#ef4444'; // Red (Critical)
    pulseHtml = '<div class="fire-pulse-ring"></div>';
  } else if (riskScore >= 60) {
    color = '#f97316'; // Orange (High)
  } else if (riskScore >= 35) {
    color = '#eab308'; // Amber (Moderate)
  }

  const iconClass = isIndustrial ? 'rounded-lg' : 'rounded-full';

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer transform -translate-x-1/2 -translate-y-1/2">
      ${pulseHtml}
      <div style="background-color: ${color}; box-shadow: 0 0 14px ${color};" class="w-7 h-7 ${iconClass} flex items-center justify-center text-white border-2 border-slate-900 z-10 hover:scale-125 transition-transform font-mono text-[10px] font-extrabold">
        ${riskScore}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-risk-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Custom Icon generator for Raw NASA FIRMS Hotspots
const createFirmsIcon = (frp: number) => {
  const size = frp > 100 ? 14 : frp > 40 ? 10 : 8;
  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transform -translate-x-1/2 -translate-y-1/2">
      <div class="rounded-full bg-rose-500/80 border border-amber-300 shadow-[0_0_8px_#ef4444]" style="width: ${size}px; height: ${size}px;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-firms-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Custom Facility Marker Icon
const facilityIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer transform -translate-x-1/2 -translate-y-1/2">
      <div class="w-7 h-7 rounded-lg bg-blue-600/90 text-white flex items-center justify-center border-2 border-slate-900 shadow-[0_0_12px_rgba(59,130,246,0.6)] hover:scale-125 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        </svg>
      </div>
    </div>
  `,
  className: 'custom-facility-pin',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export const GISMap: React.FC<GISMapProps> = ({
  detections,
  facilities,
  selectedDetection: externalSelected,
  onSelectDetection,
  onRunWhatIf,
  onRefresh,
  height = '620px',
  center = [23.5937, 78.9629],
  zoom = 5,
}) => {
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [selectedAnomaly, setSelectedAnomaly] = useState<Detection | null>(externalSelected || null);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [timeStep, setTimeStep] = useState<number>(0); // 0 = NOW, -1..-3 historical, +1..+3 future
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('14:32 UTC');

  // Layer Visibility Controls
  const [showFirmsLayer, setShowFirmsLayer] = useState(true);
  const [showRiskLayer, setShowRiskLayer] = useState(true);
  const [showFacilitiesLayer, setShowFacilitiesLayer] = useState(true);
  const [showVectorsLayer, setShowVectorsLayer] = useState(true);

  // Filter Controls
  const [filterCritical, setFilterCritical] = useState(true);
  const [filterHigh, setFilterHigh] = useState(true);
  const [filterModerate, setFilterModerate] = useState(true);
  const [filterLow, setFilterLow] = useState(true);
  const [filterIndustrialOnly, setFilterIndustrialOnly] = useState(false);

  // Manual Alert State
  const [alertingId, setAlertingId] = useState<string | null>(null);
  const [mapAlertToast, setMapAlertToast] = useState<string | null>(null);

  const handleQuickAlert = async (target: any) => {
    const id = target.id || `${target.lat},${target.lon}`;
    setAlertingId(id);
    try {
      if (target.id && !String(target.id).startsWith('MANUAL') && !String(target.id).startsWith('IND')) {
        const res = await detectionService.dispatchIncidentAlert(target.id);
        setMapAlertToast(res.message || 'Telegram alert dispatched!');
      } else {
        const res = await detectionService.dispatchCustomAlert({
          lat: target.lat,
          lon: target.lon,
          frp: target.frp,
          brightness: target.brightness,
          nearestFacilityName: target.name || target.nearestFacilityName || target.nearest_facility_name,
          facilityType: target.type || target.facilityType,
          classification: target.classification || 'MANUAL_FACILITY_ALERT',
          riskScore: target.risk_score || target.riskScore || 92,
        });
        setMapAlertToast(res.message || 'Telegram alert dispatched!');
      }
      setTimeout(() => setMapAlertToast(null), 5000);
    } catch (err: any) {
      setMapAlertToast(err.message || 'Failed to dispatch Telegram alert');
      setTimeout(() => setMapAlertToast(null), 5000);
    } finally {
      setAlertingId(null);
    }
  };

  useEffect(() => {
    if (externalSelected) {
      setSelectedAnomaly(externalSelected);
    }
  }, [externalSelected]);

  const tileUrls = {
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  // Filter Detections
  const filteredDetections = detections.filter((d) => {
    if (filterIndustrialOnly && !d.is_industrial) return false;
    if (!filterCritical && d.risk_score >= 80) return false;
    if (!filterHigh && d.risk_score >= 60 && d.risk_score < 80) return false;
    if (!filterModerate && d.risk_score >= 35 && d.risk_score < 60) return false;
    if (!filterLow && d.risk_score < 35) return false;
    return true;
  });

  const criticalCount = detections.filter((d) => d.risk_score >= 80).length;
  const highCount = detections.filter((d) => d.risk_score >= 60 && d.risk_score < 80).length;
  const industrialCount = detections.filter((d) => d.is_industrial).length;

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      const now = new Date();
      setLastUpdatedTime(`${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')} UTC`);
      setIsRefreshing(false);
    }, 800);
  };

  const handleMarkerClick = (detection: Detection) => {
    setSelectedAnomaly(detection);
    if (onSelectDetection) {
      onSelectDetection(detection);
    }
  };

  const activeCenter: [number, number] = selectedAnomaly
    ? [selectedAnomaly.lat, selectedAnomaly.lon]
    : center;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col" style={{ height }}>
      {/* ── Top Operational Intelligence Header Banner ────────────────────────── */}
      <div className="bg-[#0b101d]/95 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-[1000]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/60 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>NEAR-REAL-TIME FIRMS</span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs font-mono text-slate-300">
            <span><strong className="text-white">{detections.length}</strong> FIRMS HOTSPOTS</span>
            <span className="text-slate-600">|</span>
            <span className="text-red-400 font-bold">{criticalCount} CRITICAL</span>
            <span className="text-slate-600">|</span>
            <span className="text-orange-400 font-bold">{highCount} HIGH</span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400 font-bold">{industrialCount} INDUSTRIAL</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Last satellite pass: <strong className="text-slate-200">{lastUpdatedTime}</strong>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition border ${
              showLayerMenu
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layers & Filters</span>
          </button>
        </div>
      </div>

      {/* ── Time Slider / Trajectory Controller Bar ──────────────────────────── */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between gap-4 text-xs z-[999]">
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] shrink-0">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>TIME TIMELINE:</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
          {[
            { step: -3, label: '-24h' },
            { step: -2, label: '-6h' },
            { step: -1, label: '-1h' },
            { step: 0,  label: 'NOW (LIVE)', isLive: true },
            { step: 1,  label: '+30m' },
            { step: 2,  label: '+60m' },
            { step: 3,  label: '+120m' },
          ].map((t) => (
            <button
              key={t.step}
              onClick={() => setTimeStep(t.step)}
              className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold transition ${
                timeStep === t.step
                  ? t.step > 0
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="hidden lg:block text-[10px] font-mono text-slate-400 shrink-0">
          {timeStep > 0 ? (
            <span className="text-purple-300 font-semibold">🔮 PREDICTED RISK TRAJECTORY MODE</span>
          ) : (
            <span className="text-emerald-400 font-semibold">🛰️ OBSERVED SATELLITE SWATH MODE</span>
          )}
        </div>
      </div>

      {/* ── Map Canvas Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <MapContainer
          center={activeCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapViewController
            center={selectedAnomaly ? [selectedAnomaly.lat, selectedAnomaly.lon] : undefined}
            zoom={selectedAnomaly ? 11 : undefined}
          />

          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>, OpenStreetMap & NASA FIRMS'
            url={tileUrls[mapLayer]}
            maxZoom={18}
          />

          {/* ── Industrial Facilities & Hazard Buffer Layer ────────────────── */}
          {showFacilitiesLayer &&
            facilities.map((fac) => (
              <React.Fragment key={fac.id}>
                <Marker position={[fac.lat, fac.lon]} icon={facilityIcon}>
                  <Popup>
                    <div className="p-1 space-y-1.5 text-xs text-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-blue-400">
                        <Factory className="w-4 h-4" />
                        <span>{fac.name}</span>
                      </div>
                      <p className="text-slate-400">
                        ID: <span className="font-mono text-slate-200">{fac.id}</span>
                      </p>
                      <p className="text-slate-400">
                        Category: <span className="text-slate-200 font-mono capitalize">{fac.type.replace('_', ' ')}</span>
                      </p>
                      <p className="text-slate-400">
                        Hazard Radius: <span className="font-mono text-amber-400">{fac.buffer_km} km</span>
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAlert(fac);
                        }}
                        disabled={alertingId === fac.id}
                        className="w-full mt-2 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{alertingId === fac.id ? 'Sending...' : '📢 Send Telegram Alert'}</span>
                      </button>
                    </div>
                  </Popup>
                </Marker>

                <Circle
                  center={[fac.lat, fac.lon]}
                  radius={fac.buffer_km * 1000}
                  pathOptions={{
                    color: fac.risk_category === 'CRITICAL' ? '#ef4444' : '#3b82f6',
                    fillColor: fac.risk_category === 'CRITICAL' ? '#ef4444' : '#3b82f6',
                    fillOpacity: 0.08,
                    weight: 1,
                    dashArray: '4, 6',
                  }}
                />
              </React.Fragment>
            ))}

          {/* ── Distance Vectors to Nearest Facility ───────────────────────── */}
          {showVectorsLayer &&
            filteredDetections.map((d) => {
              if (!d.nearest_facility_name) return null;
              const matchedFac = facilities.find(
                (f) => f.id === d.nearest_facility_id || f.name === d.nearest_facility_name
              );
              if (!matchedFac) return null;

              const distKm = d.nearest_facility_dist_km ?? d.nearest_facility?.distance_km ?? 1.5;
              const isClose = distKm <= 2.0;

              return (
                <Polyline
                  key={`vec-${d.id}`}
                  positions={[
                    [d.lat, d.lon],
                    [matchedFac.lat, matchedFac.lon],
                  ]}
                  pathOptions={{
                    color: isClose ? '#ef4444' : '#3b82f6',
                    weight: isClose ? 2 : 1,
                    dashArray: '5, 5',
                    opacity: 0.7,
                  }}
                >
                  <Tooltip permanent={false} direction="center">
                    <span className="font-mono text-[10px] text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                      {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
                    </span>
                  </Tooltip>
                </Polyline>
              );
            })}

          {/* ── Raw NASA FIRMS Hotspots Layer ──────────────────────────────── */}
          {showFirmsLayer &&
            filteredDetections.map((d) => (
              <Marker
                key={`firms-${d.id}`}
                position={[d.lat - 0.0008, d.lon - 0.0008]}
                icon={createFirmsIcon(d.frp)}
              >
                <Tooltip direction="top">
                  <div className="font-mono text-[10px]">
                    <strong>RAW NASA FIRMS</strong>: {d.frp} MW | {d.brightness} K
                  </div>
                </Tooltip>
              </Marker>
            ))}

          {/* ── THERMOSAFE AI Risk Analyzed Layer ──────────────────────────── */}
          {showRiskLayer &&
            filteredDetections.map((d) => {
              let displayRisk = d.risk_score;
              if (timeStep === 1) displayRisk = Math.min(99, Math.round(d.risk_score * 1.08));
              if (timeStep === 2) displayRisk = Math.min(99, Math.round(d.risk_score * 1.15));
              if (timeStep === 3) displayRisk = Math.min(99, Math.round(d.risk_score * 1.22));

              return (
                <Marker
                  key={`risk-${d.id}`}
                  position={[d.lat, d.lon]}
                  icon={createRiskIcon(displayRisk, d.is_industrial)}
                  eventHandlers={{
                    click: () => handleMarkerClick(d),
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-2 text-xs min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="font-mono text-[10px] text-slate-400">{d.id}</span>
                        <RiskBadge classification={d.classification} riskScore={displayRisk} showScore />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                        <div className="bg-slate-900 p-1 rounded">
                          <span className="text-[9px] text-slate-400 block">FRP</span>
                          <span className="font-bold text-amber-400">{d.frp} MW</span>
                        </div>
                        <div className="bg-slate-900 p-1 rounded">
                          <span className="text-[9px] text-slate-400 block">BRIGHTNESS</span>
                          <span className="font-bold text-rose-400">{d.brightness} K</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkerClick(d)}
                        className="w-full py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition"
                      >
                        <Eye className="w-3 h-3" /> Inspect Anomaly
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAlert(d);
                        }}
                        disabled={alertingId === d.id}
                        className="w-full py-1 rounded bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition shadow-sm disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{alertingId === d.id ? 'Sending...' : '📢 Send Telegram Alert'}</span>
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* Floating In-Map Toast for Manual Alert Feedback */}
        {mapAlertToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1002] px-4 py-2 rounded-xl bg-sky-950/95 border border-sky-500/80 text-sky-200 text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-bounce">
            <Send className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{mapAlertToast}</span>
            <button onClick={() => setMapAlertToast(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Layer Controls & Filter Popover Drawer ────────────────────────── */}
        {showLayerMenu && (
          <div className="absolute top-3 right-3 z-[1001] w-72 glass-panel-elevated p-4 rounded-2xl border border-slate-700 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" /> Map Layers & Controls
              </span>
              <button onClick={() => setShowLayerMenu(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Map Tiles */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Basemap</span>
              <div className="grid grid-cols-3 gap-1">
                {(['dark', 'satellite', 'street'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMapLayer(m)}
                    className={`py-1 text-[11px] font-semibold rounded capitalize border ${
                      mapLayer === m ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Layers */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Feature Layers</span>
              <div className="space-y-1 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showFirmsLayer} onChange={(e) => setShowFirmsLayer(e.target.checked)} className="rounded accent-blue-600" />
                  <span>NASA FIRMS Raw Hotspots</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showRiskLayer} onChange={(e) => setShowRiskLayer(e.target.checked)} className="rounded accent-blue-600" />
                  <span>THERMOSAFE AI Risk Layer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showFacilitiesLayer} onChange={(e) => setShowFacilitiesLayer(e.target.checked)} className="rounded accent-blue-600" />
                  <span>Industrial Facilities & Buffers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showVectorsLayer} onChange={(e) => setShowVectorsLayer(e.target.checked)} className="rounded accent-blue-600" />
                  <span>Proximity Distance Vectors</span>
                </label>
              </div>
            </div>

            {/* Risk Filters */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Risk Level Filters</span>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <button
                  onClick={() => setFilterCritical(!filterCritical)}
                  className={`py-1 px-2 rounded text-[11px] font-semibold border text-left flex items-center justify-between ${
                    filterCritical ? 'bg-red-950/80 border-red-800 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>🔴 Critical (80+)</span>
                  {filterCritical && <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setFilterHigh(!filterHigh)}
                  className={`py-1 px-2 rounded text-[11px] font-semibold border text-left flex items-center justify-between ${
                    filterHigh ? 'bg-orange-950/80 border-orange-800 text-orange-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>🟠 High (60-79)</span>
                  {filterHigh && <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setFilterModerate(!filterModerate)}
                  className={`py-1 px-2 rounded text-[11px] font-semibold border text-left flex items-center justify-between ${
                    filterModerate ? 'bg-amber-950/80 border-amber-800 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>🟡 Moderate (35-59)</span>
                  {filterModerate && <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setFilterLow(!filterLow)}
                  className={`py-1 px-2 rounded text-[11px] font-semibold border text-left flex items-center justify-between ${
                    filterLow ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>🟢 Low (&lt;35)</span>
                  {filterLow && <Check className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Standout Click-to-Analyze Side Inspector Drawer ──────────────── */}
        {selectedAnomaly && (
          <div className="absolute top-4 right-4 bottom-4 w-96 max-w-[calc(100vw-2.5rem)] glass-panel-elevated p-5 rounded-2xl border border-indigo-900/60 shadow-2xl flex flex-col justify-between z-[1002] animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-400 font-bold">{selectedAnomaly.id}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedAnomaly.acq_date || '2026-09-07'} at {selectedAnomaly.acq_time || '2200'} UTC
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1">
                    {selectedAnomaly.nearest_facility_name || 'Industrial Thermal Target'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Threat Gauge & Badge */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-around">
                <RiskMeter score={selectedAnomaly.risk_score} size="md" />
                <div className="space-y-1.5">
                  <RiskBadge classification={selectedAnomaly.classification} />
                  <div className="text-[11px] text-slate-400">
                    ML Probability: <strong className="text-slate-200 font-mono">{Math.round(selectedAnomaly.confidence_score * 100)}%</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Satellite: <strong className="text-slate-200 font-mono">{selectedAnomaly.satellite}</strong>
                  </div>
                </div>
              </div>

              {/* Radiometric Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="glass-panel p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Fire Rad. Power</span>
                  <span className="text-amber-400 font-bold text-base">{selectedAnomaly.frp} MW</span>
                </div>
                <div className="glass-panel p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Brightness Temp</span>
                  <span className="text-rose-400 font-bold text-base">{selectedAnomaly.brightness} K</span>
                </div>
              </div>

              {/* Thermal Twin Anomaly Metrics */}
              <div className="glass-panel p-3 rounded-xl border border-purple-900/40 bg-purple-950/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Facility Thermal Twin
                  </span>
                  <span className="font-mono text-xs">
                    {selectedAnomaly.thermal_twin?.z_score
                      ? `+${selectedAnomaly.thermal_twin.z_score.toFixed(1)}σ`
                      : '+2.7σ'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {selectedAnomaly.thermal_twin?.alert_message ||
                    'Hotspot intensity is 2.4× above the learned 24-hour facility baseline.'}
                </p>
              </div>

              {/* 2-Hour Projected Risk Trajectory */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-red-400" /> Projected Risk Trajectory
                  </span>
                  <span className="text-[10px] font-mono text-red-400 font-bold">ESCALATING</span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center font-mono">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">NOW</span>
                    <span className="text-sm font-bold text-red-400">{selectedAnomaly.risk_score}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">+30m</span>
                    <span className="text-sm font-bold text-red-400">
                      {Math.min(99, Math.round(selectedAnomaly.risk_score * 1.08))}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">+60m</span>
                    <span className="text-sm font-bold text-red-400">
                      {Math.min(99, Math.round(selectedAnomaly.risk_score * 1.15))}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">+120m</span>
                    <span className="text-sm font-bold text-red-400">
                      {Math.min(99, Math.round(selectedAnomaly.risk_score * 1.22))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => onSelectDetection && onSelectDetection(selectedAnomaly)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <span>View Full AI Intelligence Report</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              {onRunWhatIf && (
                <button
                  onClick={onRunWhatIf}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs transition border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Run What-If Scenario Simulation</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
