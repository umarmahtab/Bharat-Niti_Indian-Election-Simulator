/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Inter', 'sans-serif'],
        devanagari: ['Tiro Devanagari Hindi', 'serif'],
      },
      colors: {
        // Dark backgrounds
        navy: {
          950: '#050810',
          900: '#0a0e1a',
          800: '#0f1528',
          700: '#141c35',
          600: '#1a2442',
        },
        // Glass surfaces
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          light: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.12)',
        },
        // Indian flag palette
        saffron: {
          DEFAULT: '#FF9933',
          light: '#FFB366',
          dark: '#E6821A',
          muted: 'rgba(255,153,51,0.2)',
        },
        india: {
          green: '#138808',
          white: '#FFFFFF',
          blue: '#000080',
          wheel: '#000080',
        },
        // UI accents
        accent: {
          blue: '#0070CC',
          purple: '#7B3FE4',
          gold: '#F4C430',
          emerald: '#10B981',
          red: '#EF4444',
          orange: '#F97316',
        },
        // Text
        text: {
          primary: '#F0F4FF',
          secondary: '#B0BAD0',
          muted: '#8892B0',
          dim: '#4A5568',
        },
        // Party colours (available for dynamic use)
        party: {
          bjp: '#FF9933',
          inc: '#19AAED',
          aap: '#00AEEF',
          tmc: '#45B6E8',
          sp: '#F11B1B',
          bsp: '#1A4BAA',
          cpm: '#CC0000',
          dmk: '#CC0000',
          aiadmk: '#1AA820',
          tdp: '#FFCC00',
          bjd: '#1B7B34',
          jdu: '#2FB62A',
          ncp: '#FFFFFF',
          rjd: '#00AF40',
          nc: '#285295',
          custom: '#7B3FE4',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        'india-gradient': 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)',
        'saffron-glow': 'radial-gradient(ellipse at center, rgba(255,153,51,0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        'glass': '0 4px 24px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-hover': '0 8px 32px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
        'saffron': '0 0 20px rgba(255,153,51,0.4)',
        'saffron-lg': '0 0 40px rgba(255,153,51,0.3)',
        'blue-glow': '0 0 20px rgba(0,112,204,0.4)',
        'party': '0 4px 20px rgba(0,0,0,0.5)',
        'inset-glass': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'counter': 'counter 0.8s ease-out forwards',
        'map-ping': 'mapPing 2s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideLeft: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,153,51,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255,153,51,0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        mapPing: {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
