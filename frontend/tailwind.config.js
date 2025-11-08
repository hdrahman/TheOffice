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
        'custom-gradient': 'linear-gradient(135deg, #F7F5F1 0%, #FFFFFF 100%)',
      },
      colors: {
        // Warm Coast Palette
        background: '#F7F5F1',
        surface: '#FFFFFF',
        border: '#E8E2D9',

        primary: {
          DEFAULT: '#2457B2',
          hover: '#2F6BD9',
          focus: '#BFD3FF',
          tint: '#EDF3FF',
        },

        brown: {
          DEFAULT: '#8B5E3C',
          tint: '#EAD9CA',
        },

        green: {
          DEFAULT: '#3C8C6E',
          tint: '#E7F3EE',
        },

        danger: '#C0392B',
        warning: '#F59E0B',
        info: '#2563EB',

        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
        }
      }
    },
  },
  plugins: [],
};