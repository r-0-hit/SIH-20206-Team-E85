import React, { useEffect, useState } from 'react';
import { Flame, Menu, X, ArrowRight } from 'lucide-react';

interface SiteHeaderProps {
  onNavigate: (page: string) => void;
}

const NAV_LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#impact', label: 'Impact' },
  { href: '#deployment', label: 'Deployment' },
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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-[#090D16]/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="section-shell flex h-16 items-center justify-between sm:h-20">
        {/* Logo */}
        <button
          onClick={() => onNavigate('landing')}
          className="group flex items-center gap-3 text-left"
          aria-label="PyroGuard AI home"
        >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-indigo-600 shadow-glow transition-transform duration-300 group-hover:scale-105">
            <Flame className="h-5 w-5 text-white" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-white">
              Pyro<span className="text-accent-400">Guard</span>
            </span>
            <span className="hidden text-[11px] font-medium tracking-wide text-slate-400 sm:block">
              Thermal Intelligence Platform
            </span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-300 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={() => onNavigate('login')}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition-colors duration-300 hover:text-white"
          >
            Sign in
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-400 hover:shadow-glow-lg"
          >
            Launch Console
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-colors duration-300 hover:bg-white/10 lg:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#090D16]/95 backdrop-blur-xl lg:hidden">
          <nav className="section-shell flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition-colors duration-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate('login');
                }}
                className="btn-ghost w-full"
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
                Launch Console
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
