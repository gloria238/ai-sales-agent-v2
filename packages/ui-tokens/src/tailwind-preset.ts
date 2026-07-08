import { colors } from "./colors";
import { fontFamily, fontSize, fontWeight, lineHeight } from "./typography";
import { spacing, borderRadius } from "./spacing";
import { shadows, glassEffects } from "./shadows";

/** Tailwind CSS preset — canonical source of truth consumed by apps/web/tailwind.config.js */
export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: `hsl(var(--background) / <alpha-value>)`,
          card: `hsl(var(--background-card) / <alpha-value>)`,
          subtle: `hsl(var(--background-subtle) / <alpha-value>)`,
          hover: `hsl(var(--background-hover) / <alpha-value>)`,
        },
        foreground: `hsl(var(--foreground) / <alpha-value>)`,
        primary: {
          DEFAULT: `hsl(var(--primary) / <alpha-value>)`,
          hover: `hsl(var(--primary-hover) / <alpha-value>)`,
          foreground: `hsl(var(--primary-foreground) / <alpha-value>)`,
          dim: "var(--primary-dim)",
        },
        card: {
          DEFAULT: `hsl(var(--card) / <alpha-value>)`,
          foreground: `hsl(var(--card-foreground) / <alpha-value>)`,
        },
        secondary: {
          DEFAULT: `hsl(var(--secondary) / <alpha-value>)`,
          foreground: `hsl(var(--secondary-foreground) / <alpha-value>)`,
        },
        muted: {
          DEFAULT: `hsl(var(--muted) / <alpha-value>)`,
          foreground: `hsl(var(--muted-foreground) / <alpha-value>)`,
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        ring: `hsl(var(--ring) / <alpha-value>)`,
        success: `hsl(var(--success) / <alpha-value>)`,
        warning: `hsl(var(--warning) / <alpha-value>)`,
        danger: `hsl(var(--danger) / <alpha-value>)`,
        /* ── Legacy aliases — backward compat ── */
        bg: {
          DEFAULT: `hsl(var(--background) / <alpha-value>)`,
          card: `hsl(var(--background-card) / <alpha-value>)`,
          subtle: `hsl(var(--background-subtle) / <alpha-value>)`,
          muted: `hsl(var(--muted) / <alpha-value>)`,
        },
        text: {
          DEFAULT: `hsl(var(--foreground) / <alpha-value>)`,
          primary: `hsl(var(--foreground) / <alpha-value>)`,
          secondary: `hsl(var(--foreground) / 0.75)`,
          muted: `hsl(var(--muted-foreground) / <alpha-value>)`,
          disabled: `hsl(var(--muted-foreground) / 0.5)`,
        },
        destructive: {
          DEFAULT: `hsl(var(--danger) / <alpha-value>)`,
        },
        surface: {
          DEFAULT: "#0A0D14",
          alt: "#0F1420",
          hover: "#1A2236",
        },
      },
      fontFamily: {
        sans: fontFamily.sans,
        mono: fontFamily.mono,
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        sm: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
        "card-hover": "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        "card-xl": "0 8px 24px -4px rgb(0 0 0 / 0.08), 0 2px 6px -1px rgb(0 0 0 / 0.04)",
        panel: "0 4px 16px -4px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
        "panel-xl": "0 12px 32px -8px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.04)",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "flash-primary": {
          "0%": { boxShadow: "inset 0 0 0 0 rgba(59,126,246,0)" },
          "30%": { boxShadow: "inset 0 0 0 2px rgba(59,126,246,0.4)" },
          "100%": { boxShadow: "inset 0 0 0 0 rgba(59,126,246,0)" },
        },
        "flash-red": {
          "0%": { boxShadow: "inset 0 0 0 0 rgba(239,68,68,0)" },
          "20%": { boxShadow: "inset 0 0 0 2px rgba(239,68,68,0.4)" },
          "40%": { boxShadow: "inset 0 0 0 0 rgba(239,68,68,0)" },
          "60%": { boxShadow: "inset 0 0 0 2px rgba(239,68,68,0.4)" },
          "100%": { boxShadow: "inset 0 0 0 0 rgba(239,68,68,0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "draw-line": {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        skeleton: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "flash-primary": "flash-primary 0.8s ease-out",
        "flash-red": "flash-red 0.6s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "draw-line": "draw-line 1s linear forwards",
        skeleton: "skeleton 2s ease-in-out infinite",
      },
    },
  },
};
