/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        church: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#1d4ed8',
          600: '#1e40af',
          700: '#1e3a8a',
          800: '#172554',
          900: '#0f172a',
        },
        group1: {
          DEFAULT: '#2563eb',
          light: '#eff6ff',
          border: '#93c5fd',
          text: '#1e40af'
        },
        group2: {
          DEFAULT: '#7c3aed',
          light: '#f5f3ff',
          border: '#c4b5fd',
          text: '#5b21b6'
        }
      }
    },
  },
  plugins: [],
}
