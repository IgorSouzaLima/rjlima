/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./rastreio/**/*.html",
    "./admin/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
}
