/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        brand: ['Montserrat', 'sans-serif'],
        timer: ['Montserrat', 'sans-serif'],
        capture: ['Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
