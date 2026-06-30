import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
        accent: '#E8B84B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
} satisfies Config;
