import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e8f8f0',
          100: '#c9efdd',
          200: '#96e0bd',
          300: '#5fcd9a',
          400: '#2fb87c',
          500: '#12a065',
          600: '#0b8253',
          700: '#0a6743',
          800: '#0a5135',
          900: '#08402b',
        },
        accent: {
          400: '#ffcf4d',
          500: '#f7b500',
          600: '#d99b00',
        },
        ink: {
          500: '#6b7280',
          700: '#374151',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.1)',
        lift: '0 10px 30px -12px rgba(16,24,40,0.25)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
