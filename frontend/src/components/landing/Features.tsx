import React from 'react';
import { Satellite, Layers, ShieldCheck, Radar, Brain, Siren, LucideIcon } from 'lucide-react';

interface Feature {
  no: string;
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  { no: '01', icon: Satellite, title: 'Multi-sensor FIRMS ingest', body: 'Streams VIIRS 375m I-band from Suomi-NPP and NOAA-20/21 alongside MODIS 1km, covering day and night thermal overpasses.' },
  { no: '02', icon: Layers, title: 'OSM geospatial fusion', body: 'Matches every anomaly against refineries, power stations, steel works and chemical complexes, plus land-cover buffers.' },
  { no: '03', icon: Radar, title: 'Persistence clustering', body: 'DBSCAN over historical overpasses separates stationary flare stacks from a transient fire front that just appeared.' },
  { no: '04', icon: Brain, title: 'Calibrated ML ensemble', body: 'A 120-tree random forest returns probabilities you can trust, sorted into six operational and environmental classes.' },
  { no: '05', icon: ShieldCheck, title: 'Explainable evidence', body: 'Every verdict ships with distance metrics, recurrence ratios and radiance deltas — audit-ready for a review board.' },
  { no: '06', icon: Siren, title: 'Automated SOP dispatch', body: 'Classification triggers the matching response checklist so dispatchers act on protocol, not on guesswork.' },
];

export const Features: React.FC = () => (
  <section id="capabilities" className="border-b-2 border-ink py-14 sm:py-20">
    <div className="section-shell">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="tag-solid">02 · CAPABILITIES</span>
          <h2 className="rule-title mt-3 max-w-2xl">Six layers between a pixel and a decision</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            Each stage narrows the uncertainty, so what reaches a control room is a classified event
            with evidence — not a raw thermal blip.
          </p>
        </div>
        <span className="annotation">Assembly · 6 units</span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.no} className="sheet sheet-hover shadow-hard-sm group h-full p-5">
              <div className="flex items-start justify-between gap-3 border-b-2 border-ink pb-3">
                <span className="flex h-10 w-10 items-center justify-center border-2 border-ink bg-paper transition-colors duration-150 group-hover:bg-signal">
                  <Icon className="h-4 w-4 text-ink transition-colors duration-150 group-hover:text-white" />
                </span>
                <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-ink-faint">
                  {feature.no}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-extrabold uppercase leading-tight tracking-tight text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">{feature.body}</p>
            </article>
          );
        })}
      </div>
    </div>
  </section>
);
