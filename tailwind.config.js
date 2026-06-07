/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6EFE2',
        panel: '#FCF8F0',
        card: '#FFFDF8',
        ink: '#221E18',
        muted: '#8C8473',
        line: '#E4D9C4',
        tomato: '#C4452B',
        'tomato-soft': '#E27A5E',
        herb: '#4C6240',
        'herb-soft': '#7B9466',
        saffron: '#E0A02E',
        plum: '#6B3A52',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(34,30,24,0.04), 0 8px 24px -12px rgba(34,30,24,0.18)',
        lift: '0 2px 4px rgba(34,30,24,0.06), 0 18px 40px -18px rgba(34,30,24,0.28)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
