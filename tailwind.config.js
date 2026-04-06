/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0d0d0f',
          800: '#141418',
          700: '#1a1a20',
          600: '#22222a',
          500: '#2a2a35',
          400: '#3a3a48',
        },
        up: '#26a69a',
        down: '#ef5350',
        gold: '#f0b90b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
};
