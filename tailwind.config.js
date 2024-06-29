/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        normal: '#F5F7FB',
        secondary: '#F5F7FB',
        primary : '#6243EA', 
      }
    },
    fontFamily: {
      'sans': ['Roboto'],

    }
  },
  plugins: [],
}

