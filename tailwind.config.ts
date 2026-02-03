import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ocean-surface': 'var(--ocean-surface)',
        'ocean-shallow': 'var(--ocean-shallow)',
        'ocean-medium': 'var(--ocean-medium)',
        'ocean-deep': 'var(--ocean-deep)',
        'ocean-abyss': 'var(--ocean-abyss)',
        'ocean-glow': 'var(--ocean-glow)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'bubble': 'bubble-rise 8s ease-in-out infinite',
        'light-ray': 'light-ray 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        'bubble-rise': {
          '0%': { transform: 'translateY(100vh) scale(0)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-10vh) scale(1)', opacity: '0' },
        },
        'light-ray': {
          '0%, 100%': { opacity: '0.3', transform: 'translateY(0) scaleY(1)' },
          '50%': { opacity: '0.5', transform: 'translateY(-20px) scaleY(1.1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
