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
        background: {
          DEFAULT: 'hsl(var(--background) / <alpha-value>)',
          card:     'hsl(var(--background-card) / <alpha-value>)',
          subtle:   'hsl(var(--background-subtle) / <alpha-value>)',
          hover:    'hsl(var(--background-hover) / <alpha-value>)',
        },
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT:    'hsl(var(--primary) / <alpha-value>)',
          hover:      'hsl(var(--primary-hover) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
          dim:        'var(--primary-dim)',
        },
        card: {
          DEFAULT:    'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong:  'var(--border-strong)',
        },
        ring:         'hsl(var(--ring) / <alpha-value>)',
        success:      'hsl(var(--success) / <alpha-value>)',
        warning:      'hsl(var(--warning) / <alpha-value>)',
        danger:       'hsl(var(--danger) / <alpha-value>)',
        /* ── Legacy aliases — backward compat with old class names ── */
        bg: {
          DEFAULT: 'hsl(var(--background) / <alpha-value>)',
          card:    'hsl(var(--background-card) / <alpha-value>)',
          subtle:  'hsl(var(--background-subtle) / <alpha-value>)',
          muted:   'hsl(var(--muted) / <alpha-value>)',
        },
        text: {
          DEFAULT:  'hsl(var(--foreground) / <alpha-value>)',
          primary:  'hsl(var(--foreground) / <alpha-value>)',
          secondary:'hsl(var(--foreground) / 0.75)',
          muted:    'hsl(var(--muted-foreground) / <alpha-value>)',
          disabled: 'hsl(var(--muted-foreground) / 0.5)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
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
