/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'oklch(0.56 0.20 262)',
          hover:   'oklch(0.50 0.20 262)',
          light:   'oklch(0.92 0.06 262)',
          muted:   'oklch(0.75 0.12 262)',
        },
        surface: {
          DEFAULT: 'oklch(0.99 0 0)',
          2:       'oklch(0.96 0.004 262)',
          3:       'oklch(0.92 0.006 262)',
        },
        sidebar: {
          DEFAULT: 'oklch(0.14 0.025 262)',
          hover:   'oklch(0.20 0.025 262)',
          active:  'oklch(0.56 0.20 262)',
          text:    'oklch(0.75 0.02 262)',
          'text-active': 'oklch(0.99 0 0)',
        },
        border: {
          DEFAULT: 'oklch(0.88 0.006 262)',
          strong:  'oklch(0.78 0.010 262)',
        },
        content: {
          DEFAULT: 'oklch(0.18 0.01 262)',
          2:       'oklch(0.42 0.01 262)',
          3:       'oklch(0.62 0.01 262)',
          inverse: 'oklch(0.99 0 0)',
        },
        success: {
          DEFAULT: 'oklch(0.60 0.18 145)',
          light:   'oklch(0.94 0.06 145)',
          text:    'oklch(0.38 0.14 145)',
        },
        warning: {
          DEFAULT: 'oklch(0.72 0.18 75)',
          light:   'oklch(0.96 0.06 75)',
          text:    'oklch(0.46 0.16 75)',
        },
        danger: {
          DEFAULT: 'oklch(0.55 0.22 27)',
          light:   'oklch(0.94 0.07 27)',
          text:    'oklch(0.40 0.18 27)',
        },
        info: {
          DEFAULT: 'oklch(0.58 0.18 230)',
          light:   'oklch(0.94 0.06 230)',
          text:    'oklch(0.38 0.15 230)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs:  '4px',
        sm:  '6px',
        md:  '10px',
        lg:  '14px',
        xl:  '20px',
        '2xl': '28px',
      },
      boxShadow: {
        card:   '0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px oklch(0 0 0 / 0.10), 0 2px 4px oklch(0 0 0 / 0.06)',
        modal:  '0 20px 60px oklch(0 0 0 / 0.20), 0 8px 20px oklch(0 0 0 / 0.12)',
        sm:     '0 1px 2px oklch(0 0 0 / 0.08)',
        toast:  '0 8px 24px oklch(0 0 0 / 0.14)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.2s ease-out',
        'slide-in-left': 'slide-in-left 0.25s ease-out',
        'slide-up':      'slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'toast-in':      'toast-in 0.25s ease-out',
        'spin-slow':     'spin-slow 1s linear infinite',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}
