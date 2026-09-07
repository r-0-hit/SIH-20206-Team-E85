import React from 'react';
import { Flame, Github, Twitter, Linkedin, Mail } from 'lucide-react';

interface SiteFooterProps {
  onNavigate: (page: string) => void;
}

const COLUMNS: { heading: string; links: { label: string; page?: string; href?: string }[] }[] = [
  {
    heading: 'Platform',
    links: [
      { label: 'Dashboard', page: 'dashboard' },
      { label: 'GIS map explorer', page: 'map' },
      { label: 'Thermal analysis', page: 'analyze' },
      { label: 'What-if simulator', page: 'prediction' },
    ],
  },
  {
    heading: 'Intelligence',
    links: [
      { label: 'Detection history', page: 'history' },
      { label: 'Analytics & trends', page: 'analytics' },
      { label: 'Capabilities', href: '#capabilities' },
      { label: 'Deployment', href: '#deployment' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'API documentation', href: '/api/docs' },
      { label: 'NASA FIRMS', href: 'https://firms.modaps.eosdis.nasa.gov/' },
      { label: 'OpenStreetMap', href: 'https://www.openstreetmap.org/' },
      { label: 'Sign in', page: 'login' },
    ],
  },
];

const SOCIALS = [
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Mail, label: 'Email', href: 'mailto:contact@pyroguard.ai' },
];

export const SiteFooter: React.FC<SiteFooterProps> = ({ onNavigate }) => {
  const linkClass =
    'text-sm text-slate-400 transition-colors duration-300 hover:text-white';

  return (
    <footer className="border-t border-white/10 bg-[#070A11]">
      <div className="section-shell py-14 sm:py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-indigo-600 shadow-glow">
                <Flame className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-white">
                Pyro<span className="text-accent-400">Guard</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Satellite thermal intelligence for industrial fire detection, persistent
              source monitoring and critical infrastructure protection.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-500/40 hover:text-accent-300"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-200">
                {column.heading}
              </h4>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.page ? (
                      <button onClick={() => onNavigate(link.page!)} className={linkClass}>
                        {link.label}
                      </button>
                    ) : (
                      <a href={link.href} className={linkClass}>
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} PyroGuard AI · Smart India Hackathon 2026 · Team E85
          </p>
          <div className="flex items-center gap-6">
            <a href="#platform" className="text-xs text-slate-500 transition-colors duration-300 hover:text-slate-300">
              Privacy
            </a>
            <a href="#platform" className="text-xs text-slate-500 transition-colors duration-300 hover:text-slate-300">
              Terms
            </a>
            <span className="inline-flex items-center gap-2 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
