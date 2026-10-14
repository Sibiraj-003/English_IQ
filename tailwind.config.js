/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        dark: '#0F172A',
        lavender: '#C4B5FD',
        mint: '#A7F3D0',
        amber: '#FDE68A',
        sky: '#BAE6FD',
        pink: '#FBCFE8',
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #0F172A',
        'brutal': '3px 3px 0px #0F172A',
        'brutal-lg': '5px 5px 0px #0F172A',
        'brutal-xl': '7px 7px 0px #0F172A',
        'brutal-active': '1px 1px 0px #0F172A',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
