/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
       'custom-dark': '#45444b',
       'custom-light': '#afafaf',
      },
    },
  },
  plugins: [],
}

