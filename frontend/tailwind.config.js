/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Heavy grotesque for headings, Inter for prose, Roboto Mono for all annotations
        display: ['Archivo', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Drafting paper
        paper: {
          DEFAULT: '#F3F3F1',
          raised: '#FFFFFF',
          sunk: '#EAE9E4',
          edge: '#DCDAD3',
        },
        // Drawing ink
        ink: {
          DEFAULT: '#0A0A0A',
          soft: '#2B2B2B',
          muted: '#6E6E6E',
          faint: '#9A9A96',
        },
        // Vermilion annotation accent
        signal: {
          DEFAULT: '#F74B00',
          soft: '#FFF0E9',
          line: '#FFC6AB',
          deep: '#C93A00',
        },
        // Blueprint linework
        blueprint: {
          DEFAULT: '#1438AA',
          soft: '#EBEFFB',
          line: '#B9C6EE',
          deep: '#0E2879',
        },
        // Isometric fill slate
        steel: {
          DEFAULT: '#4A576A',
          soft: '#EEF0F3',
          line: '#C6CCD6',
        },
        // Hazard tiers — flat, printed, never glowing
        risk: {
          critical: '#D42200',
          elevated: '#F74B00',
          moderate: '#B47A00',
          low: '#1B7A4B',
        },
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        // Offset "printed" shadows instead of soft glows
        hard: '4px 4px 0 0 #0A0A0A',
        'hard-sm': '2px 2px 0 0 #0A0A0A',
        'hard-signal': '4px 4px 0 0 #F74B00',
        'hard-blueprint': '4px 4px 0 0 #1438AA',
        sheet: '0 1px 2px rgba(10,10,10,0.06), 0 8px 24px -16px rgba(10,10,10,0.35)',
      },
      backgroundImage: {
        // Engineering grid: fine 8px cells over a coarse 80px division
        'grid-fine':
          'linear-gradient(to right, rgba(10,10,10,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.045) 1px, transparent 1px)',
        'grid-coarse':
          'linear-gradient(to right, rgba(10,10,10,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.09) 1px, transparent 1px)',
        'grid-blueprint':
          'linear-gradient(to right, rgba(20,56,170,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,56,170,0.10) 1px, transparent 1px)',
        hatch:
          'repeating-linear-gradient(45deg, #0A0A0A 0 2px, transparent 2px 6px)',
        'hatch-signal':
          'repeating-linear-gradient(45deg, #F74B00 0 2px, transparent 2px 6px)',
      },
      backgroundSize: {
        fine: '8px 8px',
        coarse: '80px 80px',
      },
      keyframes: {
        'draw-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sweep-x': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(320%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
      },
      animation: {
        'draw-in': 'draw-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'sweep-x': 'sweep-x 3.5s ease-in-out infinite',
        blink: 'blink 1.6s step-end infinite',
      },
    },
  },
  plugins: [],
}
