import React from 'react';
import {
  Satellite,
  Layers,
  ShieldCheck,
  Radar,
  Brain,
  Siren,
  LucideIcon,
} from 'lucide-react';
import { useInView } from './useInView';

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    icon: Satellite,
    title: 'Multi-sensor FIRMS ingest',
    body: 'Streams VIIRS 375m I-band from Suomi-NPP and NOAA-20/21 alongside MODIS 1km, covering day and night thermal overpasses.',
    accent: 'text-accent-400',
  },
  {
    icon: Layers,
    title: 'OSM geospatial fusion',
    body: 'Matches every anomaly against refineries, power stations, steel works and chemical complexes, plus land-cover buffers.',
    accent: 'text-indigo-400',
  },
  {
    icon: Radar,
    title: 'Persistence clustering',
    body: 'DBSCAN over historical overpasses separates stationary flare stacks from a transient fire front that just appeared.',
    accent: 'text-sky-400',
  },
  {
    icon: Brain,
    title: 'Calibrated ML ensemble',
    body: 'A 120-tree random forest returns probabilities you can trust, sorted into six operational and environmental classes.',
    accent: 'text-violet-400',
  },
  {
    icon: ShieldCheck,
    title: 'Explainable evidence',
    body: 'Every verdict ships with distance metrics, recurrence ratios and radiance deltas — audit-ready for a review board.',
    accent: 'text-emerald-400',
  },
  {
    icon: Siren,
    title: 'Automated SOP dispatch',
    body: 'Classification triggers the matching response checklist so dispatchers act on protocol, not on guesswork.',
    accent: 'text-rose-400',
  },
];

export const Features: React.FC = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);

  return (
    <section id="capabilities" className="relative py-20 sm:py-24 lg:py-28">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Capabilities</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
            Six layers between a pixel and a decision
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Each stage narrows the uncertainty, so what reaches a control room is a
            classified event with evidence — not a raw thermal blip.
          </p>
        </div>

        <div
          ref={ref}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`glass-card group h-full p-6 sm:p-7 ${inView ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] transition-all duration-300 group-hover:border-accent-500/40 group-hover:bg-accent-500/10">
                  <Icon className={`h-5 w-5 ${feature.accent}`} />
                </span>
                <h3 className="mt-5 text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
