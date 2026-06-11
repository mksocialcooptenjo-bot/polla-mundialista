/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mundialBg: '#0f172a', 
        mundialCard: '#1e293b', 
        mundialVerde: '#10b981', 
        mundialOro: '#f59e0b', 
      }
    },
  },
  plugins: [],
}