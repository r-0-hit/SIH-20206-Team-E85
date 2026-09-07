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
  Send,
} from 'lucide-react';
import { detectionService } from '../services/detectionService';
import { Detection } from '../types/index';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet, SheetHead } from '../components/ui/Sheet';
import { TitleBlock } from '../components/ui/TitleBlock';

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
  const [manualAlerting, setManualAlerting] = useState<boolean>(false);
  const [swathLoading, setSwathLoading] = useState<boolean>(false);
  const [swathRegion, setSwathRegion] = useState<string>('South Asia');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleManualTelegramAlert = async () => {
    setManualAlerting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      const parsedBrightness = parseFloat(brightness);
      const parsedFrp = parseFloat(frp);

      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        throw new Error('Valid coordinates are required.');
      }

      const res = await detectionService.dispatchCustomAlert({
        lat: parsedLat,
        lon: parsedLon,
        frp: parsedFrp || undefined,
        brightness: parsedBrightness || undefined,
        classification: 'MANUAL_OPERATOR_ALERT',
        riskScore: parsedFrp > 100 ? 95 : 85,
      });

      setSuccessMsg(
        res.message ||
          `Telegram emergency alert dispatched for coordinates [${parsedLat}, ${parsedLon}]!`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch manual Telegram alert.');
    } finally {
      setManualAlerting(false);
    }
  };

  // Scenario Presets for instant evaluation
  const presets = [
    {
      label: 'Jamnagar Refinery Tank Fire',
      desc: 'Severe accidental industrial explosion',
      category: 'Accidental Fire',
      badgeColor: 'tag-danger',
      data: { lat: '22.3619', lon: '69.8318', brightness: '475.0', frp: '420.0', daynight: 'N', confidence: 'high' },
    },
    {
      label: 'Panipat Operational Flare',
      desc: 'Routine industrial flaring emission',
      category: 'Persistent Source',
      badgeColor: 'tag-blueprint',
      data: { lat: '29.3941', lon: '76.8833', brightness: '358.0', frp: '42.5', daynight: 'N', confidence: 'nominal' },
    },
    {
      label: 'Simlipal Forest Wildfire',
      desc: 'Remote vegetative biomass fire front',
      category: 'Wildfire',
      badgeColor: 'tag-signal',
      data: { lat: '21.7512', lon: '86.3325', brightness: '388.0', frp: '98.0', daynight: 'D', confidence: 'high' },
    },
    {
      label: 'Punjab Stubble Burning',
      desc: 'Seasonal agricultural parcel fire',
      category: 'Agricultural',
      badgeColor: 'tag-warn',
      data: { lat: '30.3712', lon: '76.7745', brightness: '335.0', frp: '26.0', daynight: 'D', confidence: 'nominal' },
    },
    {
      label: 'Jharia Coalfield Seam Fire',
      desc: 'Subterranean mining combustion',
      category: 'Mining',
      badgeColor: 'tag-ink',
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
    <div className="page-shell space-y-6">
      <PageHeader
        sheet="DWG 04"
        title="Thermal Analysis & Ingestion Studio"
        description="Submit thermal coordinates for real-time AI classification, or ingest live NASA FIRMS satellite swaths."
      />

      {error && (
        <div className="flex items-center gap-3 border-2 border-risk-critical bg-[#FDECE8] px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-risk-critical">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-risk-low bg-[#EAF5EF] px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-risk-low">
          <span className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMsg}
          </span>
          <button onClick={() => onNavigate('map')} className="btn-secondary btn-sm">
            View on GIS map
          </button>
        </div>
      )}

      {/* Telegram alert channel status */}
      <div className="sheet shadow-hard-sm flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink bg-blueprint">
            <Send className="h-4 w-4 text-white" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-xs font-extrabold uppercase tracking-tight text-ink">
                Telegram alert channel active
              </span>
              <span className="val">(@pyroguard_alerts_soham_bot)</span>
              <span className="h-1.5 w-1.5 animate-blink bg-risk-low" />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
              Continuous refinery flaring (Jamnagar, Panipat) is suppressed. Alerts dispatch{' '}
              <strong>automatically on sudden thermal spikes</strong>, or{' '}
              <strong>manually via the button below</strong>.
            </p>
          </div>
        </div>
        <span className="tag-ok shrink-0">● REAL-TIME DISPATCH READY</span>
      </div>

      {/* Scenario Presets Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="panel-title">
            <Sparkles className="h-4 w-4 text-signal" />
            Benchmark scenario presets
          </h2>
          <span className="annotation">Validated against ground-truth incidents</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p.data)}
              className="sheet sheet-hover shadow-hard-sm group space-y-2 p-3 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={p.badgeColor}>{p.category}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint group-hover:text-signal">
                  Apply
                </span>
              </div>
              <h3 className="font-display text-xs font-extrabold uppercase leading-tight text-ink">
                {p.label}
              </h3>
              <p className="text-[10px] leading-relaxed text-ink-muted">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form & FIRMS Swath Ingest Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Coordinate Input Form */}
        <Sheet className="p-0 lg:col-span-2">
          <SheetHead
            title="Thermal observation parameters"
            icon={<Compass className="h-4 w-4 text-blueprint" />}
            meta="Radiometric input"
          />

          <form onSubmit={handleAnalyzeSubmit} className="space-y-4 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Latitude (Decimal Degrees)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 22.3619"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Longitude (Decimal Degrees)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  placeholder="e.g. 69.8318"
                  required
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Brightness Temperature (Kelvin)
                </label>
                <input
                  type="number"
                  step="any"
                  value={brightness}
                  onChange={(e) => setBrightness(e.target.value)}
                  placeholder="300 - 550 K"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Fire Radiative Power (FRP in Megawatts)
                </label>
                <input
                  type="number"
                  step="any"
                  value={frp}
                  onChange={(e) => setFrp(e.target.value)}
                  placeholder="e.g. 350.0 MW"
                  required
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">
                  Satellite Instrument
                </label>
                <select
                  value={satellite}
                  onChange={(e) => setSatellite(e.target.value)}
                  className="select"
                >
                  <option value="VIIRS-SNPP">VIIRS (Suomi-NPP 375m)</option>
                  <option value="VIIRS-NOAA20">VIIRS (NOAA-20 375m)</option>
                  <option value="VIIRS-NOAA21">VIIRS (NOAA-21 375m)</option>
                  <option value="MODIS-Aqua">MODIS (Aqua 1km)</option>
                  <option value="MODIS-Terra">MODIS (Terra 1km)</option>
                </select>
              </div>

              <div>
                <label className="label">
                  Overpass Time
                </label>
                <select
                  value={daynight}
                  onChange={(e) => setDaynight(e.target.value)}
                  className="select"
                >
                  <option value="N">Night Swath (Zero Solar Glint)</option>
                  <option value="D">Daytime Swath</option>
                </select>
              </div>

              <div>
                <label className="label">
                  Sensor Confidence
                </label>
                <select
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  className="select"
                >
                  <option value="high">High (&gt;80%)</option>
                  <option value="nominal">Nominal (50-80%)</option>
                  <option value="low">Low (&lt;50%)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t-2 border-ink pt-4 sm:flex-row">
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                <Zap className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Executing AI inference…' : 'Run real-time AI classification'}
              </button>
              <button
                type="button"
                onClick={handleManualTelegramAlert}
                disabled={manualAlerting}
                className="btn-blueprint py-3"
                title="Dispatch a Telegram emergency alert for these coordinates"
              >
                <Send className={`h-4 w-4 ${manualAlerting ? 'animate-spin' : ''}`} />
                {manualAlerting ? 'Sending…' : 'Send Telegram alert'}
              </button>
            </div>
          </form>
        </Sheet>

        {/* Right 1 Col: NASA FIRMS Swath Ingest */}
        <div className="space-y-6">
          <Sheet className="p-0" tab>
            <SheetHead
              title="NASA FIRMS live ingestion"
              icon={<Satellite className="h-4 w-4 text-blueprint" />}
            />

            <div className="space-y-3 p-5">
              <p className="text-[11px] leading-relaxed text-ink-soft">
                Bulk ingest and classify current orbital satellite swaths.
              </p>
              <div>
                <label className="label">
                  Target Geographic Region
                </label>
                <select
                  value={swathRegion}
                  onChange={(e) => setSwathRegion(e.target.value)}
                  className="select"
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
                className="btn-blueprint w-full"
              >
                <Satellite className={`h-4 w-4 ${swathLoading ? 'animate-spin' : ''}`} />
                {swathLoading ? 'Ingesting swath…' : 'Ingest & classify swath'}
              </button>
            </div>
          </Sheet>

          {/* Batch File Upload Note */}
          <Sheet className="space-y-2.5 p-5" framed>
            <h3 className="key flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-signal" />
              Batch CSV / GeoJSON upload
            </h3>
            <p className="text-[11px] leading-relaxed text-ink-soft">
              Historical NASA FIRMS CSV dumps and GIS shapefiles can be batch-scored through the REST
              endpoint:
            </p>
            <code className="block border-2 border-ink bg-paper-sunk px-2.5 py-1.5 font-mono text-[11px] text-blueprint">
              POST /api/detections/analyze
            </code>
          </Sheet>
        </div>
      </div>

      <TitleBlock sheetNo="04" view="Thermal analysis studio" />
    </div>
  );
};

