/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FDE047',
        primaryDark: '#EAB308',
        secondary: '#F97316',
        accent: '#84CC16',
        cream: '#FEFCE8',
        softGray: '#F3F4F6',
      }
    }
  },
  plugins: [],
}
