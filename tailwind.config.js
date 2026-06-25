/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FBF8F4',
        cream: '#F4EEE6',
        champagne: '#C8A96A',
        'champagne-dark': '#A8884B',
        charcoal: '#2B2B2B',
        rose: '#D9A6A0',
        'rose-soft': '#EBD3CF',
        sage: '#9CAE9C',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Playfair Display', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(43, 43, 43, 0.12)',
        card: '0 4px 24px -8px rgba(43, 43, 43, 0.10)',
        lift: '0 24px 60px -20px rgba(43, 43, 43, 0.22)',
        glow: '0 0 0 1px rgba(200, 169, 106, 0.25), 0 12px 40px -12px rgba(200, 169, 106, 0.35)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.2s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
