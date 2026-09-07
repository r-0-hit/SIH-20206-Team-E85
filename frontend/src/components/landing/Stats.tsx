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
  { target: 375, suffix: 'M', label: 'Spatial resolution', caption: 'VIIRS I-band per thermal pixel' },
  { target: 6, suffix: '', label: 'Event categories', caption: 'From accidental fires to solar glint' },
  { target: 2.4, suffix: 'S', decimals: 1, label: 'Median inference', caption: 'Ingest to scored, explained verdict' },
];

const StatTile: React.FC<{ stat: Stat; index: number }> = ({ stat, index }) => {
  const { ref, value } = useCountUp(stat.target);

  return (
    <div ref={ref} className="sheet shadow-hard-sm relative p-5">
      <span className="absolute right-3 top-3 font-mono text-[9px] tracking-[0.14em] text-ink-faint">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="font-display text-4xl font-extrabold leading-none tracking-tight text-ink">
        {value.toFixed(stat.decimals ?? 0)}
        <span className="text-signal">{stat.suffix}</span>
      </div>
      <div className="mt-3 border-t-2 border-ink pt-2">
        <p className="font-display text-xs font-extrabold uppercase tracking-tight text-ink">
          {stat.label}
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase leading-relaxed tracking-wider text-ink-muted">
          {stat.caption}
        </p>
      </div>
    </div>
  );
};

export const Stats: React.FC = () => (
  <section id="impact" className="border-b-2 border-ink py-14 sm:py-20">
    <div className="section-shell">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="tag-solid">03 · MEASURED IMPACT</span>
          <h2 className="rule-title mt-3">Numbers a control room can act on</h2>
        </div>
        <span className="annotation">Verified against held-out data</span>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <StatTile key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      {/* Field note */}
      <figure className="sheet shadow-hard mt-8 p-6 sm:p-8">
        <Quote className="h-6 w-6 text-signal" />
        <blockquote className="mt-3 max-w-3xl font-display text-lg font-extrabold uppercase leading-snug tracking-tight text-ink sm:text-xl">
          “The gap was never detection — it was interpretation. Knowing within seconds whether a
          hotspot is a permitted flare or a tank rupture is what changes the response.”
        </blockquote>
        <figcaption className="mt-5 flex items-center gap-3 border-t-2 border-ink pt-4">
          <span className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-blueprint font-mono text-[11px] font-bold text-white">
            DM
          </span>
          <span>
            <span className="block font-display text-xs font-extrabold uppercase text-ink">
              Disaster Management Cell
            </span>
            <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">
              Critical infrastructure protection — problem statement stakeholder
            </span>
          </span>
        </figcaption>
      </figure>
    </div>
  </section>
);
