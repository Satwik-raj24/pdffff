/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0d0e12',
        surface: {
          DEFAULT: '#14161d',
          hover: '#1b1e27',
          active: '#212530',
          border: '#272b38',
          subtle: '#181b24',
        },
        accent: {
          DEFAULT: '#10b981', // Refined Emerald
          hover: '#059669',
          light: '#34d399',
          muted: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.25)',
        },
        text: {
          primary: '#f3f4f6',
          secondary: '#9ca3af',
          muted: '#6b7280',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
        'elevated': '0 8px 24px -4px rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}

