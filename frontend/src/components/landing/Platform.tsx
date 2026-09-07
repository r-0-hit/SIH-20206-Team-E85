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

export const Platform: React.FC = () => (
  <section id="platform" className="border-b-2 border-ink py-14 sm:py-20">
    <div className="section-shell">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="tag-solid">01 · THE PLATFORM</span>
          <h2 className="rule-title mt-3 max-w-2xl">
            Satellites see the heat. They don't see the difference.
          </h2>
        </div>
        <span className="annotation">Problem statement · SIH 2026</span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Gap */}
        <article className="sheet shadow-hard-sm p-6">
          <div className="flex items-center gap-3 border-b-2 border-ink pb-3">
            <span className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-risk-critical">
              <AlertTriangle className="h-4 w-4 text-white" />
            </span>
            <h3 className="font-display text-lg font-extrabold uppercase tracking-tight text-ink">
              The monitoring gap
            </h3>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            NASA FIRMS reports raw thermal anomalies, but cannot say whether a hotspot is an oil
            refinery explosion, a permitted gas flare, seasonal stubble burning or a remote forest
            fire.
          </p>
          <ul className="mt-4 space-y-2.5">
            {GAPS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                <span className="mt-1.5 h-2 w-2 shrink-0 bg-risk-critical" />
                {item}
              </li>
            ))}
          </ul>
        </article>

        {/* Answer */}
        <article className="sheet shadow-hard-sm p-6">
          <div className="flex items-center gap-3 border-b-2 border-ink pb-3">
            <span className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-blueprint">
              <Cpu className="h-4 w-4 text-white" />
            </span>
            <h3 className="font-display text-lg font-extrabold uppercase tracking-tight text-ink">
              The PyroGuard answer
            </h3>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            A multi-stage framework combining spatio-temporal persistence tracking, geospatial
            proximity fusion and calibrated random forest ensembles — every verdict backed by
            explainable evidence.
          </p>
          <ul className="mt-4 space-y-2.5">
            {ANSWERS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border-2 border-ink">
                  <span className="h-1.5 w-1.5 bg-signal" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>

      {/* Process diagram */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PIPELINE.map((stage, index) => (
          <div key={stage.step} className="relative">
            <div className="sheet shadow-hard-sm h-full p-5">
              <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-signal">
                {stage.step}
              </span>
              <h4 className="mt-2 font-display text-base font-extrabold uppercase tracking-tight text-ink">
                {stage.title}
              </h4>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">{stage.body}</p>
            </div>
            {index < PIPELINE.length - 1 && (
              <ArrowRight className="absolute -right-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink lg:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);
