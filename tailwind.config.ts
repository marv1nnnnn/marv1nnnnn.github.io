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
        // Legacy colors - mapped to new brutal palette where appropriate
        'scanner-bg': '#0A0B0A',
        'scanner-panel': '#000000',
        'scanner-text': '#D1D1D1',
        'scanner-glow': '#00FFFF', // Updated to Cyan
        
        // Neo-Brutalist Palette
        'brutal': {
          'black': '#000000',
          'white': '#FFFFFF',
          'off-white': '#F0F0F0',
          'gray': '#1A1A1A',
          'dark-gray': '#111111',
          'cyan': '#00FFFF',
          'pink': '#FF1493',
          'lime': '#CCFF00', // Acid Lime
          'yellow': '#FFFF00',
          'orange': '#FF6600',
        },
        // Vinyl crate colors
        'crate-wood': '#3E2723',
        'crate-wood-light': '#5D4037',
        'vinyl-black': '#0A0A0A',
        'sticker-pink': '#FF1493',
        'sticker-yellow': '#FFFF00',
      },
      fontFamily: {
        'mono': ['VT323', 'monospace'],
        'sans': ['Space Grotesk', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '5': '5px',
        '6': '6px',
        '8': '8px',
        '12': '12px',
      },
      boxShadow: {
        'brutal': '6px 6px 0 0 #000000',
        'brutal-hover': '8px 8px 0 0 #000000',
        'brutal-lg': '8px 8px 0 0 #000000',
        'brutal-xl': '12px 12px 0 0 #000000',
        'brutal-pink': '6px 6px 0 0 #FF1493',
        'brutal-cyan': '6px 6px 0 0 #00FFFF',
        'brutal-lime': '6px 6px 0 0 #CCFF00',
        'brutal-record': '8px 8px 0 0 #000000',
        'brutal-crate': 'inset 0 8px 16px rgba(0,0,0,0.5), 12px 12px 0 #000',
      },
      dropShadow: {
        'brutal': '2px 2px 0 #000000',
        'brutal-text': '2px 2px 0px rgba(0,0,0,0.5)',
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
