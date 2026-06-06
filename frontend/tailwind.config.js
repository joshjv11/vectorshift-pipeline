/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark theme tokens
        canvas:   '#09090b',
        surface:  '#0a0a0f',
        ink:      '#e2e2e8',
        muted:    '#8b8fa8',
        hairline: '#2a2d33',
        accent:   '#818cf8',
        valid:    '#34d399',
        cycle:    '#f87171',
        // Node bg
        node:     '#0a0a0f',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
      },
      fontFamily: {
        sans:  ['Hanken Grotesk', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        eyebrow: '0.05em',
        widest2: '0.08em',
      },
    },
  },
  plugins: [],
};
