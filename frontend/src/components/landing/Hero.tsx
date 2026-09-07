import React from 'react';
import { ArrowRight, Satellite, MapPin, Activity, PlayCircle } from 'lucide-react';

interface HeroProps {
  onNavigate: (page: string) => void;
}

const PREVIEW_ROWS = [
  { label: 'Jamnagar Refinery', tag: 'ACCIDENTAL FIRE', risk: 94, tone: 'tag-danger', bar: 'bg-risk-critical' },
  { label: 'Vizag Petrochem Flare', tag: 'ROUTINE FLARING', risk: 22, tone: 'tag-ok', bar: 'bg-risk-low' },
  { label: 'Bhilai Steel Works', tag: 'INDUSTRIAL HEAT', risk: 48, tone: 'tag-warn', bar: 'bg-risk-moderate' },
];

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative overflow-hidden border-b-2 border-ink">
      {/* Coarse drawing grid over the paper */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-coarse [background-size:80px_80px] opacity-70" />

      <div className="section-shell grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
        {/* Specification column */}
        <div className="animate-draw-in">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="tag-solid">SHEET 00</span>
            <span className="tag-signal">NASA FIRMS × OSM × EXPLAINABLE AI</span>
          </div>

          <h1 className="max-w-[15ch] font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            Tell a refinery fire from a <span className="text-signal">routine flare</span> in seconds.
          </h1>

          <div className="mt-6 border-l-4 border-ink pl-4">
            <p className="max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
              PyroGuard AI fuses satellite thermal radiance, industrial infrastructure registries and
              spatio-temporal persistence tracking to classify every heat anomaly — with a 0–100 risk
              score and the evidence behind it.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={() => onNavigate('dashboard')} className="btn-primary px-6 py-3">
              Launch intelligence console
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => onNavigate('map')} className="btn-secondary px-6 py-3">
              <PlayCircle className="h-4 w-4" />
              See the live GIS map
            </button>
          </div>

          {/* Specification notes */}
          <dl className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-2 border-t-2 border-ink pt-4">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Satellite className="h-3.5 w-3.5 shrink-0 text-ink" />
              <dt className="key">Sensors:</dt>
              <dd className="val">VIIRS 375M · MODIS 1KM</dd>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="h-1.5 w-1.5 shrink-0 animate-blink bg-risk-low" />
              <dt className="key">Feeds:</dt>
              <dd className="val">ONLINE</dd>
            </div>
          </dl>
        </div>

        {/* Instrument preview */}
        <div className="relative animate-draw-in">
          <div className="sheet sheet-framed shadow-hard">
            {/* Instrument header */}
            <div className="flex items-center justify-between border-b-2 border-ink bg-paper-sunk px-4 py-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink">
                Live detection feed
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                <span className="h-1.5 w-1.5 animate-blink bg-signal" />
                REC
              </span>
            </div>

            <div className="space-y-4 p-4">
              {/* Swath scan window */}
              <div className="relative h-28 overflow-hidden border-2 border-ink bg-paper">
                <div className="absolute inset-0 bg-grid-blueprint [background-size:12px_12px]" />
                <div className="absolute inset-y-0 left-0 w-1/5 animate-sweep-x bg-gradient-to-r from-transparent via-signal/20 to-transparent" />
                <div className="absolute left-[22%] top-[38%] h-3 w-3 border-2 border-ink bg-risk-critical">
                  <span className="fire-pulse-ring" />
                </div>
                <div className="absolute left-[62%] top-[62%] h-2.5 w-2.5 border-2 border-ink bg-risk-moderate" />
                <div className="absolute left-[78%] top-[28%] h-2.5 w-2.5 border-2 border-ink bg-risk-low" />
                <span className="absolute bottom-2 left-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                  <MapPin className="h-3 w-3" />
                  SWATH 22.47°N / 70.05°E
                </span>
              </div>

              {/* Detection schedule */}
              <table className="w-full">
                <tbody>
                  {PREVIEW_ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-ink/10 last:border-0">
                      <td className="py-2.5 pr-3">
                        <span className="block font-display text-xs font-extrabold uppercase text-ink">
                          {row.label}
                        </span>
                        <span className={`${row.tone} mt-1`}>{row.tag}</span>
                      </td>
                      <td className="w-28 py-2.5 align-middle">
                        <div className="h-2.5 border border-ink bg-paper-sunk">
                          <div className={`h-full ${row.bar}`} style={{ width: `${row.risk}%` }} />
                        </div>
                        <span className="mt-1 block text-right font-mono text-[10px] font-bold text-ink">
                          {row.risk}/100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Evidence callout */}
              <div className="callout flex items-start gap-2 text-[10px] leading-relaxed">
                <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
                <span>
                  <strong>Evidence:</strong> 180 m from a registered refinery, no 30-day recurrence,
                  FRP 4.6× baseline.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
