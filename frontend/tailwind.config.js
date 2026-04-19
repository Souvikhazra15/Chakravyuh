export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
      },
      spacing: {
        '128': '32rem',
      },
      fontSize: {
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      boxShadow: {
        'lg': '0 10px 30px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 40px rgba(0, 0, 0, 0.15)',
      },
      zIndex: {
        'max': '9999',
      },
    },
  },
  plugins: [],
};
