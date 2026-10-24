/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#071810',
          900: '#0c2419',
          800: '#143828',
          700: '#1b4d37',
          600: '#266c4d',
          500: '#348d65',
        },
        charcoal: {
          950: '#0b0c0e',
          900: '#121417',
          800: '#1b1e22',
          700: '#282d33',
          600: '#3c434c',
          500: '#5a636f',
        },
        turf: {
          DEFAULT: '#10b981',
          hover: '#059669',
          light: '#ecfdf5',
          lime: '#84cc16',
          bright: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(12, 36, 25, 0.08)',
        elevated: '0 12px 32px -4px rgba(12, 36, 25, 0.12)',
      },
    },
  },
  plugins: [],
};
