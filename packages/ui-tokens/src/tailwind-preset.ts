import { semanticColors, colors } from "./colors";
import { fontFamily, fontSize, fontWeight, lineHeight } from "./typography";
import { spacing, borderRadius } from "./spacing";
import { shadows, glassEffects } from "./shadows";

/** Tailwind CSS preset — canonical source of truth consumed by apps/web/tailwind.config.js */
export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: `rgb(var(--accent) / <alpha-value>)`,
          hover: `rgb(var(--accent-hover) / <alpha-value>)`,
          secondary: `rgb(var(--accent-secondary) / <alpha-value>)`,
          soft: `rgb(var(--accent-soft) / <alpha-value>)`,
        },
        bg: {
          DEFAULT: `rgb(var(--bg) / <alpha-value>)`,
          card: `rgb(var(--bg-card) / <alpha-value>)`,
          sage: `rgb(var(--bg-sage) / <alpha-value>)`,
          subtle: `rgb(var(--bg-subtle) / <alpha-value>)`,
          secondary: `rgb(var(--bg-secondary) / <alpha-value>)`,
          muted: `rgb(var(--bg-muted) / <alpha-value>)`,
        },
        text: {
          DEFAULT: `rgb(var(--text) / <alpha-value>)`,
          secondary: `rgb(var(--text-secondary) / <alpha-value>)`,
          muted: `rgb(var(--text-muted) / <alpha-value>)`,
        },
        success: {
          DEFAULT: `rgb(var(--success) / <alpha-value>)`,
          soft: `rgb(var(--success-soft) / <alpha-value>)`,
        },
        warning: {
          DEFAULT: `rgb(var(--warning) / <alpha-value>)`,
          soft: `rgb(var(--warning-soft) / <alpha-value>)`,
        },
        danger: {
          DEFAULT: `rgb(var(--danger) / <alpha-value>)`,
          soft: `rgb(var(--danger-soft) / <alpha-value>)`,
        },
        border: {
          DEFAULT: `rgb(var(--border) / <alpha-value>)`,
          light: `rgb(var(--border-light) / <alpha-value>)`,
        },
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
        },
        sidebar: {
          bg: "var(--sidebar-bg)",
          border: "var(--sidebar-border)",
        },
        surface: {
          DEFAULT: "#F5F4F0",
          alt: "#EEEDE8",
          hover: "#d6d9c3",
        },
      },
      fontFamily: {
        sans: fontFamily.sans,
        mono: fontFamily.mono,
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        sm: "0.5rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
        "card-hover": "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        "card-xl": "0 8px 24px -4px rgb(0 0 0 / 0.08), 0 2px 6px -1px rgb(0 0 0 / 0.04)",
        panel: "0 4px 16px -4px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
        "panel-xl": "0 12px 32px -8px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.04)",
        glass: "0 0 0 1px rgb(255 255 255 / 0.08), 0 4px 16px -8px rgb(0 0 0 / 0.12)",
        "glass-hover": "0 0 0 1px rgb(255 255 255 / 0.12), 0 8px 24px -8px rgb(0 0 0 / 0.16)",
        "glass-sm": glassEffects.light.shadow,
        "glass-lg": glassEffects.light.shadowHover,
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "flash-green": {
          "0%": { boxShadow: "inset 0 0 0 0 rgba(38,88,52,0)" },
          "30%": { boxShadow: "inset 0 0 0 2px rgba(38,88,52,0.4)" },
          "100%": { boxShadow: "inset 0 0 0 0 rgba(38,88,52,0)" },
        },
        "flash-red": {
          "0%": { boxShadow: "inset 0 0 0 0 rgba(180,70,60,0)" },
          "20%": { boxShadow: "inset 0 0 0 2px rgba(180,70,60,0.4)" },
          "40%": { boxShadow: "inset 0 0 0 0 rgba(180,70,60,0)" },
          "60%": { boxShadow: "inset 0 0 0 2px rgba(180,70,60,0.4)" },
          "100%": { boxShadow: "inset 0 0 0 0 rgba(180,70,60,0)" },
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
        "flash-green": "flash-green 0.8s ease-out",
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
