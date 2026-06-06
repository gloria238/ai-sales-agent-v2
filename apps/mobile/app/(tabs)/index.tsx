import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSalesTheme } from "../../hooks/use-theme";
import { useDemoMode } from "../../hooks/use-demo-mode";
import { KpiCard } from "../../components/kpi-card";
import { ActivityItem } from "../../components/activity-item";
import { StatsCard } from "../../components/stats-card";
import { Skeleton } from "../../components/skeleton";
import { EmptyState } from "../../components/empty-state";
import { MOCK_KPIS, MOCK_RECENT_ACTIVITY } from "../../data";

export default function DashboardScreen() {
  const theme = useSalesTheme();
  const { mode, setMode, isDemo } = useDemoMode();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Text style={[styles.clubName, { color: theme.muted }]}>
        Riverside Club
      </Text>
      <Text style={[styles.title, { color: theme.textColor }]}>
        Dashboard
      </Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>
        AI Concierge Platform
      </Text>

      {/* Demo / Live Toggle */}
      <View style={[styles.toggle, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <View
          style={[
            styles.togglePill,
            isDemo && { backgroundColor: theme.isDark ? "rgba(87,147,96,0.2)" : "rgba(38,88,52,0.12)" },
          ]}
        >
          <View style={[styles.toggleDot, { backgroundColor: isDemo ? (theme.isDark ? "#579360" : "#265834") : theme.muted }]} />
          <Text style={[styles.toggleText, { color: isDemo ? theme.textColor : theme.muted }]}>
            Demo Data
          </Text>
        </View>
        <View
          style={[
            styles.togglePill,
            !isDemo && { backgroundColor: theme.isDark ? "rgba(87,147,96,0.2)" : "rgba(38,88,52,0.12)" },
          ]}
        >
          <View style={[styles.toggleDot, { backgroundColor: !isDemo ? (theme.isDark ? "#579360" : "#265834") : theme.muted }]} />
          <Text style={[styles.toggleText, { color: !isDemo ? theme.textColor : theme.muted }]}>
            Live API
          </Text>
        </View>
      </View>

      {/* KPI Grid */}
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>OVERVIEW</Text>
      <View style={styles.kpiGrid}>
        {MOCK_KPIS.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </View>

      {/* Recent Activity */}
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>RECENT ACTIVITY</Text>
      <View style={[styles.activityCard, { backgroundColor: theme.cardBg }, theme.shadowStyle]}>
        {MOCK_RECENT_ACTIVITY.map((item) => (
          <ActivityItem key={item.id} {...item} />
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 20 },
  clubName: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 2 },
  subtitle: { fontSize: 14, marginBottom: 24 },

  toggle: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    marginBottom: 24,
  },
  togglePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleDot: { width: 7, height: 7, borderRadius: 4 },
  toggleText: { fontSize: 13, fontWeight: "600" },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },

  activityCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
  },
});
