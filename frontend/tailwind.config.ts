import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          charcoal: withOpacity("--color-brand-charcoal"),
          white: withOpacity("--color-brand-white"),
          gray: withOpacity("--color-brand-gray"),
          blue: withOpacity("--color-brand-blue"),
          cyan: withOpacity("--color-brand-cyan"),
          lime: withOpacity("--color-brand-lime")
        },
        mint: {
          50: withOpacity("--color-mint-50"),
          100: withOpacity("--color-mint-100"),
          200: withOpacity("--color-mint-200"),
          300: withOpacity("--color-mint-300"),
          400: withOpacity("--color-mint-400"),
          500: withOpacity("--color-mint-500"),
          600: withOpacity("--color-mint-600"),
          700: withOpacity("--color-mint-700"),
          800: withOpacity("--color-mint-800"),
          900: withOpacity("--color-mint-900")
        },
        ink: {
          50: withOpacity("--color-ink-50"),
          100: withOpacity("--color-ink-100"),
          200: withOpacity("--color-ink-200"),
          300: withOpacity("--color-ink-300"),
          400: withOpacity("--color-ink-400"),
          500: withOpacity("--color-ink-500"),
          600: withOpacity("--color-ink-600"),
          700: withOpacity("--color-ink-700"),
          800: withOpacity("--color-ink-800"),
          900: withOpacity("--color-ink-900")
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
