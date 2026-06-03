export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.06)",
} as const;

export const glassEffects = {
  light: {
    bg: "rgba(245, 244, 240, 0.72)",
    border: "rgba(200, 198, 185, 0.6)",
    shadow: "0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.06)",
    shadowHover: "0 0 0 1px rgba(0, 0, 0, 0.06), 0 8px 24px -4px rgba(0, 0, 0, 0.08)",
  },
  dark: {
    bg: "rgba(31, 43, 29, 0.72)",
    border: "rgba(255, 255, 255, 0.06)",
    shadow: "0 0 0 1px rgba(255, 255, 255, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.2)",
    shadowHover: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 8px 24px -4px rgba(0, 0, 0, 0.4)",
  },
} as const;
