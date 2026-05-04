import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        pitch: {
          950: "#0a0f0a",
          900: "#0f1a14",
          800: "#162420",
          700: "#1f3329",
        },
        grass: {
          400: "#7fc97f",
          500: "#4eaf4e",
          600: "#2e8b2e",
        },
        flame: {
          400: "#ff9f4a",
          500: "#ff7a1f",
          600: "#e85d00",
        },
        chalk: {
          50: "#fafaf7",
          100: "#f0efe8",
          200: "#d8d6c8",
          400: "#9c9a8c",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,122,31,0.4), 0 8px 32px -8px rgba(255,122,31,0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
