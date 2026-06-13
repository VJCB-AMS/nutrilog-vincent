/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A1A',
        surface: '#0F0F1E',
        'surface-2': '#141428',
        card: '#13132A',
        border: '#1E1E3A',
        accent: {
          DEFAULT: '#7C3AED',
          secondary: '#06B6D4',
          hover: '#6D28D9',
          glow: 'rgba(124,58,237,0.25)',
        },
        protein: {
          DEFAULT: '#818CF8',
          glow: 'rgba(129,140,248,0.35)',
          bg: 'rgba(129,140,248,0.08)',
        },
        carbs: {
          DEFAULT: '#34D399',
          glow: 'rgba(52,211,153,0.35)',
          bg: 'rgba(52,211,153,0.08)',
        },
        fat: {
          DEFAULT: '#FB923C',
          glow: 'rgba(251,146,60,0.35)',
          bg: 'rgba(251,146,60,0.08)',
        },
        success: '#10B981',
        danger: '#EF4444',
        text: {
          primary: '#F0F0FF',
          secondary: '#6B6B8A',
          muted: '#35354A',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(124,58,237,0.3)',
        'glow-cyan': '0 0 24px rgba(6,182,212,0.25)',
        'glow-sm': '0 0 12px rgba(124,58,237,0.2)',
        'glow-protein': '0 0 16px rgba(129,140,248,0.4)',
        'glow-carbs': '0 0 16px rgba(52,211,153,0.4)',
        'glow-fat': '0 0 16px rgba(251,146,60,0.4)',
        card: '0 8px 40px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset',
        'card-hover': '0 12px 48px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.06) inset',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
        'gradient-accent-soft': 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.15) 100%)',
        'gradient-card': 'linear-gradient(145deg, #13132A 0%, #100F22 100%)',
        'gradient-protein': 'linear-gradient(135deg, rgba(129,140,248,0.14) 0%, rgba(129,140,248,0.03) 100%)',
        'gradient-carbs': 'linear-gradient(135deg, rgba(52,211,153,0.14) 0%, rgba(52,211,153,0.03) 100%)',
        'gradient-fat': 'linear-gradient(135deg, rgba(251,146,60,0.14) 0%, rgba(251,146,60,0.03) 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      animation: {
        'slide-in': 'slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-up': 'fadeUp 0.25s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'flame-glow': 'flameGlow 2.2s ease-in-out infinite',
        'ring-pulse': 'ringPulse 2.5s ease-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flameGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 3px #FB923C)', opacity: '0.85' },
          '50%': { filter: 'drop-shadow(0 0 10px #FB923C)', opacity: '1' },
        },
        ringPulse: {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '70%': { transform: 'scale(1.08)', opacity: '0' },
          '100%': { transform: 'scale(1.08)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
