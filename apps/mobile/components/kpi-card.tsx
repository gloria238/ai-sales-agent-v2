import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function KpiCard({ label, value, sub, icon }: KpiCardProps) {
  const theme = useSalesTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg }, theme.shadowStyle]}>
      <View style={[styles.iconBox, { backgroundColor: theme.iconBg }]}>
        <Ionicons name={icon} size={22} color={theme.isDark ? "#4ADE80" : "#166534"} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.textColor }]}>{value}</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 14,
    flex: 1,
    minWidth: "46%",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  label: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 22, fontWeight: "700", marginBottom: 1 },
  sub: { fontSize: 11 },
});
