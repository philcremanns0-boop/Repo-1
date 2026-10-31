/**
 * Goodnotes design tokens.
 *  - Teal I, Ink I and Eraser I are sampled from the official Goodnotes app logo (#02BDE4 / #0F1010 / #F7F7F7).
 *  - Navy #0A192F is the value given in the brief.
 *  - Teal II–III, Ink II–III, Eraser II and the secondary palette are derived tones: the official Brandpad
 *    swatches (brandpad.io/goodnotes-guidelines) could not be read from this environment – replace when available.
 *  - `ui.*` are values measured from the reference iPad screenshots (toolbar navy, selection blue, …).
 */
const gn = {
  navy: '#0A192F',
  teal: { 1: '#02BDE4', 2: '#7FDDF1', 3: '#CCF2FA' },
  ink: { 1: '#0F1010', 2: '#3C3C43', 3: '#8A8A8F' },
  white: '#FFFFFF',
  eraser: { 1: '#F7F7F7', 2: '#E5E5EA' },
  matcha: '#B9D99A',
  sky: '#A6D8F5',
  kale: '#2E6B4F',
  merlot: '#7A1F3D',
  lavender: '#B4AED0',
  candy: '#F7B9D3',
  ui: {
    bar: '#3262A6', 'bar-deep': '#284D83', 'bar-dark': '#284A85', 'bar-deep-dark': '#1F3260',
    select: '#1A82E0', action: '#2F9BF0', lasso: '#2F8CF0', toast: '#2C2C2E',
  },
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roobert', 'Inter', '"Inter Variable"', '"Noto Sans"', 'system-ui', 'sans-serif'],
        hand: ['"Goodnotes Hand"', 'Caveat', 'cursive'],
      },
      letterSpacing: { gn: '-0.02em', 'gn-tight': '-0.03em' },
      lineHeight: { gn: '1.2', 'gn-body': '1.32' },
      colors: {
        gn,
        tab: 'var(--tab)', bar: 'var(--bar)', canvas: 'var(--canvas)', pop: 'var(--pop)', card: 'var(--card)', ink: 'var(--ink)', sub: 'var(--sub)',
        hair: 'var(--hair)', accent: 'var(--accent)', chip: 'var(--chip)', float: 'var(--float)', danger: 'var(--danger)', good: 'var(--good)',
      },
      boxShadow: {
        page: '0 0 0 .5px rgba(15,16,16,.12), 0 1px 3px rgba(15,16,16,.12), 0 8px 24px rgba(15,16,16,.08)',
        pop: '0 0 0 .5px rgba(15,16,16,.08), 0 12px 40px -6px rgba(15,16,16,.28)',
        pill: 'var(--shadow-float)',
        /* floating toolbar depth measured from the reference: hairline + short contact + soft wide falloff */
        'gn-float': '0 0 0 .5px rgba(15,16,16,.08), 0 2px 6px rgba(15,16,16,.06), 0 10px 28px -6px rgba(15,16,16,.14)',
        'gn-float-dark': '0 0 0 .5px rgba(255,255,255,.10), 0 2px 6px rgba(0,0,0,.30), 0 12px 32px -6px rgba(0,0,0,.50)',
      },
    },
  },
  plugins: [],
}
