/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        solar: {
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#E8622C', // Signature Solar Orange
          600: '#ea580c',
          700: '#c2410c',
        },
        graphite: '#141311', // Signature mountain graphite
        cream: '#FAFAF8',   // Editorial light background
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
}
