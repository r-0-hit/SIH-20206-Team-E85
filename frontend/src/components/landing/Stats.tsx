import React from 'react';
import { Quote } from 'lucide-react';
import { useCountUp } from './useInView';

interface Stat {
  target: number;
  suffix: string;
  decimals?: number;
  label: string;
  caption: string;
}

const STATS: Stat[] = [
  { target: 94.6, suffix: '%', decimals: 1, label: 'Classification accuracy', caption: 'Held-out validation across 6 classes' },
  { target: 375, suffix: 'm', label: 'Spatial resolution', caption: 'VIIRS I-band per thermal pixel' },
  { target: 6, suffix: '', label: 'Event categories', caption: 'From accidental fires to solar glint' },
  { target: 2.4, suffix: 's', decimals: 1, label: 'Median inference', caption: 'Ingest to scored, explained verdict' },
];

const StatTile: React.FC<{ stat: Stat }> = ({ stat }) => {
  const { ref, value } = useCountUp(stat.target);

  return (
    <div
      ref={ref}
      className="glass-card p-6 text-center sm:p-7"
    >
      <div className="font-mono text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        {value.toFixed(stat.decimals ?? 0)}
        <span className="text-accent-400">{stat.suffix}</span>
      </div>
      <p className="mt-3 text-sm font-bold text-slate-200">{stat.label}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{stat.caption}</p>
    </div>
  );
};

export const Stats: React.FC = () => {
  return (
    <section id="impact" className="relative py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-72 bg-accent-600/10 blur-3xl" />

      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Measured impact</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
            Numbers a control room can act on
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {STATS.map((stat) => (
            <StatTile key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Testimonial */}
        <figure className="glass-card mx-auto mt-12 max-w-3xl p-7 sm:p-9">
          <Quote className="h-7 w-7 text-accent-500/50" />
          <blockquote className="mt-4 text-lg leading-relaxed text-slate-200 sm:text-xl">
            “The gap was never detection — it was interpretation. Knowing within seconds
            whether a hotspot is a permitted flare or a tank rupture is what changes the
            response.”
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-indigo-600 text-sm font-bold text-white">
              DM
            </span>
            <span className="text-sm">
              <span className="block font-bold text-white">Disaster Management Cell</span>
              <span className="block text-xs text-slate-500">
                Critical infrastructure protection — problem statement stakeholder
              </span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
};
