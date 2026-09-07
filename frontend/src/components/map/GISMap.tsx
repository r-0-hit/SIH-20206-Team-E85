import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Flame, Factory, Eye, ShieldAlert, Layers } from 'lucide-react';
import { Detection, Facility } from '../../types/index';
import { RiskBadge } from '../common/RiskBadge';

interface GISMapProps {
  detections: Detection[];
  facilities: Facility[];
  selectedDetection?: Detection | null;
  onSelectDetection?: (detection: Detection) => void;
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

// Helper to create custom HTML DivIcons for each anomaly type
const createAnomalyIcon = (classification: string, isCritical: boolean) => {
  let color = '#ea580c'; // default orange
  let pulse = '';

  if (classification === 'INDUSTRIAL_ACCIDENTAL_FIRE') {
    color = '#ef4444';
    pulse = '<div class="fire-pulse-ring"></div>';
  } else if (classification === 'INDUSTRIAL_PERSISTENT') {
    color = '#a855f7';
  } else if (classification === 'WILDFIRE') {
    color = '#f97316';
  } else if (classification === 'AGRICULTURAL_BURNING') {
    color = '#eab308';
  } else if (classification === 'MINING_EXTRACTION') {
    color = '#64748b';
  }

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer transform -translate-x-1/2 -translate-y-1/2">
      ${pulse}
      <div style="background-color: ${color}; box-shadow: 0 0 14px ${color};" class="w-7 h-7 rounded-full flex items-center justify-center text-white border-2 border-slate-900 z-10 hover:scale-125 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-thermal-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Facility Icon
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
  selectedDetection,
  onSelectDetection,
  height = '580px',
  center = [23.5937, 78.9629], // Default centroid over South Asia/India
  zoom = 5,
}) => {
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [showFacilities, setShowFacilities] = useState(true);
  const [showBuffers, setShowBuffers] = useState(true);
  const [filterIndustrialOnly, setFilterIndustrialOnly] = useState(false);

  const tileUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  const filteredDetections = filterIndustrialOnly
    ? detections.filter((d) => d.is_industrial)
    : detections;

  const activeCenter: [number, number] = selectedDetection
    ? [selectedDetection.lat, selectedDetection.lon]
    : center;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl" style={{ height }}>
      {/* Map Control Bar Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-wrap items-center gap-2 glass-panel p-2 rounded-xl text-xs">
        <div className="flex items-center gap-1 bg-slate-800/90 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setMapLayer('dark')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              mapLayer === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark Carto
          </button>
          <button
            onClick={() => setMapLayer('satellite')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              mapLayer === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapLayer('street')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              mapLayer === 'street' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Streets
          </button>
        </div>

        <button
          onClick={() => setShowFacilities(!showFacilities)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-medium ${
            showFacilities
              ? 'bg-blue-950/80 border-blue-600 text-blue-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Factory className="w-3.5 h-3.5" />
          Facilities ({facilities.length})
        </button>

        <button
          onClick={() => setShowBuffers(!showBuffers)}
          disabled={!showFacilities}
          className={`px-2.5 py-1.5 rounded-lg border transition font-medium ${
            showBuffers && showFacilities
              ? 'bg-indigo-950/80 border-indigo-600 text-indigo-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 opacity-60'
          }`}
        >
          Buffers
        </button>

        <button
          onClick={() => setFilterIndustrialOnly(!filterIndustrialOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-medium ${
            filterIndustrialOnly
              ? 'bg-rose-950/80 border-rose-600 text-rose-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Industrial Only
        </button>
      </div>

      {/* Legend Badge Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-panel p-3 rounded-xl border border-slate-800 text-[11px] space-y-1.5 pointer-events-none sm:pointer-events-auto">
        <p className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] mb-2">GIS Threat Legend</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
          <span className="text-slate-300 font-medium">Industrial Accidental Fire</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
          <span className="text-slate-300 font-medium">Industrial Flare / Persistent</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
          <span className="text-slate-300 font-medium">Wildfire / Forest Fire</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#eab308]" />
          <span className="text-slate-300 font-medium">Agricultural Stubble</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-lg bg-blue-600 border border-slate-700" />
          <span className="text-slate-300 font-medium">Cataloged Industrial Plant</span>
        </div>
      </div>

      {/* Active Anomaly Counter Banner */}
      <div className="absolute top-4 left-4 z-[1000] glass-panel px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>VIIRS / MODIS LIVE OVERLAYS:</span>
        <span className="font-bold text-white">{filteredDetections.length} ANOMALIES</span>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={activeCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapViewController center={selectedDetection ? [selectedDetection.lat, selectedDetection.lon] : undefined} zoom={selectedDetection ? 10 : undefined} />

        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> & NASA FIRMS'
          url={tileUrls[mapLayer]}
          maxZoom={19}
        />

        {/* Industrial Facilities Layer */}
        {showFacilities &&
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
                      Category:{' '}
                      <span className="text-slate-200 font-mono capitalize">
                        {fac.type.replace('_', ' ')}
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Hazard Buffer:{' '}
                      <span className="font-mono text-amber-400">{fac.buffer_km} km</span>
                    </p>
                    <p className="text-slate-400">
                      Operational Flaring:{' '}
                      <span className={fac.operational_flaring ? 'text-purple-400 font-bold' : 'text-slate-400'}>
                        {fac.operational_flaring ? 'YES (Active Permit)' : 'NO'}
                      </span>
                    </p>
                  </div>
                </Popup>
              </Marker>

              {showBuffers && (
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
              )}
            </React.Fragment>
          ))}

        {/* Thermal Anomaly Detections Layer */}
        {filteredDetections.map((d) => (
          <Marker
            key={d.id}
            position={[d.lat, d.lon]}
            icon={createAnomalyIcon(d.classification, d.risk_score >= 80)}
            eventHandlers={{
              click: () => onSelectDetection && onSelectDetection(d),
            }}
          >
            <Popup>
              <div className="p-1 space-y-2 text-xs min-w-[220px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-mono text-[10px] text-slate-400">{d.id}</span>
                  <RiskBadge classification={d.classification} riskScore={d.risk_score} showScore />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Fire Rad. Power</span>
                    <span className="font-bold text-amber-400 text-sm">{d.frp} MW</span>
                  </div>
                  <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Brightness</span>
                    <span className="font-bold text-rose-400 text-sm">{d.brightness} K</span>
                  </div>
                </div>

                {d.nearest_facility_name && (
                  <p className="text-[11px] text-slate-300">
                    <span className="text-slate-400">Nearest Facility: </span>
                    <span className="font-semibold text-blue-400">{d.nearest_facility_name}</span>
                    <span className="text-slate-400 block text-[10px]">
                      Distance: {d.nearest_facility_dist_km ?? (d.nearest_facility?.distance_km ?? 'N/A')} km
                    </span>
                  </p>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {d.satellite} ({d.daynight === 'N' ? 'Night' : 'Day'})
                  </span>
                  {onSelectDetection && (
                    <button
                      onClick={() => onSelectDetection(d)}
                      className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] flex items-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" /> Details
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

