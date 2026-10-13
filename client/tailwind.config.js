/** @type {import('tailwindcss').Config} */

// Navy carries the brand, the way most Indian government service portals do.
// Green is deliberately left out of the brand scale: this app already uses
// green to mean verified or resolved, and a green button would blur that.
// Saffron appears only as an accent, and only at shade 700 when it carries
// text, because lighter saffron does not meet the contrast GIGW asks for.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f6fb',
          100: '#e3ecf7',
          200: '#c2d5ec',
          300: '#93b4db',
          400: '#5c8bc6',
          500: '#336aae',
          600: '#1b4f91', // 8.16:1 on white, and white on it - AAA both ways
          700: '#123a6b',
          800: '#0d2d50',
          900: '#0a2038',
        },
        accent: {
          50: '#fff8ed',
          100: '#ffecd1',
          200: '#fed7aa',
          500: '#e07b00',
          600: '#c26400', // large text and UI only - 4.10:1
          700: '#9a4f00', // 6.01:1, safe for ordinary text
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
