/** Raw hex values for the Luxury Nature palette.
 *  Consumed by both CSS custom properties (web) and React Native (mobile). */

export const colors = {
  // Primary — Corporate Green
  primary: "#166534",         // green-800 — authoritative, professional
  primaryHover: "#15803d",    // green-700 — hover state

  // Backgrounds
  darkBg: "#0a1108",          // Near-OLED green-black — dark mode background
  secondaryBg: "#475540",     // Refined olive — sidebar, secondary surfaces

  // Surfaces
  card: "#FFFFFF",            // Pure white — cards, elevated surfaces (light)
  sageHighlight: "#e8f0ea",   // Cool sage — badges, highlights only

  // Accents
  warmAccent: "#849b70",      // Sage accent — dividers, secondary accents

  // Semantic
  danger: "#B92D28",          // Refined red
} as const;

/** Semantic color tokens mapped to hex values.
 *  These drive CSS custom properties and React Native StyleSheet. */
export const semanticColors = {
  light: {
    bg: "248 249 250",              // cool off-white (slate-50)
    bgCard: "255 255 255",          // pure white cards
    bgSage: "232 240 234",          // cool sage
    bgSubtle: "241 245 249",        // slate-100
    bgSecondary: "71 85 64",        // refined olive
    bgMuted: "241 243 238",
    border: "203 213 225",          // slate-300
    borderLight: "226 232 240",     // slate-200
    text: "15 23 42",               // slate-900 — crisp
    textSecondary: "71 85 105",     // slate-600
    textMuted: "148 163 184",       // slate-400
    accent: "22 101 52",            // green-800 — authoritative
    accentHover: "21 128 61",       // green-700
    accentSecondary: "132 155 112", // sage accent
    accentSoft: "236 253 243",      // green-50
    accentMuted: "220 252 231",     // green-100
    success: "22 101 52",
    successSoft: "236 253 243",
    warning: "180 150 60",
    warningSoft: "254 252 232",
    danger: "185 45 40",
    dangerSoft: "254 242 242",
    // Glass — professional (more opaque)
    glassBg: "rgba(255, 255, 255, 0.82)",
    glassBorder: "rgba(203, 213, 225, 0.7)",
    sidebarBg: "rgba(248, 249, 250, 0.94)",
    sidebarBorder: "rgba(0, 0, 0, 0.05)",
  },
  dark: {
    bg: "10 17 8",                  // near-OLED green-black
    bgCard: "17 26 14",             // elevated surface
    bgSage: "22 32 18",
    bgSubtle: "20 30 16",
    bgSecondary: "71 85 64",        // refined olive
    bgMuted: "26 38 21",
    border: "38 54 32",
    borderLight: "28 44 23",
    text: "241 245 249",            // slate-100 — crisp light
    textSecondary: "188 210 180",   // green-tinted secondary
    textMuted: "120 145 115",       // green-tinted muted
    accent: "74 222 128",           // green-400 — vibrant on dark
    accentHover: "134 239 172",     // green-300
    accentSecondary: "132 155 112",
    accentSoft: "20 40 14",
    accentMuted: "15 30 10",
    success: "74 222 128",
    successSoft: "20 40 14",
    warning: "212 183 60",
    warningSoft: "40 38 12",
    danger: "248 113 113",
    dangerSoft: "45 15 15",
    // Glass — professional (more opaque)
    glassBg: "rgba(10, 17, 8, 0.78)",
    glassBorder: "rgba(255, 255, 255, 0.05)",
    sidebarBg: "rgba(10, 14, 7, 0.94)",
    sidebarBorder: "rgba(255, 255, 255, 0.04)",
  },
} as const;
