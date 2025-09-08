/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        sky: {
          light: '#a6e1ff',
          DEFAULT: '#7dd3fc'
        },
        lemon: '#fff59e',
        mint: '#b9fbc0',
        pinky: '#ffcad4'
      },
      borderRadius: {
        bubble: '1.25rem'
      },
      fontFamily: {
        playful: ['"Fredoka"', '"Baloo 2"', '"Comic Neue"', 'cursive']
      },
      animation: {
        wiggle: 'wiggle 0.3s ease-in-out',
        bouncex: 'bouncex 0.6s ease-in-out'
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg) scale(1.02)' },
          '50%': { transform: 'rotate(1deg) scale(1.06)' }
        },
        bouncex: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(4px)' }
        }
      }
    }
  },
  plugins: []
}


