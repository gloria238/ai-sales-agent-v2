/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          secondary: "rgb(var(--accent-secondary) / <alpha-value>)",
          subtle: "rgb(var(--accent-subtle) / <alpha-value>)",
          text: "rgb(var(--accent-text) / <alpha-value>)",
          soft: "rgb(var(--accent-subtle) / <alpha-value>)",   // legacy alias
        },
        bg: {
          DEFAULT: "rgb(var(--bg) / <alpha-value>)",
          card: "rgb(var(--bg-card) / <alpha-value>)",
          subtle: "rgb(var(--bg-subtle) / <alpha-value>)",
          muted: "rgb(var(--bg-muted) / <alpha-value>)",
          sage: "rgb(var(--accent-subtle) / <alpha-value>)",    // legacy alias
          secondary: "rgb(var(--bg-subtle) / <alpha-value>)",   // legacy alias
        },
        text: {
          DEFAULT: "rgb(var(--text-primary) / <alpha-value>)",
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
          disabled: "rgb(var(--text-disabled) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          soft: "rgb(254 242 242 / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-subtle) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--warning) / <alpha-value>)",
          soft: "rgb(var(--warning-subtle) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          light: "rgb(var(--border) / <alpha-value>)",          // legacy alias
          strong: "rgb(var(--border-strong) / <alpha-value>)",
        },
        /* ── Landing Page Colors (HSL) ── */
        "lp-background": "hsl(var(--lp-background))",
        "lp-foreground": "hsl(var(--lp-foreground))",
        "lp-primary": {
          DEFAULT: "hsl(var(--lp-primary))",
          foreground: "hsl(var(--lp-primary-foreground))",
        },
        "lp-secondary": "hsl(var(--lp-secondary))",
        "lp-border": "hsl(var(--lp-border))",
        "lp-card": "hsl(var(--lp-card))",
        "lp-muted": {
          DEFAULT: "hsl(var(--lp-muted))",
          foreground: "hsl(var(--lp-muted-foreground))",
        },
        "lp-hero": {
          heading: "hsl(var(--lp-hero-heading))",
          sub: "hsl(var(--lp-hero-sub))",
        },
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "skeleton": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-up": "slide-up 200ms ease-out",
        "scale-in": "scale-in 150ms ease-out",
        "skeleton": "skeleton 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
