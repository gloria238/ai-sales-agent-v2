import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";

interface StatsCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/** Compact stat card — used in KB header and System Overview */
export function StatsCard({ label, value, icon }: StatsCardProps) {
  const theme = useSalesTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg }, theme.shadowLight]}>
      <View style={[styles.iconBox, { backgroundColor: theme.iconBg }]}>
        <Ionicons name={icon} size={18} color={theme.isDark ? "#4ADE80" : "#166534"} />
      </View>
      <Text style={[styles.value, { color: theme.textColor }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
    textAlign: "center",
  },
});
