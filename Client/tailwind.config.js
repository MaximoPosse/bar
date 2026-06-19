/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        caliz: {
          red: '#5E2129',
          green: '#7FA099',
          cream: '#F2EBE1',
          bronze: '#8B6B3D',
          dark: '#2A1215',
          brown: '#3C1F1F',
        }
      },
      fontFamily: {
        cinzel: ['Cinzel', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
