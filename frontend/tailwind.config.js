/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#FF6584',
        accent: '#FFB347',
        background: '#F8F9FE',
        surface: '#FFFFFF',
        success: '#2ED47A',
        warning: '#FFB347',
        error: '#FF6B6B',
        info: '#4A90D9',
        dark: '#2D3436',
        muted: '#6B7280',
        'dark-bg': '#0f172a',
        'dark-surface': '#1e293b',
        'dark-border': '#334155',
        'dark-text': '#e2e8f0',
        'dark-muted': '#94a3b8',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ["'Inter'", "'Segoe UI'", "system-ui", "sans-serif"],
        display: ["'Poppins'", "'Inter'", "sans-serif"],
      },
      boxShadow: {
        soft: '0 2px 16px rgba(108, 99, 255, 0.08)',
        card: '0 4px 24px rgba(108, 99, 255, 0.06)',
        elevated: '0 8px 32px rgba(108, 99, 255, 0.1)',
        button: '0 2px 8px rgba(108, 99, 255, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    }
  },
  plugins: []
}
