import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fraudly: {
          bg: "#f8fafc",
          text: "#0f172a"
        }
      },
      transitionDuration: {
        DEFAULT: "150ms"
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)"
      },
      boxShadow: {
        /** @deprecated prefer subtle / elevated / overlay */
        card: "0 20px 45px -24px rgba(2, 6, 23, 0.28)",
        subtle:
          "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px -1px rgb(15 23 42 / 0.06)",
        elevated:
          "0 6px 14px -6px rgb(15 23 42 / 0.08), 0 4px 8px -4px rgb(15 23 42 / 0.05)",
        overlay: "0 24px 48px -12px rgb(15 23 42 / 0.14), 0 12px 24px -12px rgb(15 23 42 / 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
