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
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#dae3fc',
          300: '#bdcdfa',
          400: '#94acf5',
          500: '#6382f0',
          600: '#3b5ce8',
          700: '#2544d6',
          800: '#1b32b3',
          900: '#15258f',
          950: '#0d165c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
