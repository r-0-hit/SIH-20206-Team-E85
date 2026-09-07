import React from 'react';
import { AlertTriangle, Cpu, ArrowRight } from 'lucide-react';

const GAPS = [
  'Delayed emergency response during refinery and chemical explosions.',
  'False alerts triggered by permitted, routine operational flare stacks.',
  'No link between raw satellite pixels and industrial infrastructure GIS.',
];

const ANSWERS = [
  'Instant classification into six operational and environmental categories.',
  'Persistence clustering separates steady flaring from a sudden surge.',
  'Automated SOP recommendations dispatched with every high-risk verdict.',
];

const PIPELINE = [
  { step: '01', title: 'Ingest', body: 'FIRMS swath telemetry — FRP, brightness temperature, scan geometry.' },
  { step: '02', title: 'Fuse', body: 'OSM industrial registry proximity plus land-cover context per pixel.' },
  { step: '03', title: 'Classify', body: 'Persistence features into a calibrated ensemble with a 0–100 risk score.' },
  { step: '04', title: 'Dispatch', body: 'Human-readable evidence and the matching response protocol.' },
];

export const Platform: React.FC = () => {
  return (
    <section id="platform" className="relative py-20 sm:py-24 lg:py-28">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">The platform</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
            Satellites see the heat. They don't see the difference.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className="glass-card p-7 sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-white">The monitoring gap</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              NASA FIRMS reports raw thermal anomalies, but cannot say whether a hotspot is
              an oil refinery explosion, a permitted gas flare, seasonal stubble burning or
              a remote forest fire.
            </p>
            <ul className="mt-5 space-y-2.5">
              {GAPS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="glass-card p-7 sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-accent-500/25 bg-accent-500/10">
              <Cpu className="h-5 w-5 text-accent-400" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-white">The PyroGuard answer</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              A multi-stage framework combining spatio-temporal persistence tracking,
              geospatial proximity fusion and calibrated random forest ensembles — every
              verdict backed by explainable evidence.
            </p>
            <ul className="mt-5 space-y-2.5">
              {ANSWERS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>

        {/* Pipeline strip */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((stage, index) => (
            <div key={stage.step} className="glass-card p-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-accent-400">{stage.step}</span>
                {index < PIPELINE.length - 1 && (
                  <ArrowRight className="hidden h-3.5 w-3.5 text-slate-600 lg:block" />
                )}
              </div>
              <h4 className="mt-3 text-base font-bold text-white">{stage.title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{stage.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
