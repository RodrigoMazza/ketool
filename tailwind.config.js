/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#F8F8F7',
        'surface-alt': '#FFFFFF',
        border: '#E2E2DF',
        ink: '#1A1A1A',
        'ink-muted': '#6B6B6B',
        accent: '#2563EB',
        'accent-hover': '#1D4ED8',
        danger: '#DC2626',
        'danger-hover': '#B91C1C',
        success: '#16A34A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
