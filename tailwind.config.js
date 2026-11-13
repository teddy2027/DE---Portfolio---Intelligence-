/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      // APPROXIMATE palette for the prototype. Not official DualEntry brand values.
      colors: {
        canvas: '#F6F7F7',
        surface: '#FFFFFF',
        line: '#E3E6E8',
        'line-strong': '#CDD2D6',
        ink: '#15191E',
        'ink-2': '#36404B',
        muted: '#5B6673',
        subtle: '#8A949F',
        teal: {
          950: '#072726', 900: '#0A3433', 800: '#0D4544', 700: '#0F5A57', 600: '#12706B',
          500: '#178A83', 200: '#BFE0DC', 100: '#E3F1EF', 50: '#F1F8F7',
        },
        positive: { DEFAULT: '#1D7A4E', bg: '#E8F4EC', line: '#BFDFCB' },
        warning: { DEFAULT: '#8F5400', bg: '#FDF3E1', line: '#F0D59F' },
        danger: { DEFAULT: '#B1342C', bg: '#FBEAE8', line: '#F0C4BF' },
        info: { DEFAULT: '#2D5A87', bg: '#EAF1F8', line: '#C5D7EA' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,32,0.04), 0 1px 1px rgba(16,24,32,0.02)',
        pop: '0 12px 32px -8px rgba(16,24,32,0.18), 0 2px 6px rgba(16,24,32,0.06)',
      },
      fontSize: { '2xs': ['11px', '16px'] },
    },
  },
  plugins: [],
};
