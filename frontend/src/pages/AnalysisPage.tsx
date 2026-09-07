import React, { useState } from 'react';
import {
  Flame,
  Satellite,
  Compass,
  Zap,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { detectionService } from '../services/detectionService';
import { Detection } from '../types/index';

interface AnalysisPageProps {
  onAnalysisComplete: (newDetection: Detection) => void;
  onNavigate: (page: string) => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ onAnalysisComplete, onNavigate }) => {
  // Form input state
  const [lat, setLat] = useState<string>('22.3619');
  const [lon, setLon] = useState<string>('69.8318');
  const [brightness, setBrightness] = useState<string>('465.0');
  const [frp, setFrp] = useState<string>('385.0');
  const [satellite, setSatellite] = useState<string>('VIIRS-SNPP');
  const [daynight, setDaynight] = useState<string>('N');
  const [confidence, setConfidence] = useState<string>('high');

  const [loading, setLoading] = useState<boolean>(false);
  const [swathLoading, setSwathLoading] = useState<boolean>(false);
  const [swathRegion, setSwathRegion] = useState<string>('South Asia');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Scenario Presets for instant evaluation
  const presets = [
    {
      label: 'Jamnagar Refinery Tank Fire',
      desc: 'Severe accidental industrial explosion',
      category: 'Accidental Fire',
      badgeColor: 'border-red-500/50 bg-red-950/40 text-red-300',
      data: { lat: '22.3619', lon: '69.8318', brightness: '475.0', frp: '420.0', daynight: 'N', confidence: 'high' },
    },
    {
      label: 'Panipat Operational Flare',
      desc: 'Routine industrial flaring emission',
      category: 'Persistent Source',
      badgeColor: 'border-purple-500/50 bg-purple-950/40 text-purple-300',
      data: { lat: '29.3941', lon: '76.8833', brightness: '358.0', frp: '42.5', daynight: 'N', confidence: 'nominal' },
    },
    {
      label: 'Simlipal Forest Wildfire',
      desc: 'Remote vegetative biomass fire front',
      category: 'Wildfire',
      badgeColor: 'border-orange-500/50 bg-orange-950/40 text-orange-300',
      data: { lat: '21.7512', lon: '86.3325', brightness: '388.0', frp: '98.0', daynight: 'D', confidence: 'high' },
    },
    {
      label: 'Punjab Stubble Burning',
      desc: 'Seasonal agricultural parcel fire',
      category: 'Agricultural',
      badgeColor: 'border-amber-500/50 bg-amber-950/40 text-amber-300',
      data: { lat: '30.3712', lon: '76.7745', brightness: '335.0', frp: '26.0', daynight: 'D', confidence: 'nominal' },
    },
    {
      label: 'Jharia Coalfield Seam Fire',
      desc: 'Subterranean mining combustion',
      category: 'Mining',
      badgeColor: 'border-slate-500/50 bg-slate-800/60 text-slate-300',
      data: { lat: '23.7431', lon: '86.4175', brightness: '396.0', frp: '82.0', daynight: 'N', confidence: 'high' },
    },
  ];

  const applyPreset = (presetData: any) => {
    setLat(presetData.lat);
    setLon(presetData.lon);
    setBrightness(presetData.brightness);
    setFrp(presetData.frp);
    setDaynight(presetData.daynight);
    setConfidence(presetData.confidence);
    setError(null);
  };

  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      const parsedBrightness = parseFloat(brightness);
      const parsedFrp = parseFloat(frp);

      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        throw new Error('Latitude must be a valid number between -90 and 90.');
      }
      if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
        throw new Error('Longitude must be a valid number between -180 and 180.');
      }

      const result = await detectionService.analyzeThermalSource({
        lat: parsedLat,
        lon: parsedLon,
        brightness: parsedBrightness,
        frp: parsedFrp,
        satellite,
        daynight,
        confidence,
      });

      setSuccessMsg(`Analysis complete! Classified as ${result.classification} (Risk Score: ${result.risk_score}/100)`);
      onAnalysisComplete(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze observation');
    } finally {
      setLoading(false);
    }
  };

  const handleIngestSwath = async () => {
    setSwathLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const results = await detectionService.ingestFIRMSSwath(swathRegion, satellite as any);
      setSuccessMsg(`Successfully ingested and classified ${results.length} NASA FIRMS satellite detections!`);
      if (results.length > 0) {
        onAnalysisComplete(results[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to ingest NASA FIRMS satellite data');
    } finally {
      setSwathLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Flame className="w-7 h-7 text-rose-500" />
          <span>Thermal Analysis & Satellite Ingestion Studio</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Submit thermal coordinates for real-time AI classification or ingest live NASA FIRMS satellite swaths.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
          >
            View on GIS Map
          </button>
        </div>
      )}

      {/* Scenario Presets Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Benchmark Scenario Presets (Click to Load)</span>
          </h2>
          <span className="text-[11px] text-slate-400">Validated against ground-truth incidents</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p.data)}
              className="glass-panel p-3 rounded-xl border border-slate-800 hover:border-slate-600 transition text-left space-y-1.5 group hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${p.badgeColor}`}>
                  {p.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-400">Apply</span>
              </div>
              <h3 className="text-xs font-bold text-slate-200 group-hover:text-white leading-tight">
                {p.label}
              </h3>
              <p className="text-[10px] text-slate-400 line-clamp-2">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form & FIRMS Swath Ingest Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Coordinate Input Form */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Thermal Observation Parameters</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter satellite radiometric parameters or ground telemetry for AI classification.
            </p>
          </div>

          <form onSubmit={handleAnalyzeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Latitude (Decimal Degrees)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 22.3619"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Longitude (Decimal Degrees)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  placeholder="e.g. 69.8318"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Brightness Temperature (Kelvin)
                </label>
                <input
                  type="number"
                  step="any"
                  value={brightness}
                  onChange={(e) => setBrightness(e.target.value)}
                  placeholder="300 - 550 K"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fire Radiative Power (FRP in Megawatts)
                </label>
                <input
                  type="number"
                  step="any"
                  value={frp}
                  onChange={(e) => setFrp(e.target.value)}
                  placeholder="e.g. 350.0 MW"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Satellite Instrument
                </label>
                <select
                  value={satellite}
                  onChange={(e) => setSatellite(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="VIIRS-SNPP">VIIRS (Suomi-NPP 375m)</option>
                  <option value="VIIRS-NOAA20">VIIRS (NOAA-20 375m)</option>
                  <option value="VIIRS-NOAA21">VIIRS (NOAA-21 375m)</option>
                  <option value="MODIS-Aqua">MODIS (Aqua 1km)</option>
                  <option value="MODIS-Terra">MODIS (Terra 1km)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Overpass Time
                </label>
                <select
                  value={daynight}
                  onChange={(e) => setDaynight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="N">Night Swath (Zero Solar Glint)</option>
                  <option value="D">Daytime Swath</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sensor Confidence
                </label>
                <select
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="high">High (&gt;80%)</option>
                  <option value="nominal">Nominal (50-80%)</option>
                  <option value="low">Low (&lt;50%)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Executing AI Inference & GIS Query...' : 'Run Real-Time AI Classification'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: NASA FIRMS Swath Ingest */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-blue-900/50 space-y-4 bg-gradient-to-b from-blue-950/30 to-slate-900">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Satellite className="w-4 h-4 text-blue-400" />
                <span>NASA FIRMS Live Ingestion</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bulk ingest and classify current orbital satellite swaths.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Geographic Region
                </label>
                <select
                  value={swathRegion}
                  onChange={(e) => setSwathRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="South Asia">South Asia / India Industrial Belt</option>
                  <option value="Middle East">Middle East Flare Complexes</option>
                  <option value="Southeast Asia">Southeast Asia Refining Hubs</option>
                  <option value="North America">North America Petrochemical Basin</option>
                  <option value="Global">Global High-Priority Corridor</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleIngestSwath}
                disabled={swathLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Satellite className={`w-4 h-4 ${swathLoading ? 'animate-spin' : ''}`} />
                <span>{swathLoading ? 'Ingesting NASA Swath...' : 'Ingest & Classify Swath'}</span>
              </button>
            </div>
          </div>

          {/* Batch File Upload Note */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-purple-400" />
              Batch CSV / GeoJSON Upload
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Have historical NASA FIRMS CSV dumps or GIS shapefiles? Batch upload and automated model inference available via the REST API endpoint:
            </p>
            <div className="p-2 rounded bg-slate-900/90 font-mono text-[11px] text-blue-300 border border-slate-800">
              POST /api/detections/analyze
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

