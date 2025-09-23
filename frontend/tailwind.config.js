/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFB347', // playful orange
        secondary: '#6EC6FF', // sky blue
        accent: '#FF6F91', // pink
        background: '#FFF8E7', // soft cream
        surface: '#FFFFFF',
        success: '#7ED957',
        warning: '#FFD966',
        error: '#FF6F61',
        info: '#6EC6FF',
        dark: '#3A3A3A',
      },
      borderRadius: {
        cartoon: '1.5rem',
        xl: '1.25rem',
      },
      fontFamily: {
        cartoon: ["'Comic Neue'", "'Quicksand'", "'Baloo'", "cursive", "sans-serif"],
      },
      animation: {
        wiggle: 'wiggle 0.3s ease-in-out',
        bouncex: 'bouncex 0.6s ease-in-out',
        'bounce-slow': 'bounceslow 3s infinite',
        'bounce-short': 'bounceshort 1.4s infinite',
        'spin-slow': 'spinslow 5s linear infinite',
        pop: 'pop 0.4s ease'
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg) scale(1.02)' },
          '50%': { transform: 'rotate(1deg) scale(1.06)' }
        },
        bouncex: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(4px)' }
        },
        bounceslow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        bounceshort: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        spinslow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '60%': { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)' }
        }
  },
      boxShadow: {
        cartoon: '0 4px 16px 0 rgba(255,179,71,0.15)',
        fun: '0 2px 8px 0 rgba(110,198,255,0.15)',
      },
    }
  },
  plugins: []
}


