/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0d14',
        surface: '#111827',
        'surface-elevated': '#1e293b',
        border: '#1f293d',
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        risk: {
          critical: '#ef4444',
          elevated: '#f97316',
          moderate: '#eab308',
          low: '#10b981',
        },
      },
    },
  },
  plugins: [],
}

