import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'scanner-bg': '#0A0B0A',
        'scanner-panel': '#000000',
        'scanner-text': '#D1D1D1',
        'scanner-glow': '#7FFFD4',
        // Neo-Brutalist palette
        'brutal': {
          'black': '#000000',
          'white': '#FFFFFF',
          'gray': '#1A1A1A',
          'cyan': '#00FFFF',
          'pink': '#FF1493',
          'lime': '#00FF00',
          'yellow': '#FFFF00',
          'orange': '#FF6600',
        },
      },
      fontFamily: {
        'mono': ['VT323', 'monospace'],
        'sans': ['Space Grotesk', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
        '6': '6px',
        '8': '8px',
        '12': '12px',
      },
      boxShadow: {
        'brutal': '6px 6px 0 0 #000000',
        'brutal-lg': '8px 8px 0 0 #000000',
        'brutal-xl': '12px 12px 0 0 #000000',
        'brutal-pink': '6px 6px 0 0 #FF1493',
        'brutal-cyan': '6px 6px 0 0 #00FFFF',
        'brutal-lime': '6px 6px 0 0 #00FF00',
      },
      rotate: {
        '1': '1deg',
        '2': '2deg',
        '3': '3deg',
      },
    },
  },
  plugins: [],
};
export default config;
