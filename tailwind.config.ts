import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // Pure dark matte background (zinc-950)
        surface: {
          0: "#09090b",
          1: "#121215", // Solid matte surface
          2: "#18181b", // Slightly elevated container (zinc-900)
          3: "#27272a", // Borders & active states (zinc-800)
          editor: "#0c0c0e", // Editor panel
        },
        border: {
          subtle: "#27272a", // Crisp zinc-800 border
          active: "#3f3f46", // zinc-700
        },
        primary: {
          DEFAULT: "#10b981", // Crisp emerald accent
          bright: "#34d399",
          dim: "#059669",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
