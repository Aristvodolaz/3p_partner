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
        // Фирменный красный Комус вместо прежнего синего — тот же ramp-паттерн
        // (50 светлее фона карточек → 900 почти чёрный), чтобы все производные
        // классы (bg-primary-50, hover:bg-primary-600, ring-primary-400 и т.д.)
        // продолжили работать без изменений в компонентах.
        primary: {
          DEFAULT: '#D40F1E',
          50: '#FDECED',
          100: '#FBD0D2',
          200: '#F5A3A8',
          300: '#EE757D',
          400: '#E84852',
          500: '#D40F1E',
          600: '#AC0C18',
          700: '#830912',
          800: '#5B060C',
          900: '#330306',
        },
        accent: {
          DEFAULT: '#1B1815',
          50: '#F2F0E9',
          100: '#E4E0D4',
          400: '#5A5443',
          500: '#2A2620',
          600: '#1B1815',
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
        // Финальный кадр — 'transform: none', а не 'translateY(0)': с
        // animation-fill-mode: both (см. ниже) элемент навсегда остаётся с
        // вычисленным transform последнего кадра, а ЛЮБОЙ transform кроме
        // none — даже единичная матрица — создаёт новый containing block
        // для потомков с position:fixed. main оборачивает каждую страницу
        // этой анимацией, из-за чего все модалки (position:fixed внутри
        // main) центрировались не по вьюпорту, а по границам main.
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'none' },
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
