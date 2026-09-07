import React, { useEffect, useState } from 'react';
import { Flame, Menu, X, ArrowRight } from 'lucide-react';

interface SiteHeaderProps {
  onNavigate: (page: string) => void;
}

const NAV_LINKS = [
  { href: '#platform', label: 'Platform', no: '01' },
  { href: '#capabilities', label: 'Capabilities', no: '02' },
  { href: '#impact', label: 'Impact', no: '03' },
  { href: '#deployment', label: 'Deployment', no: '04' },
];

export const SiteHeader: React.FC<SiteHeaderProps> = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b-2 border-ink bg-paper-raised transition-shadow duration-200 ${
        scrolled ? 'shadow-[0_2px_0_0_#0A0A0A]' : ''
      }`}
    >
      <div className="section-shell flex h-16 items-center justify-between gap-4">
        {/* Drawing stamp */}
        <button onClick={() => onNavigate('landing')} className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-signal transition-transform duration-150 group-hover:-translate-y-0.5">
            <Flame className="h-5 w-5 text-white" />
          </span>
          <span className="text-left leading-none">
            <span className="block font-display text-lg font-extrabold uppercase tracking-tight text-ink">
              Pyro<span className="text-signal">Guard</span>
            </span>
            <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted sm:block">
              Thermal intelligence platform
            </span>
          </span>
        </button>

        {/* Sheet index */}
        <nav className="hidden items-center lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group flex items-center gap-1.5 border-l border-ink/15 px-4 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted transition-colors duration-150 hover:text-signal"
            >
              <span className="text-[9px] text-ink-faint group-hover:text-signal">{link.no}</span>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button onClick={() => onNavigate('login')} className="btn-ghost">
            Sign in
          </button>
          <button onClick={() => onNavigate('dashboard')} className="btn-primary">
            Launch console
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="btn-icon lg:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t-2 border-ink bg-paper-raised lg:hidden">
          <nav className="section-shell flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 border-b border-ink/10 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink"
              >
                <span className="text-[9px] text-ink-faint">{link.no}</span>
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate('login');
                }}
                className="btn-secondary w-full"
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate('dashboard');
                }}
                className="btn-primary w-full"
              >
                Launch console
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </nav>
        </div>
      )}

      <div className="ruler-x" />
    </header>
  );
};
