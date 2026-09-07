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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'GIS Map Explorer', icon: MapPin },
    { id: 'prediction', label: 'What-If Simulator', icon: Compass },
    { id: 'analyze', label: 'AI Thermal Analysis', icon: Flame },
    { id: 'history', label: 'Detection History', icon: History },
    { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'landing', label: 'System Overview', icon: FileText },
  ];

  if (currentUser?.role === 'ADMIN') {
    navItems.push({ id: 'admin', label: 'Admin Console', icon: ShieldCheck });
  }

  return (
    <aside className="w-full lg:w-64 bg-[#0c121e]/80 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-slate-800/80 p-3 lg:p-4 flex lg:flex-col justify-between shrink-0">
      <div className="space-y-1 w-full flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 lg:gap-1.5 pb-2 lg:pb-0">
        <div className="hidden lg:block px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Intelligence Console
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 w-auto lg:w-full text-left ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sensor Status Footer */}
      <div className="hidden lg:block pt-4 border-t border-slate-800/60 text-xs">
        <div className="glass-panel p-3 rounded-xl space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Satellite Feeds:</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>VIIRS S-NPP:</span>
              <span className="font-mono text-slate-300">375m Res</span>
            </div>
            <div className="flex justify-between">
              <span>MODIS Aqua:</span>
              <span className="font-mono text-slate-300">1km Res</span>
            </div>
          </div>
          <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800">
            OpenStreetMap Industrial DB Linked
          </div>
        </div>
      </div>
    </aside>
  );
};

