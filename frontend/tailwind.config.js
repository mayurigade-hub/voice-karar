module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'stamp-press': {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '30%': { transform: 'scale(0.95) rotate(-2deg)' },
          '60%': { transform: 'scale(1.04) rotate(1deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' }
        },
        'seal-pulse': {
          '0%': { opacity: '0.6', transform: 'scale(0.9)' },
          '50%': { opacity: '0.12', transform: 'scale(1.6)' },
          '100%': { opacity: '0', transform: 'scale(2.2)' }
        },
        'wave-bar': {
          '0%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(0.6)' },
          '100%': { transform: 'scaleY(1)' }
        }
      },
      animation: {
        'stamp-press': 'stamp-press 420ms ease',
        'seal-pulse': 'seal-pulse 1400ms ease infinite',
        'wave-bar': 'wave-bar 800ms ease-in-out infinite'
      }
    }
  },
  plugins: []
}
