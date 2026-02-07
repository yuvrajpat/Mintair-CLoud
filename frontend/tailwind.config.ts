import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          charcoal: "#191B20",
          white: "#FFFFFF",
          gray: "#DADADA",
          blue: "#2563EB",
          cyan: "#06B6D4",
          lime: "#D8FF70"
        },
        mint: {
          50: "#eff4ff",
          100: "#dbe6ff",
          200: "#bdcfff",
          300: "#98b3ff",
          400: "#6f91ff",
          500: "#4a73f1",
          600: "#2563EB",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a"
        },
        ink: {
          50: "#f8f8f9",
          100: "#efeff1",
          200: "#e1e2e5",
          300: "#c6c8cd",
          400: "#9c9fa8",
          500: "#6f7480",
          600: "#4b5563",
          700: "#343a45",
          800: "#262a33",
          900: "#191B20"
        }
      },
      boxShadow: {
        panel: "none",
        lift: "none",
        soft: "none"
      },
      backgroundImage: {
        "mint-grid": "linear-gradient(rgba(218, 218, 218, 0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(218, 218, 218, 0.9) 1px, transparent 1px)"
      },
      borderRadius: {
        none: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        full: "0px"
      }
    }
  },
  plugins: []
};

export default config;
