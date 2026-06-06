import { useColorScheme } from "react-native";
import { colors } from "@salesagent/ui-tokens";

/** Resolves all theme values from system color scheme.
 *  Every component uses this instead of inline dark/light branching. */
export function useSalesTheme() {
  const isDark = useColorScheme() === "dark";

  return {
    isDark,
    bg: isDark ? colors.darkBg : "#F5F4F0",
    cardBg: isDark ? "#263324" : colors.card,
    cardAlt: isDark ? "#2A3D28" : "#F0EEE8",
    textColor: isDark ? "#E8EBE6" : "#1F2B1D",
    secondaryText: isDark ? "#BCC4B8" : "#4A5045",
    muted: isDark ? "#889080" : "#7A8075",
    borderColor: isDark ? "#3A4A36" : "#C8C6B9",
    iconBg: isDark ? "rgba(87,147,96,0.12)" : "rgba(38,88,52,0.07)",
    accentBg: isDark ? "rgba(87,147,96,0.15)" : "rgba(38,88,52,0.08)",
    successColor: colors.primary,
    warningColor: colors.warmAccent,
    dangerColor: colors.danger,

    shadowStyle: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    } as const,

    shadowLight: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    } as const,
  };
}
