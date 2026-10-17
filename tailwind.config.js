/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Per-event accent. Set as an "R G B" triplet on any ancestor via
        // <AccentScope color="#1b6ef3"> so opacity modifiers keep working.
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent) / 0.12)',
        },
        pass: '#0e9f6e',
        fail: '#e02424',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        display: ['clamp(2.25rem, 6vw, 3.5rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        title: ['1.625rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },
      borderRadius: { xl2: '1.25rem', xl3: '1.75rem' },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.14)',
        lift: '0 2px 4px rgba(0,0,0,0.05), 0 18px 40px -18px rgba(0,0,0,0.25)',
      },
      keyframes: {
        'stroke-in': { from: { strokeDashoffset: '120' }, to: { strokeDashoffset: '0' } },
        'wash-in': { from: { opacity: '0', transform: 'scale(1.04)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'rise': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        'pulse-ring': { '0%': { transform: 'scale(0.9)', opacity: '0.7' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
      },
      animation: {
        'stroke-in': 'stroke-in 420ms cubic-bezier(0.65,0,0.35,1) forwards',
        'wash-in': 'wash-in 180ms ease-out',
        'rise': 'rise 260ms cubic-bezier(0.22,1,0.36,1) both',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
