import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        muted: "var(--muted)",
        subtle: "var(--subtle)",
        border: { DEFAULT: "var(--border)", strong: "var(--border-strong)" },
        accent: { DEFAULT: "var(--accent)", soft: "var(--accent-soft)", hover: "var(--accent-hover)" },
        warn: { DEFAULT: "var(--warn)", soft: "var(--warn-soft)" },
        rose: { DEFAULT: "var(--rose)", soft: "var(--rose-soft)" },
        violet: { DEFAULT: "var(--violet)", soft: "var(--violet-soft)" },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: { '2xs': ['0.6875rem', { lineHeight: '1rem' }] },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(15,20,25,0.04)',
        md: '0 4px 8px -2px rgba(15,20,25,0.06), 0 2px 4px -1px rgba(15,20,25,0.04)',
        lg: '0 10px 20px -8px rgba(15,20,25,0.10), 0 4px 8px -4px rgba(15,20,25,0.06)',
      },
      animation: {
        'slide-up': 'slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        slideUp: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
export default config;
