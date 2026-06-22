import { useColorScheme } from "react-native";
import { colors } from "@salesagent/ui-tokens";

/** Resolves all theme values from system color scheme.
 *  Every component uses this instead of inline dark/light branching. */
export function useSalesTheme() {
  const isDark = useColorScheme() === "dark";

  return {
    isDark,
    bg: isDark ? colors.darkBg : "#F8F9FA",
    cardBg: isDark ? "#111A0E" : colors.card,
    cardAlt: isDark ? "#1A2814" : "#F1F5F9",
    textColor: isDark ? "#F1F5F9" : "#0F172A",
    secondaryText: isDark ? "#BCD2B4" : "#475569",
    muted: isDark ? "#789173" : "#94A3B8",
    borderColor: isDark ? "#263620" : "#CBD5E1",
    iconBg: isDark ? "rgba(74,222,128,0.12)" : "rgba(22,101,52,0.07)",
    accentBg: isDark ? "rgba(74,222,128,0.15)" : "rgba(22,101,52,0.08)",
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
