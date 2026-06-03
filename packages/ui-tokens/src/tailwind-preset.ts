import { semanticColors, colors } from "./colors";
import { fontFamily, fontSize, fontWeight, lineHeight } from "./typography";
import { spacing, borderRadius } from "./spacing";
import { shadows, glassEffects } from "./shadows";

/** Tailwind CSS preset consumed by apps/web/tailwind.config.js */
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
      boxShadow: {
        "glass-sm": glassEffects.light.shadow,
        "glass-lg": glassEffects.light.shadowHover,
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "flash-green": {
          "0%": { boxShadow: `0 0 0 0 rgba(${semanticColors.light.accent}, 0)` },
          "50%": { boxShadow: `0 0 0 4px rgba(${semanticColors.light.accent}, 0.4)` },
          "100%": { boxShadow: `0 0 0 0 rgba(${semanticColors.light.accent}, 0)` },
        },
        "flash-red": {
          "0%": { boxShadow: `0 0 0 0 rgba(${semanticColors.light.danger}, 0)` },
          "50%": { boxShadow: `0 0 0 4px rgba(${semanticColors.light.danger}, 0.4)` },
          "100%": { boxShadow: `0 0 0 0 rgba(${semanticColors.light.danger}, 0)` },
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
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        skeleton: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "flash-green": "flash-green 1.5s ease-out",
        "flash-red": "flash-red 1.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        skeleton: "skeleton 2s linear infinite",
      },
    },
  },
};
