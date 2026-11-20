/** @type {import('tailwindcss').Config} */

// Premium Beige & Earthy Brown Design System for GramSetu GovTech Platform.
// Palette reflects public infrastructure, civil roads, and trustworthy governance.
// - Canvas: Warm Beige (#F9F6F0) with soft neutral raised cards (#FFFFFF).
// - Primary: Dark Earthy Brown (#2E221A / #423429) for header, sidebar, and primary actions.
// - Secondary: Muted Brown (#7A6657) for secondary actions and subtle elements.
// - Accent: Restrained Warm Amber / Ochre (#C27803 / #854D0E) for active states.
// - Text: Deep charcoal-brown (#1F1611) meeting strict WCAG 2.1 AA/AAA contrast.

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F8F6F2',
          100: '#EBE5DC',
          200: '#D8CFC3',
          300: '#C2B4A3',
          400: '#A49280',
          500: '#7E6B5A', // muted earthy brown
          600: '#5C4C3E', // accessible brown text & icons (7.8:1)
          700: '#44372C', // deep brown
          800: '#2E231B', // primary dark brown chrome (sidebar, navbar)
          900: '#1D1611', // deepest charcoal brown
        },
        surface: {
          DEFAULT: '#F8F5F0', // warm natural beige canvas
          raised: '#FFFFFF',  // clean white elevated cards
          subtle: '#F1ECE3',  // warm neutral card background
          border: '#E4DDD2',  // soft warm divider border
        },
        accent: {
          50: '#FDFCF9',
          100: '#FDF7EC',
          200: '#F9EBCF',
          500: '#C27803', // restrained warm amber
          600: '#A16207',
          700: '#854D0E', // accessible amber text (5.8:1)
        },
        gov: {
          success: '#15803D',
          warning: '#B45309',
          danger: '#B91C1C',
          info: '#475569',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
