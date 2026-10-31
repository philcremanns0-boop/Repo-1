/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        gn: {
          // Goodnotes-style palette
          canvas: '#d9dadc', // neutral gray behind the page
          bar: '#f7f7f8', // flat toolbar surface
          line: '#e2e3e5', // hairline separators
          ink: '#2b2d31', // icon / text colour
          mute: '#8a8d93', // inactive icon
          active: '#e5effd', // selected tool pill background
          accent: '#2f6df6', // selected tool tint
          ruled: '#bcd3ee', // ruled line colour on paper
          grid: '#d3dfee',
        },
        pen: {
          black: '#1c1c1e',
          blue: '#1f6fe5',
          red: '#e5372e',
        },
      },
      boxShadow: {
        page: '0 1px 2px rgba(0,0,0,.10), 0 6px 24px rgba(0,0,0,.14)',
        bar: '0 1px 0 rgba(0,0,0,.04)',
      },
    },
  },
  plugins: [],
}
