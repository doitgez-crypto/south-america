/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf4e7',
          100: '#fbe5c3',
          200: '#f7cc87',
          300: '#f2ae4a',
          400: '#ed9620',
          500: '#d97c0a',
          600: '#b66007',
          700: '#8e460a',
          800: '#723810',
          900: '#5e2f11',
        },
        earth: {
          50:  '#f5f0eb',
          100: '#e8ddd0',
          200: '#d4bfa5',
          300: '#b99670',
          400: '#a47a50',
          500: '#8b6340',
          600: '#724f33',
          700: '#5a3d28',
          800: '#472f1f',
          900: '#3a2518',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
