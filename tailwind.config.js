/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          600: '#667eea',
          700: '#5a67d8',
          800: '#764ba2',
        },
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'fadeIn': 'fadeIn 0.6s ease-out',
        'fadeInUp': 'fadeInUp 0.6s ease-out 0.2s both',
        'fadeInDown': 'fadeInDown 0.6s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'bounceIn': 'bounceIn 0.5s',
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        fadeInUp: {
          'from': { 
            opacity: '0',
            transform: 'translateY(30px)',
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInDown: {
          'from': { 
            opacity: '0',
            transform: 'translateY(-30px)',
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideUp: {
          'from': { 
            opacity: '0',
            transform: 'translate(-50%, -40%)',
          },
          'to': { 
            opacity: '1',
            transform: 'translate(-50%, -50%)',
          },
        },
        bounceIn: {
          'from': { 
            opacity: '0',
            transform: 'scale(0.3)',
          },
          'to': { 
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
}