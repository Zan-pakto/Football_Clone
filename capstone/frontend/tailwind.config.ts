import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080b11",
        surface: "#101622",
        "surface-border": "#1e293b",
        hazard: "#ef4444",
        warning: "#f59e0b",
        tactical: "#06b6d4",
        thermal: "#f97316",
        safe: "#10b981",
      },
    },
  },
  plugins: [],
};
export default config;
