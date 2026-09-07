import React from 'react';
import { Flame, ShieldAlert, User as UserIcon, LogOut, Radio } from 'lucide-react';
import { User } from '../../types/index';

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
  return (
    <header className="sticky top-0 z-50 bg-[#0c121e]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center shadow-[0_0_16px_rgba(244,63,94,0.4)] group-hover:scale-105 transition-transform">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg lg:text-xl tracking-tight text-white font-mono">
                Pyro<span className="text-rose-500">Guard</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
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
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-mono animate-pulse hover:bg-rose-900/60 transition"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="font-bold">{activeCriticalCount} ACTIVE CRITICAL HAZARD(S)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-mono">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>SATELLITE TELEMETRY NORMAL</span>
            </div>
          )}
        </div>

        {/* Right User & Actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-slate-800/60 border border-slate-700/80 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xs">
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
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700/60 text-slate-300 hover:text-rose-300 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-500/20"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

