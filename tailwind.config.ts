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
      },
      fontFamily: {
        'mono': ['VT323', 'monospace'],
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
      },
    },
  },
  plugins: [],
};
export default config;
