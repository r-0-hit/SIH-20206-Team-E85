import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface DeploymentProps {
  onNavigate: (page: string) => void;
}

interface Tier {
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

export const Deployment: React.FC<DeploymentProps> = ({ onNavigate }) => {
  return (
    <section id="deployment" className="relative py-20 sm:py-24 lg:py-28">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Deployment</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
            Start with one plant. Scale to a nation.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            The same detection core, sized to the mandate you operate under.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <article
              key={tier.name}
              className={`glass-card flex h-full flex-col p-7 sm:p-8 ${
                tier.featured
                  ? 'border-accent-500/40 bg-accent-500/[0.06] shadow-glow lg:-translate-y-3'
                  : ''
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-accent-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-glow">
                  Most deployed
                </span>
              )}

              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-accent-300">
                {tier.name}
              </h3>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-white">{tier.price}</span>
                <span className="text-xs font-medium text-slate-500">{tier.unit}</span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-400">{tier.blurb}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onNavigate(tier.page)}
                className={`mt-8 w-full ${tier.featured ? 'btn-primary' : 'btn-ghost'}`}
              >
                {tier.cta}
                <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>

        {/* Full-width conversion banner */}
        <div className="relative mt-16 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-accent-600/20 via-indigo-600/10 to-transparent p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Ready to inspect live thermal telemetry?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                Open the GIS explorer, score a live NASA FIRMS swath, and read the
                evidence behind every classification.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button onClick={() => onNavigate('dashboard')} className="btn-primary">
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => onNavigate('map')} className="btn-ghost">
                Open GIS map
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
