import React from 'react';
import { ArrowRight, PlayCircle, Satellite, Sparkles, Activity, MapPin } from 'lucide-react';

interface HeroProps {
  onNavigate: (page: string) => void;
}

const PREVIEW_ROWS = [
  { label: 'Jamnagar Refinery', tag: 'ACCIDENTAL FIRE', risk: 94, tone: 'rose' as const },
  { label: 'Vizag Petrochem Flare', tag: 'ROUTINE FLARING', risk: 22, tone: 'emerald' as const },
  { label: 'Bhilai Steel Works', tag: 'INDUSTRIAL HEAT', risk: 48, tone: 'amber' as const },
];

const TONES = {
  rose: { text: 'text-rose-300', bg: 'bg-rose-500/12', ring: 'border-rose-500/30', bar: 'bg-rose-500' },
  amber: { text: 'text-amber-300', bg: 'bg-amber-500/12', ring: 'border-amber-500/30', bar: 'bg-amber-400' },
  emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/12', ring: 'border-emerald-500/30', bar: 'bg-emerald-400' },
};

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 lg:pt-24 lg:pb-28">
      {/* Ambient glows + grid */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-faint [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-accent-600/20 blur-3xl animate-glow-pulse" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-rose-600/10 blur-3xl" />
      </div>

      <div className="section-shell grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Copy column */}
        <div className="animate-fade-up">
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            NASA FIRMS × OSM × Explainable AI
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
            Tell a refinery fire from a{' '}
            <span className="bg-gradient-to-r from-accent-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              routine gas flare
            </span>{' '}
            in seconds.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            PyroGuard AI fuses satellite thermal radiance, industrial infrastructure
            registries and spatio-temporal persistence tracking to classify every heat
            anomaly — with a 0–100 risk score and the evidence behind it.
          </p>

          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button onClick={() => onNavigate('dashboard')} className="btn-primary">
              Launch Intelligence Console
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-300 transition-colors duration-300 hover:text-white"
            >
              <PlayCircle className="h-5 w-5 text-accent-400 transition-transform duration-300 group-hover:scale-110" />
              See the live GIS map
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-400">
            <span className="inline-flex items-center gap-2">
              <Satellite className="h-4 w-4 text-accent-400" />
              VIIRS 375m · MODIS 1km
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live satellite feeds online
            </span>
          </div>
        </div>

        {/* Preview card column */}
        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-accent-600/25 via-transparent to-indigo-500/20 blur-2xl" />

          <div className="glass-card overflow-hidden p-0 shadow-card lg:animate-float">
            {/* Window chrome */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <span className="font-mono text-[11px] tracking-wide text-slate-400">
                pyroguard / detections · live
              </span>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {/* Scanning strip */}
              <div className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#0B1220]">
                <div className="absolute inset-0 bg-grid-faint [background-size:28px_28px] opacity-60" />
                <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-accent-500/25 to-transparent animate-sweep-x" />
                <div className="absolute left-[22%] top-[38%] h-3 w-3 rounded-full bg-rose-500 shadow-glow-ember">
                  <span className="fire-pulse-ring" />
                </div>
                <div className="absolute left-[62%] top-[62%] h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="absolute left-[78%] top-[28%] h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-slate-400">
                  <MapPin className="h-3 w-3 text-accent-400" />
                  SWATH 22.47°N / 70.05°E
                </div>
              </div>

              {/* Detection rows */}
              <div className="space-y-2.5">
                {PREVIEW_ROWS.map((row) => {
                  const tone = TONES[row.tone];
                  return (
                    <div
                      key={row.label}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 transition-colors duration-300 hover:bg-white/[0.05]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{row.label}</p>
                        <span
                          className={`mt-1 inline-flex rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide ${tone.bg} ${tone.ring} ${tone.text}`}
                        >
                          {row.tag}
                        </span>
                      </div>
                      <div className="w-20 shrink-0 sm:w-28">
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${row.risk}%` }} />
                        </div>
                        <p className={`mt-1.5 text-right font-mono text-[11px] font-bold ${tone.text}`}>
                          {row.risk}/100
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-accent-500/20 bg-accent-500/[0.07] p-3 text-xs text-slate-300">
                <Activity className="h-4 w-4 shrink-0 text-accent-400" />
                <span>
                  <strong className="font-semibold text-white">Evidence:</strong> 180m from a
                  registered refinery, no 30-day recurrence, FRP 4.6× baseline.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
