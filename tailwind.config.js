/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        accent:  '#F2411B',
        ink:     '#0d0d0d',
        paper:   '#f9f8f6',
        muted:   'rgba(13,13,13,0.45)',
        rule:    'rgba(0,0,0,0.1)',
      },
      fontFamily: {
        ahg:  ['"Alte Haas Grotesk Bold"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'hero':    ['clamp(40px,5vw,96px)', { lineHeight: '0.82' }],
        'headline':['clamp(32px,3vw,56px)',  { lineHeight: '1.05' }],
        'section': ['clamp(24px,2vw,32px)',  { lineHeight: '1.1'  }],
        'nav':     ['24px',                  { lineHeight: '1.2'  }],
        'body':    ['14px',                  { lineHeight: '1.7'  }],
        'label':   ['11px',                  { lineHeight: '1.6'  }],
        'eyebrow': ['11px',                  { lineHeight: '1.4'  }],
      },
      spacing: {
        'gutter': '72px',
        'sidebar': '400px',
      },
    },
  },
  plugins: [],
}
