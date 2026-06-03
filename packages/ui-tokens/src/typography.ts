export const fontFamily = {
  sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
  mono: ['"JetBrains Mono"', "Menlo", "Consolas", "monospace"],
} as const;

export const fontSize = {
  xs: "0.75rem",     // 12px
  sm: "0.8125rem",   // 13px
  base: "0.875rem",  // 14px
  lg: "1rem",        // 16px
  xl: "1.125rem",    // 18px
  "2xl": "1.25rem",  // 20px
  "3xl": "1.5rem",   // 24px
  "4xl": "1.875rem", // 30px
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const lineHeight = {
  tight: "1.25",
  normal: "1.5",
  relaxed: "1.625",
} as const;
