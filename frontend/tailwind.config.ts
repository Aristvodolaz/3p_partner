import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Тёплая нейтральная шкала вместо стандартного холодного Tailwind gray —
        // переопределяет `gray` целиком, поэтому каскадно применяется ко всем
        // существующим text-gray-*/bg-gray-*/border-gray-* по всему приложению.
        gray: {
          50: '#FAF9F6',
          100: '#F2F0E9',
          200: '#E4E0D4',
          300: '#CFC9B8',
          400: '#A39B87',
          500: '#78715F',
          600: '#5A5443',
          700: '#413C2E',
          800: '#2A2620',
          900: '#1B1815',
        },
        primary: {
          DEFAULT: '#1B4F8A',
          50: '#E8F0FA',
          100: '#C5D8F2',
          200: '#9FBDE9',
          300: '#79A2E0',
          400: '#5388D7',
          500: '#1B4F8A',
          600: '#163F6E',
          700: '#112F52',
          800: '#0C2037',
          900: '#07101B',
        },
        accent: {
          DEFAULT: '#C99A3B',
          50: '#FBF3E1',
          100: '#F5E2B8',
          400: '#DBAE4E',
          500: '#C99A3B',
          600: '#A87C28',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,24,21,0.04), 0 8px 24px -12px rgba(27,24,21,0.12)',
        panel: '0 2px 8px rgba(27,24,21,0.06), 0 24px 48px -16px rgba(27,24,21,0.22)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [forms],
} satisfies Config;
