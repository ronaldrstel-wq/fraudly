import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "!./**/*.test.{ts,tsx}"
  ],
  /** Feed verdict tokens live in lib/scoring/trust-bands.ts — keep in sync if hex values change. */
  safelist: [
    "bg-[#f3fbf7]",
    "bg-[#fff8eb]",
    "bg-[#fff1f1]",
    "border-l-[#14b86a]",
    "border-l-[#f2a93b]",
    "border-l-[#ef4444]",
    "text-[#067647]",
    "text-[#b45309]",
    "text-[#dc2626]"
  ],
  theme: {
    extend: {
      transitionDuration: {
        DEFAULT: "150ms"
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)"
      },
      keyframes: {
        pulseTimelineBar: {
          "0%": { opacity: "0.3" },
          "100%": { opacity: "1" }
        }
      },
      animation: {
        "pulse-timeline-bar": "pulseTimelineBar 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards"
      },
      boxShadow: {
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
