import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4f6",
          100: "#e6edf1",
          500: "#7189a1",
          600: "#647d96",
          700: "#566f87",
        },
        coral: {
          500: "#df7066",
          600: "#cb655d",
        },
      },
      boxShadow: {
        soft: "0 8px 24px rgba(90, 105, 120, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
