import type { Config } from "tailwindcss"

const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        m: {
          bg: "rgb(var(--m-bg) / <alpha-value>)",
          surface: "rgb(var(--m-surface) / <alpha-value>)",
          raised: "rgb(var(--m-raised) / <alpha-value>)",
          fg: "rgb(var(--m-fg) / <alpha-value>)",
          muted: "rgb(var(--m-muted) / <alpha-value>)",
          line: "rgb(var(--m-line) / <alpha-value>)",
          accent: "rgb(var(--m-accent) / <alpha-value>)",
          "accent-fg": "rgb(var(--m-accent-fg) / <alpha-value>)",
          acid: "rgb(var(--m-acid) / <alpha-value>)",
          pink: "rgb(var(--m-pink) / <alpha-value>)",
          cyan: "rgb(var(--m-cyan) / <alpha-value>)",
          orange: "rgb(var(--m-orange) / <alpha-value>)",
          lilac: "rgb(var(--m-lilac) / <alpha-value>)",
          yellow: "rgb(var(--m-yellow) / <alpha-value>)",
          red: "rgb(var(--m-red) / <alpha-value>)",
          blue: "rgb(var(--m-blue) / <alpha-value>)",
          ink: "rgb(var(--m-ink) / <alpha-value>)",
          bone: "rgb(var(--m-bone) / <alpha-value>)",
        },
      },
      fontFamily: {
        "m-display": ["var(--font-m-display)", "system-ui", "sans-serif"],
        "m-mono": ["var(--font-m-mono)", "ui-monospace", "monospace"],
        "m-serif": ["var(--font-m-serif)", "Georgia", "serif"],
        "m-pixel": ["var(--font-m-pixel)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config