/** Raw hex values for the Luxury Nature palette.
 *  Consumed by both CSS custom properties (web) and React Native (mobile). */

export const colors = {
  // Primary
  primary: "#265834",         // Deep forest green
  primaryHover: "#579360",    // Hover green

  // Backgrounds
  darkBg: "#1f2b1d",          // Dark mode background
  secondaryBg: "#656d4a",     // Olive — sidebar, secondary surfaces

  // Surfaces
  card: "#E8E6DF",            // Warm cream — cards, elevated surfaces
  sageHighlight: "#d6d9c3",   // Sage — badges, highlights only

  // Accents
  warmAccent: "#b6ad90",      // Warm tan — dividers, secondary accents

  // Semantic
  danger: "#B4463C",          // Muted red
} as const;

/** Semantic color tokens mapped to hex values.
 *  These drive CSS custom properties and React Native StyleSheet. */
export const semanticColors = {
  light: {
    bg: "245 244 240",              // warm off-white
    bgCard: "232 230 223",          // #E8E6DF
    bgSage: "214 217 195",          // #d6d9c3
    bgSubtle: "238 237 232",
    bgSecondary: "101 109 74",      // #656d4a
    bgMuted: "230 228 220",
    border: "200 198 185",
    borderLight: "214 217 195",
    text: "31 43 29",               // #1f2b1d
    textSecondary: "74 80 69",
    textMuted: "122 128 117",
    accent: "38 88 52",             // #265834
    accentHover: "87 147 96",       // #579360
    accentSecondary: "182 173 144", // #b6ad90
    accentSoft: "230 240 232",
    accentMuted: "210 225 215",
    success: "38 88 52",
    successSoft: "230 240 232",
    warning: "182 173 144",
    warningSoft: "245 242 235",
    danger: "180 70 60",
    dangerSoft: "250 240 238",
    // Glass
    glassBg: "rgba(245, 244, 240, 0.72)",
    glassBorder: "rgba(200, 198, 185, 0.6)",
    sidebarBg: "rgba(245, 244, 240, 0.92)",
    sidebarBorder: "rgba(0, 0, 0, 0.06)",
  },
  dark: {
    bg: "31 43 29",                 // #1f2b1d
    bgCard: "38 51 36",
    bgSage: "42 56 39",
    bgSubtle: "42 56 39",
    bgSecondary: "101 109 74",      // #656d4a
    bgMuted: "48 64 44",
    border: "58 74 54",
    borderLight: "42 56 39",
    text: "232 235 230",
    textSecondary: "188 196 184",
    textMuted: "136 144 128",
    accent: "87 147 96",            // #579360
    accentHover: "109 174 120",
    accentSecondary: "182 173 144",
    accentSoft: "31 50 28",
    accentMuted: "25 45 22",
    success: "87 147 96",
    successSoft: "25 45 22",
    warning: "182 173 144",
    warningSoft: "50 45 35",
    danger: "220 100 90",
    dangerSoft: "60 25 25",
    // Glass
    glassBg: "rgba(31, 43, 29, 0.72)",
    glassBorder: "rgba(255, 255, 255, 0.06)",
    sidebarBg: "rgba(31, 43, 29, 0.92)",
    sidebarBorder: "rgba(255, 255, 255, 0.05)",
  },
} as const;
