import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      background: "#0A0A0A",
      card: "#141414",
      modal: "#1E1E1E",
      accent: "#FACC15",
      "text-primary": "#FAFAFA",
      "text-secondary": "#A3A3A3",
      "text-muted": "#525252",
      error: "#EF4444",
      warning: "#F97316",
      success: "#22C55E",
      border: "#262626", // Only used for inputs
    },
    fontSize: {
      "12": ["12px", "1.5"],
      "14": ["14px", "1.5"],
      "16": ["16px", "1.5"],
      "18": ["18px", "1.8"], // Lora only
      "20": ["20px", "1.5"],
      "28": ["28px", "1.2"],
      "40": ["40px", "1"],
    },
    fontWeight: {
      "400": "400",
      "500": "500",
      "600": "600",
    },
    spacing: {
      "0": "0px",
      "4": "4px",
      "8": "8px",
      "16": "16px",
      "24": "24px",
      "32": "32px",
      "48": "48px",
    },
    fontFamily: {
      sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      mono: ["var(--font-mono)", "monospace"],
      serif: ["var(--font-lora)", "Georgia", "serif"],
    },
    extend: {},
  },
  plugins: [],
};
export default config;
