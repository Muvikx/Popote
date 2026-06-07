/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F7F4', // page background — soft off-white
        panel: '#F1F3EE', // inputs / subtle fills
        card: '#FFFFFF',
        ink: '#14181A',
        muted: '#727D74',
        line: '#E7E9E3',
        tomato: '#FF5A3C',
        'tomato-soft': '#FF8A73',
        herb: '#17A66B',
        'herb-soft': '#5CC79B',
        saffron: '#E8A33D',
        plum: '#4F63D6', // indigo accent (dishes / manual)
      },
      fontFamily: {
        display: ['"Cabinet Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"General Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,24,26,0.04), 0 10px 30px -16px rgba(20,24,26,0.16)',
        lift: '0 2px 6px rgba(20,24,26,0.06), 0 26px 50px -24px rgba(20,24,26,0.30)',
      },
      borderRadius: {
        xl2: '1.4rem',
      },
    },
  },
  plugins: [],
}
