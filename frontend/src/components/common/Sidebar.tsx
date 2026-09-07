import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Flame,
  History,
  BarChart3,
  ShieldCheck,
  Compass,
  FileText,
} from 'lucide-react';
import { User } from '../../types/index';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  currentUser: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, currentUser }) => {
  const navItems = [
    { id: 'dashboard', sheet: '01', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', sheet: '02', label: 'GIS Map Explorer', icon: MapPin },
    { id: 'prediction', sheet: '03', label: 'What-If Simulator', icon: Compass },
    { id: 'analyze', sheet: '04', label: 'Thermal Analysis', icon: Flame },
    { id: 'history', sheet: '05', label: 'Detection Registry', icon: History },
    { id: 'analytics', sheet: '06', label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'landing', sheet: '00', label: 'System Overview', icon: FileText },
  ];

  if (currentUser?.role === 'ADMIN') {
    navItems.push({ id: 'admin', sheet: '07', label: 'Admin Console', icon: ShieldCheck });
  }

  return (
    <aside className="w-full shrink-0 border-b-2 border-ink bg-paper-raised lg:w-60 lg:border-b-0 lg:border-r-2">
      <div className="flex h-full flex-col justify-between">
        <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-3">
          <div className="hidden px-2 pb-2 pt-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted lg:block">
            Drawing Index
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group flex w-auto shrink-0 items-center gap-2.5 border-2 px-3 py-2 text-left font-mono text-[11px] font-bold uppercase tracking-wider transition-all duration-150 lg:w-full ${
                  isActive
                    ? 'border-ink bg-ink text-paper-raised'
                    : 'border-transparent text-ink-muted hover:border-ink hover:bg-signal-soft hover:text-ink'
                }`}
              >
                <span
                  className={`hidden font-mono text-[10px] lg:inline ${
                    isActive ? 'text-signal' : 'text-ink-faint group-hover:text-signal'
                  }`}
                >
                  {item.sheet}
                </span>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Instrument status block */}
        <div className="hidden border-t-2 border-ink p-3 lg:block">
          <div className="border-2 border-ink bg-paper p-3">
            <div className="mb-2 flex items-center justify-between border-b border-ink/20 pb-1.5">
              <span className="key">Feeds</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-risk-low">
                <span className="h-1.5 w-1.5 bg-risk-low" />
                ONLINE
              </span>
            </div>
            <dl className="space-y-1 font-mono text-[10px] uppercase text-ink-muted">
              <div className="flex justify-between">
                <dt>VIIRS S-NPP</dt>
                <dd className="font-bold text-ink">375 M</dd>
              </div>
              <div className="flex justify-between">
                <dt>MODIS Aqua</dt>
                <dd className="font-bold text-ink">1 KM</dd>
              </div>
              <div className="flex justify-between border-t border-ink/20 pt-1">
                <dt>OSM Registry</dt>
                <dd className="font-bold text-ink">LINKED</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </aside>
  );
};
