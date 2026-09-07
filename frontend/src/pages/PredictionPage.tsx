/**
 * What-If predictive scenario simulator — a dedicated sandbox for projecting
 * forward risk trajectories.
 */

import React from 'react';
import { WhatIfSimulator } from '../components/twin/WhatIfSimulator';
import { Sparkles, Activity, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet } from '../components/ui/Sheet';
import { TitleBlock } from '../components/ui/TitleBlock';

const CAPABILITIES = [
  {
    icon: Activity,
    title: 'Exponential radiative spread',
    body: 'Projects forward thermal energy scaling, factoring satellite repeat orbits and local fuel load.',
    rule: 'bg-blueprint',
  },
  {
    icon: ShieldAlert,
    title: 'Lead-time warning window',
    body: 'Calculates the intervention runway — minutes until risk crosses the critical 80/100 threshold.',
    rule: 'bg-signal',
  },
  {
    icon: Sparkles,
    title: 'Dynamic asset vulnerability',
    body: 'Weights casualty exposure radius and petrochemical storage buffer encroachment.',
    rule: 'bg-ink',
  },
];

export const PredictionPage: React.FC = () => {
  return (
    <div className="page-shell space-y-6">
      <PageHeader
        sheet="DWG 03"
        title="What-If Risk Simulation Console"
        description="PyroGuard does not only score current severity — it projects whether a hotspot is escalating. Simulate forward propagation over 30, 60 and 120 minutes across growth curves and exposure profiles."
        actions={<span className="tag-signal">STANDOUT INNOVATION</span>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CAPABILITIES.map((c) => {
          const Icon = c.icon;
          return (
            <Sheet key={c.title} className="relative overflow-hidden p-4">
              <div className={`absolute inset-x-0 top-0 h-1 ${c.rule}`} />
              <div className="mt-1 flex items-center gap-2">
                <Icon className="h-4 w-4 text-ink" />
                <h3 className="font-display text-xs font-extrabold uppercase tracking-tight text-ink">
                  {c.title}
                </h3>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">{c.body}</p>
            </Sheet>
          );
        })}
      </div>

      <Sheet className="p-5" framed>
        <WhatIfSimulator />
      </Sheet>

      <TitleBlock sheetNo="03" view="What-if simulation" />
    </div>
  );
};
