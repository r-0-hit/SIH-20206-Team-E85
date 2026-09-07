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
      { label: 'Detection registry', page: 'history' },
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
    'font-mono text-[11px] uppercase tracking-wider text-ink-muted transition-colors duration-150 hover:text-signal';

  return (
    <footer className="bg-paper-raised">
      <div className="section-shell py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-signal">
                <Flame className="h-5 w-5 text-white" />
              </span>
              <span className="font-display text-lg font-extrabold uppercase tracking-tight text-ink">
                Pyro<span className="text-signal">Guard</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-ink-soft">
              Satellite thermal intelligence for industrial fire detection, persistent source
              monitoring and critical infrastructure protection.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-8 w-8 items-center justify-center border-2 border-ink bg-paper-raised text-ink transition-colors duration-150 hover:bg-signal hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4 className="border-b-2 border-ink pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink">
                {column.heading}
              </h4>
              <ul className="mt-3 space-y-2.5">
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
      </div>

      {/* Drawing title block */}
      <div className="title-block border-t-2">
        <span>
          PROJECT: <strong>PYROGUARD AI</strong>
        </span>
        <span className="hidden sm:inline text-ink/25">|</span>
        <span>
          TEAM: <strong>E85</strong>
        </span>
        <span className="hidden sm:inline text-ink/25">|</span>
        <span>
          EVENT: <strong>SMART INDIA HACKATHON 2026</strong>
        </span>
        <span className="hidden md:inline text-ink/25">|</span>
        <span className="hidden md:inline">
          © <strong>{new Date().getFullYear()}</strong>
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-risk-low" />
          <strong>ALL SYSTEMS OPERATIONAL</strong>
        </span>
      </div>
    </footer>
  );
};
