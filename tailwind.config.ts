import type { Config } from "tailwindcss";

// One source of truth for design tokens lives in app/globals.css.
// Tailwind only mirrors it so utilities stay in the same palette.
const config: Config = {
  content: [
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: "#0a0908",
        bone: "#e8e3d7",
        bruise: "#d94a86",
        "bruise-deep": "#a3195b",
      },
      fontFamily: {
        display: ["Ghost Grotesk", "Chinese Serif", "Arial Narrow", "sans-serif"],
        serif: ["Archive Serif", "Chinese Serif", "Palatino", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
