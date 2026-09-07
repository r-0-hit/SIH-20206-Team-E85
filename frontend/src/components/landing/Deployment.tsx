import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface DeploymentProps {
  onNavigate: (page: string) => void;
}

interface Tier {
  no: string;
  name: string;
  price: string;
  unit: string;
  blurb: string;
  features: string[];
  cta: string;
  page: string;
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    no: '01',
    name: 'Pilot',
    price: 'Free',
    unit: 'evaluation tier',
    blurb: 'For a single plant or a hackathon-scale evaluation of the pipeline.',
    features: [
      'One monitored region, 7-day history',
      'VIIRS + MODIS ingest',
      'Risk scoring and XAI evidence',
      'Community support',
    ],
    cta: 'Explore the demo',
    page: 'dashboard',
  },
  {
    no: '02',
    name: 'Operations',
    price: '₹4.2L',
    unit: '/ year per zone',
    blurb: 'For plant safety commands and district disaster authorities running 24×7.',
    features: [
      'Unlimited regions, 2-year history',
      'Automated SOP dispatch + alerting',
      'Role-based access with audit logs',
      'GIS layer exports and REST API',
      'Priority incident support',
    ],
    cta: 'Run a thermal analysis',
    page: 'analyze',
    featured: true,
  },
  {
    no: '03',
    name: 'National',
    price: 'Custom',
    unit: 'agency agreement',
    blurb: 'For state and national agencies fusing PyroGuard with existing command systems.',
    features: [
      'On-premise or sovereign cloud',
      'Custom sensor and LULC integrations',
      'Model retraining on regional data',
      'Dedicated onboarding and SLA',
    ],
    cta: 'Review the architecture',
    page: 'analytics',
  },
];

export const Deployment: React.FC<DeploymentProps> = ({ onNavigate }) => (
  <section id="deployment" className="border-b-2 border-ink py-14 sm:py-20">
    <div className="section-shell">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="tag-solid">04 · DEPLOYMENT</span>
          <h2 className="rule-title mt-3">Start with one plant. Scale to a nation.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            The same detection core, sized to the mandate you operate under.
          </p>
        </div>
        <span className="annotation">Bill of materials · 3 options</span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <article
            key={tier.name}
            className={`sheet flex h-full flex-col p-6 ${
              tier.featured ? 'border-signal shadow-hard-signal lg:-translate-y-2' : 'shadow-hard-sm'
            }`}
          >
            <div className="flex items-center justify-between border-b-2 border-ink pb-3">
              <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.1em] text-ink">
                {tier.name}
              </h3>
              {tier.featured ? (
                <span className="tag-signal">MOST DEPLOYED</span>
              ) : (
                <span className="font-mono text-[10px] tracking-[0.14em] text-ink-faint">{tier.no}</span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold uppercase tracking-tight text-ink">
                {tier.price}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                {tier.unit}
              </span>
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">{tier.blurb}</p>

            <ul className="mt-5 flex-1 space-y-2.5 border-t border-ink/15 pt-4">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-[12px] leading-snug text-ink-soft">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border-2 border-ink">
                    <Check className="h-2.5 w-2.5 text-signal" strokeWidth={4} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onNavigate(tier.page)}
              className={`mt-6 w-full ${tier.featured ? 'btn-primary' : 'btn-secondary'}`}
            >
              {tier.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </article>
        ))}
      </div>

      {/* Conversion banner, drawn as a mindset callout */}
      <div className="sheet shadow-hard mt-10 flex flex-col items-start justify-between gap-5 p-6 sm:p-8 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <span className="tag-signal">READY</span>
          <h3 className="mt-3 font-display text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
            Inspect live thermal telemetry
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Open the GIS explorer, score a live NASA FIRMS swath, and read the evidence behind every
            classification.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button onClick={() => onNavigate('dashboard')} className="btn-primary px-6 py-3">
            Go to dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => onNavigate('map')} className="btn-secondary px-6 py-3">
            Open GIS map
          </button>
        </div>
      </div>
    </div>
  </section>
);
