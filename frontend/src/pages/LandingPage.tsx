import React from 'react';
import { SiteHeader } from '../components/landing/SiteHeader';
import { Hero } from '../components/landing/Hero';
import { Platform } from '../components/landing/Platform';
import { Features } from '../components/landing/Features';
import { Stats } from '../components/landing/Stats';
import { Deployment } from '../components/landing/Deployment';
import { SiteFooter } from '../components/landing/SiteFooter';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

/**
 * Public single-page marketing site. Renders standalone (no console chrome)
 * with its own sticky header and footer.
 */
export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader onNavigate={onNavigate} />
      <main>
        <Hero onNavigate={onNavigate} />
        <Platform />
        <Features />
        <Stats />
        <Deployment onNavigate={onNavigate} />
      </main>
      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
};
