import { View, Text, ScrollView, StyleSheet, useColorScheme } from "react-native";
import { colors } from "@salesagent/ui-tokens/colors";
import { KpiCard } from "../../components/kpi-card";

export default function DashboardScreen() {
  const isDark = useColorScheme() === "dark";
  const bg = isDark ? colors.darkBg : "#F5F4F0";
  const textColor = isDark ? "#E8EBE6" : "#1F2B1D";
  const muted = isDark ? "#888080" : "#7A8075";

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: textColor }]}>Dashboard</Text>
      <Text style={[styles.subtitle, { color: muted }]}>
        AI SDR platform overview
      </Text>

      <View style={styles.grid}>
        <KpiCard
          label="Pipeline Value"
          value="$12.5k"
          sub="4 deals"
          isDark={isDark}
          icon="trending-up"
        />
        <KpiCard
          label="Meetings"
          value="8"
          sub="This month"
          isDark={isDark}
          icon="calendar"
        />
        <KpiCard
          label="Reply Rate"
          value="42%"
          sub="21/50"
          isDark={isDark}
          icon="chatbubble-ellipses"
        />
        <KpiCard
          label="AI Autopilot"
          value="68%"
          sub="Auto-replying"
          isDark={isDark}
          icon="flash"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  grid: { gap: 12 },
});
