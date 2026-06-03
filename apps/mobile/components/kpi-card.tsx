import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@salesagent/ui-tokens/colors";

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  isDark: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

export function KpiCard({ label, value, sub, isDark, icon }: KpiCardProps) {
  const cardBg = isDark ? "#263324" : "#E8E6DF";
  const textColor = isDark ? "#E8EBE6" : "#1F2B1D";
  const muted = isDark ? "#888080" : "#7A8075";
  const iconBg = isDark ? "rgba(38,88,52,0.15)" : "rgba(38,88,52,0.08)";

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: muted }]}>{label}</Text>
        <Text style={[styles.value, { color: textColor }]}>{value}</Text>
        <Text style={[styles.sub, { color: muted }]}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  label: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 22, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 1 },
});
