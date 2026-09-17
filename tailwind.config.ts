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
        background: "#141417", // Elevated charcoal dark grey (soft on eyes, replaces harsh black)
        surface: {
          0: "#141417",
          1: "#1a1b20", // Refined dark grey card surface
          2: "#22232a", // Elevated containers & pill buttons
          3: "#2e303a", // Active borders & chips
          editor: "#16171c", // Terminal editor background
        },
        border: {
          subtle: "#272932", // Crisp subtle hairline border
          active: "#3e414f", // Refined active border
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
