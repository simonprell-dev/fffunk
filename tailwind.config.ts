import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
          active: '#991b1b',
        },
        surface: '#1a1a1a',
        surface2: '#262626',
        border: '#333333',
        text: '#e5e5e5',
        muted: '#a3a3a3',
      },
      fontFamily: {
        radio: ['"Courier New"', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
