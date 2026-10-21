import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        grafite: {
          DEFAULT: '#2d2d2d',
          light: '#4a4a4a',
          dark: '#1a1a1a',
        },
        preto: {
          DEFAULT: '#000000',
        },
        branco: {
          DEFAULT: '#ffffff',
        },
        verde: {
          DEFAULT: '#2e7d4f',
          light: '#4caf6b',
          dark: '#1b5e3a',
        },
        brand: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        'verde-discreto': {
          DEFAULT: '#2e7d4f',
          light: '#4caf6b',
          dark: '#1b5e3a',
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          disabled: 'var(--text-disabled)',
        },
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-disabled': 'var(--text-disabled)',
        border: {
          color: 'var(--border-color)',
        },
        erro: 'var(--color-erro)',
        aviso: 'var(--color-aviso)',
        sucesso: 'var(--color-sucesso)',
        informacao: 'var(--color-informacao)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
};

export default config;