/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roobert', '"Inter Variable"', '"Noto Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        hand: ['"Goodnotes Hand"', 'Caveat', 'cursive'],
      },
      colors: {
        tab: 'var(--tab)',
        bar: 'var(--bar)',
        canvas: 'var(--canvas)',
        pop: 'var(--pop)',
        card: 'var(--card)',
        ink: 'var(--ink)',
        sub: 'var(--sub)',
        hair: 'var(--hair)',
        accent: 'var(--accent)',
        chip: 'var(--chip)',
        float: 'var(--float)',
        danger: 'var(--danger)',
        good: 'var(--good)',
        gn: {
          navy: 'var(--gn-navy)', 'navy-deep': 'var(--gn-navy-deep)', teal: 'var(--gn-teal-1)', 'teal-2': 'var(--gn-teal-2)', 'teal-3': 'var(--gn-teal-3)',
          ink: 'var(--gn-ink)', eraser: 'var(--gn-eraser)', matcha: 'var(--gn-matcha)', sky: 'var(--gn-sky)', lavender: 'var(--gn-lavender)', candy: 'var(--gn-candy)', blue: 'var(--gn-blue)',
        },
      },
      boxShadow: {
        page: '0 0 0 .5px rgba(0,0,0,.12), 0 1px 3px rgba(0,0,0,.14), 0 8px 24px rgba(0,0,0,.10)',
        pop: '0 10px 40px rgba(0,0,0,.28), 0 0 0 .5px rgba(0,0,0,.08)',
        pill: 'var(--shadow-float)',
      },
    },
  },
  plugins: [],
}
