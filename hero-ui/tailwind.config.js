/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'arena-dark': '#0a0a0a',
        'arena-glow': '#ff0055',
        'arena-blue': '#00d9ff',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'shake-hard': 'shakeHard 0.6s cubic-bezier(.36,.07,.19,.97) both',
        'breathe': 'breathe 4s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        shakeHard: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px) rotate(-2deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px) rotate(2deg)' },
        },
        breathe: {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(1.03)',
            opacity: '0.95'
          },
        },
        glowPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2)'
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3)'
          },
        }
      },
      backgroundImage: {
        'arena-gradient': 'linear-gradient(to bottom, #1a0a2e, #0a0a0a)',
        'fire-gradient': 'linear-gradient(45deg, #ff0000, #ff6600, #ffff00)',
        'ice-gradient': 'linear-gradient(45deg, #00d9ff, #0099ff, #0066ff)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
