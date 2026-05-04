import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"], // Archivo Black — brutal
        sport: ["var(--font-sport)", "sans-serif"],     // Bebas Neue — sport condensed
        body: ["var(--font-body)", "sans-serif"],       // Manrope
        mono: ["var(--font-mono)", "monospace"],        // Space Mono — retro
      },
      colors: {
        // Fondo base: tinta verdosa profunda, ligeramente cálida
        pitch: {
          950: "#0a0e0c",
          900: "#111814",
          800: "#1b231e",
          700: "#2a3530",
        },
        // Verde césped vivo
        grass: {
          300: "#9adfa0",
          400: "#5fc07a",
          500: "#34a259",
          600: "#1f7d3f",
          700: "#155a2c",
        },
        // Mostaza dorado — accent primario (mantenemos el nombre `flame` por compat)
        flame: {
          300: "#ffe06a",
          400: "#ffc83d",
          500: "#f5b400",
          600: "#cc9300",
        },
        // Terracota / ladrillo — accent secundario
        brick: {
          400: "#ed6f4a",
          500: "#c84a26",
          600: "#9c3517",
        },
        // Papel crema (cromos Panini)
        paper: {
          50: "#fbf3dc",
          100: "#f3e6c2",
          200: "#e7d099",
        },
        // Texto
        chalk: {
          50: "#fbf6e7",
          100: "#f1ebd5",
          200: "#dcd5b6",
          400: "#9b9479",
        },
      },
      boxShadow: {
        brutal: "5px 5px 0 0 rgba(0,0,0,0.95)",
        "brutal-lg": "8px 8px 0 0 rgba(0,0,0,0.95)",
        "brutal-sm": "3px 3px 0 0 rgba(0,0,0,0.95)",
        "brutal-mustard": "5px 5px 0 0 #f5b400",
        "brutal-brick": "5px 5px 0 0 #c84a26",
        glow: "0 0 0 1px rgba(245,180,0,0.45), 0 8px 32px -8px rgba(245,180,0,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
