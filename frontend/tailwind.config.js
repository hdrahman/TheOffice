/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'uniform': ['MagnumSans', 'sans-serif'],
      },
      backgroundImage: {
        'custom-gradient': 'linear-gradient(to top right, #614879, rgb(55, 19, 80))',
      }
    },
  },
  plugins: [],
};