/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Founders Grotesk"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
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
      },
      boxShadow: {
        page: '0 0 0 .5px rgba(0,0,0,.12), 0 1px 3px rgba(0,0,0,.14), 0 8px 24px rgba(0,0,0,.10)',
        pop: '0 10px 40px rgba(0,0,0,.28), 0 0 0 .5px rgba(0,0,0,.08)',
        pill: '0 2px 10px rgba(0,0,0,.14), 0 0 0 .5px rgba(0,0,0,.14)',
      },
    },
  },
  plugins: [],
}
