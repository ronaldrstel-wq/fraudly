import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fraudly: {
          bg: "#f8fafc",
          text: "#0f172a"
        }
      },
      boxShadow: {
        card: "0 20px 45px -24px rgba(2, 6, 23, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
