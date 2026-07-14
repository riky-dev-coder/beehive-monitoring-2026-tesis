/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beehive: {
          50: '#fffbf0',
          100: '#fef3e0',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan-line 1.5s ease-in-out',
        'shimmer': 'shimmer 2s infinite',
        'data-pulse': 'data-pulse 2s ease-in-out infinite',
        'glow-border': 'glow-border 1s ease-out',
      },
      keyframes: {
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'data-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'glow-border': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' },
        },
      },
    },
  },
  plugins: [],
}
