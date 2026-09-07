import React, { useState } from 'react';
import { Flame, ShieldAlert, User as UserIcon, LogOut, Radio, Send } from 'lucide-react';
import { User } from '../../types/index';
import { TelegramAlertModal } from './TelegramAlertModal';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  activePage: string;
  activeCriticalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onNavigate,
  activePage,
  activeCriticalCount,
}) => {
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090D16]/85 px-4 py-3 backdrop-blur-xl transition-all duration-300 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-indigo-600 shadow-glow transition-transform duration-300 group-hover:scale-105">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white lg:text-xl">
                Pyro<span className="text-accent-400">Guard</span>
              </span>
              <span className="rounded-md border border-accent-500/30 bg-accent-500/10 px-1.5 py-0.5 text-[10px] font-bold text-accent-300">
                AI / GIS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide -mt-0.5 hidden sm:block">
              NASA FIRMS & OSM Industrial Thermal Intelligence
            </p>
          </div>
        </div>

        {/* Center Live Alert Ticker */}
        <div className="hidden md:flex items-center gap-3">
          {activeCriticalCount > 0 ? (
            <div
              onClick={() => onNavigate('map')}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 font-mono text-xs text-rose-300 transition-all duration-300 hover:bg-rose-500/20"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="font-bold">{activeCriticalCount} ACTIVE CRITICAL HAZARD(S)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs text-emerald-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>SATELLITE TELEMETRY NORMAL</span>
            </div>
          )}

          {/* Telegram Alert Channel Button */}
          <button
            onClick={() => setShowTelegramModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-950/80 via-blue-950/70 to-slate-900 hover:from-sky-900/80 hover:to-blue-900/80 border border-sky-500/50 text-sky-300 text-xs font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.2)] hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] group"
            title="Open Telegram Emergency Alert Console to select a place and broadcast alerts"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-normal text-slate-300">Alerts:</span>
            <span className="text-cyan-200">📢 Send Alert (Telegram)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Right User & Actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent-500/40 bg-accent-500/20 text-xs font-bold text-accent-300">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {currentUser.fullName}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log Out"
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition-all duration-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2 text-xs font-bold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-400 hover:shadow-glow-lg"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>

      <TelegramAlertModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
      />
    </header>
  );
};

