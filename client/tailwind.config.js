/** @type {import('tailwindcss').Config} */

// Deep forest green for the chrome and primary actions, on a warm off-white
// page rather than stark white.
//
// The app also uses green for "verified" and "resolved", so the two are kept
// apart by weight, not hue: the brand green is dark and solid, while a status
// is a pale pill that always carries its word. Relying on more than colour is
// what WCAG asks for anyway.
//
// Saffron is the accent, and only at shade 700 when it carries text, because
// lighter saffron does not meet the contrast GIGW asks for.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f7f3',
          100: '#dcebe2',
          200: '#bbd8c7',
          300: '#8dbda2',
          400: '#589a79',
          500: '#2f7a59',
          600: '#1b5e40', // 7.72:1 on white, and white on it - AAA both ways
          700: '#14532d',
          800: '#0f3f23', // sidebar and header chrome - 11.96:1 with white text
          900: '#0a2b18',
        },
        surface: {
          DEFAULT: '#faf9f7', // warm off-white, easier on the eye than pure white
          raised: '#ffffff',
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
