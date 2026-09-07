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
  activeCriticalCount,
}) => {
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper-raised">
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-2.5 lg:px-8">
        {/* Drawing stamp */}
        <button
          onClick={() => onNavigate('landing')}
          className="group flex items-center gap-3 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-signal transition-transform duration-150 group-hover:-translate-y-0.5">
            <Flame className="h-5 w-5 text-white" />
          </span>
          <span className="leading-none">
            <span className="flex items-center gap-2">
              <span className="font-display text-lg font-extrabold uppercase tracking-tight text-ink">
                Pyro<span className="text-signal">Guard</span>
              </span>
              <span className="tag-ink hidden sm:inline-flex">AI / GIS</span>
            </span>
            <span className="mt-1 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted sm:block">
              NASA FIRMS × OSM Thermal Intelligence
            </span>
          </span>
        </button>

        {/* Live telemetry stamp + alert console */}
        <div className="hidden items-center gap-2 md:flex">
          {activeCriticalCount > 0 ? (
            <button
              onClick={() => onNavigate('map')}
              className="tag-danger animate-blink"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {activeCriticalCount} ACTIVE CRITICAL HAZARD(S)
            </button>
          ) : (
            <span className="tag-ok">
              <Radio className="h-3.5 w-3.5" />
              SATELLITE TELEMETRY NORMAL
            </span>
          )}

          {/* Telegram emergency alert console */}
          <button
            onClick={() => setShowTelegramModal(true)}
            className="btn-secondary btn-sm"
            title="Open the Telegram emergency alert console to select a place and broadcast alerts"
          >
            <Send className="h-3.5 w-3.5 text-blueprint" />
            <span>Send alert</span>
            <span className="h-1.5 w-1.5 animate-blink bg-risk-low" />
          </button>
        </div>

        {/* Operator block */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <div className="hidden items-center gap-2.5 border-2 border-ink bg-paper px-3 py-1.5 sm:flex">
                <span className="flex h-6 w-6 items-center justify-center border border-ink bg-blueprint font-mono text-[10px] font-bold text-white">
                  {currentUser.fullName.charAt(0)}
                </span>
                <span className="leading-tight">
                  <span className="block font-mono text-[11px] font-bold uppercase text-ink">
                    {currentUser.fullName}
                  </span>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                    ROLE: {currentUser.role}
                  </span>
                </span>
              </div>

              <button onClick={onLogout} title="Sign out" className="btn-icon">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button onClick={() => onNavigate('login')} className="btn-primary">
              <UserIcon className="h-3.5 w-3.5" />
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Measurement rule under the header */}
      <div className="ruler-x" />

      <TelegramAlertModal isOpen={showTelegramModal} onClose={() => setShowTelegramModal(false)} />
    </header>
  );
};
