/**
 * THERMOSAFE — What-If Predictive Scenario Simulator Page
 * Dedicated full-screen sandbox enabling interactive risk projections
 * for judges and defense/disaster authorities.
 */

import React from 'react';
import { WhatIfSimulator } from '../components/twin/WhatIfSimulator';
import { Sliders, Sparkles, Activity, ShieldAlert } from 'lucide-react';

export const PredictionPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-indigo-400" />
              What-If Risk Simulation Console
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              STANDOUT INNOVATION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            THERMOSAFE doesn't just evaluate current threat severity — it projects whether a hotspot is actively escalating.
            Simulate forward propagation over 30, 60, and 120 minutes across variable growth curves and demographic exposures.
          </p>
        </div>
      </div>

      {/* Feature Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            Exponential Radiative Spread
          </div>
          <p className="text-xs text-slate-300">
            Projects forward thermal energy scaling factoring satellite repeat orbits and local fuel load.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            Lead-Time Warning Window
          </div>
          <p className="text-xs text-slate-300">
            Calculates actionable intervention runway (minutes until risk exceeds critical 80/100 threshold).
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Dynamic Asset Vulnerability
          </div>
          <p className="text-xs text-slate-300">
            Weights casualty exposure radius and critical petrochemical storage buffer encroachment.
          </p>
        </div>
      </div>

      {/* Simulator Component */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <WhatIfSimulator />
      </div>
    </div>
  );
};
