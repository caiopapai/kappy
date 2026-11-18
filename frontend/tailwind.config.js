/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Kappy Design System
        surface:  { DEFAULT: "#0f1117", card: "#161820", raised: "#1a1d2e" },
        border:   { DEFAULT: "#2a2d3a", strong: "#3a3d52" },
        text:     { primary: "#e8e6e0", muted: "#8a8fa8", faint: "#5a5f78" },
        brand:    { DEFAULT: "#6366f1", light: "#a5b4fc" },
        success:  "#4ade80",
        warning:  "#f59e0b",
        danger:   "#f87171",
        info:     "#60a5fa",
      },
    },
  },
  plugins: [],
};