import React from 'react';
import {
  Flame,
  ShieldCheck,
  Globe2,
  Satellite,
  Layers,
  ArrowRight,
  AlertTriangle,
  Cpu,
  Compass,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 py-6 max-w-7xl mx-auto px-4 lg:px-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-[#0c121e] to-[#090d16] border border-slate-800 p-8 lg:p-14 shadow-2xl">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>AI-Enabled Geospatial Intelligence Platform</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Detection & Classification of <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-orange-400">Industrial Fires</span> & Persistent Thermal Sources
          </h1>

          <p className="text-base lg:text-lg text-slate-300 leading-relaxed">
            Integrating <strong>NASA FIRMS satellite thermal data (VIIRS/MODIS)</strong>, <strong>OpenStreetMap (OSM)</strong> industrial infrastructure registries, and high-resolution land-cover layers to segregate acute industrial hazards from routine gas flaring, agricultural burning, and natural wildfires.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition transform hover:-translate-y-0.5"
            >
              <span>Launch Intelligence Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-bold text-sm transition"
            >
              <Globe2 className="w-4 h-4 text-blue-400" />
              <span>Explore GIS Overlays</span>
            </button>
          </div>
        </div>
      </section>

      {/* The Core Problem & The AI Solution */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-2xl border border-rose-900/40 space-y-4 relative overflow-hidden">
          <div className="p-3 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/60 w-fit">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">The Satellite Monitoring Gap</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Current satellite monitoring systems such as <strong>NASA FIRMS</strong> detect raw thermal anomalies (FRP, brightness temperature), but <strong>cannot distinguish</strong> whether a heat anomaly is an emergency oil refinery explosion, a permitted routine gas flare, agricultural crop stubble burning, or a remote forest fire.
          </p>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Delayed emergency response during refinery/chemical explosions.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              False alerts triggered by routine operational flare stacks.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Lack of integration between satellite data and critical industrial infrastructure GIS.
            </li>
          </ul>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-blue-900/40 space-y-4 relative overflow-hidden">
          <div className="p-3 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/60 w-fit">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">The PyroGuard AI Solution</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Our multi-stage AI/ML framework combines <strong>Spatio-Temporal Persistence Tracking</strong>, <strong>Geospatial Proximity Fusing (OSM)</strong>, and <strong>Calibrated Random Forest Ensembles</strong> to classify and segregate thermal sources with explainable evidence and 0-100 risk scoring.
          </p>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Instant classification into 6 operational and environmental categories.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Persistence clustering differentiates routine flaring from sudden emergency surges.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Automated Standard Operating Procedure (SOP) dispatch recommendations.
            </li>
          </ul>
        </div>
      </section>

      {/* Core Architectural Highlights */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl lg:text-3xl font-bold text-white">Comprehensive System Pillars</h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Engineered for disaster management authorities, plant safety commanders, and environmental agencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400 w-fit border border-slate-700">
              <Satellite className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Sensor FIRMS Ingest</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consumes VIIRS (375m I-band) from Suomi-NPP & NOAA-20/21 plus MODIS (1km) sensors for daytime and nighttime thermal radiance surveillance.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400 w-fit border border-slate-700">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">OSM Geospatial Fusion</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dynamically maps thermal coordinates against oil refineries, power stations, steel works, chemical complexes, and LULC vegetative boundaries.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-rose-400 w-fit border border-slate-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Explainable AI & SOP Dispatch</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Transparent, audit-ready reasoning with distance metrics, recurrence ratios, multi-spectral confidence scores, and action protocols.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="glass-panel-elevated p-8 rounded-3xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white">Ready to inspect live thermal telemetry?</h3>
          <p className="text-xs text-slate-400">
            Open the live GIS Map, run real-time anomaly inferences, or ingest NASA FIRMS swaths.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-500/30"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => onNavigate('analyze')}
            className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-lg shadow-rose-600/30"
          >
            Run Thermal Analysis
          </button>
        </div>
      </section>
    </div>
  );
};

