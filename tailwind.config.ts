import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF6EF",
        sand: "#F3E9DC",
        raspberry: { DEFAULT: "#D63B6A", dark: "#B12B54", light: "#F7C9D9" },
        pistachio: "#9CB57A",
        mint: "#7FB9A6",
        cocoa: "#4A3B38",
        vanilla: "#FFFBF4",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["\"Nunito Sans\"", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: { xl2: "1.5rem" },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(74,59,56,0.18)",
        card: "0 2px 12px -4px rgba(74,59,56,0.12)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "pop": { "0%": { transform: "scale(0.96)" }, "100%": { transform: "scale(1)" } },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "pop": "pop 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
