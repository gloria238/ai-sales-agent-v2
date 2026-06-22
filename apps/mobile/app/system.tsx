import { useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";
import { StatsCard } from "../components/stats-card";
import { PipelineStep } from "../components/pipeline-step";
import { MOCK_SYSTEM_STATS, PIPELINE_STEPS, TECH_STACK, ARCHITECTURE_LAYERS } from "../data";

function TenantAvatar({ name }: { name: string }) {
  const theme = useSalesTheme();
  const [imgError, setImgError] = useState(false);

  return (
    <View style={[styles.tenantAvatar, { backgroundColor: theme.iconBg }]}>
      {imgError ? (
        <Text style={[styles.tenantAvatarText, { color: theme.isDark ? "#4ADE80" : "#166534" }]}>
          {name[0]}
        </Text>
      ) : (
        <Image
          source={{ uri: `https://i.pravatar.cc/68?u=${encodeURIComponent(name)}` }}
          style={styles.tenantAvatarImg}
          onError={() => setImgError(true)}
        />
      )}
    </View>
  );
}

export default function SystemOverviewScreen() {
  const theme = useSalesTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textColor }]}>System Overview</Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.muted }]}>
        Multi-Tenant AI Concierge Platform
      </Text>

      {/* Stats */}
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>PLATFORM STATS</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatsCard label="Clubs" value={String(MOCK_SYSTEM_STATS.clubs)} icon="business" />
          <StatsCard label="Documents" value={String(MOCK_SYSTEM_STATS.documents)} icon="document" />
          <StatsCard label="Chunks" value={MOCK_SYSTEM_STATS.chunks.toLocaleString()} icon="cube" />
        </View>
        <View style={styles.statsRow}>
          <StatsCard label="Conversations" value={String(MOCK_SYSTEM_STATS.conversations)} icon="chatbubbles" />
          <StatsCard label="Agents" value={String(MOCK_SYSTEM_STATS.agents)} icon="sparkles" />
          <StatsCard label="Workers" value={String(MOCK_SYSTEM_STATS.workers)} icon="server" />
        </View>
      </View>

      {/* Multi-Tenant */}
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>MULTI-TENANT</Text>
      <View style={[styles.tenantCard, { backgroundColor: theme.cardBg }, theme.shadowStyle]}>
        {["Riverside Club", "Elite Tennis", "Westside Sports"].map((name) => (
          <View key={name} style={[styles.tenantRow, { borderBottomColor: theme.borderColor }]}>
            <TenantAvatar name={name} />
            <Text style={[styles.tenantName, { color: theme.textColor }]}>{name}</Text>
            <View style={styles.tenantDot} />
            <Text style={[styles.tenantStatus, { color: theme.muted }]}>Active</Text>
          </View>
        ))}
      </View>

      {/* RAG Pipeline */}
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>RAG PIPELINE</Text>
      <View style={[styles.pipelineCard, { backgroundColor: theme.cardBg }, theme.shadowStyle]}>
        {PIPELINE_STEPS.map((step, idx) => (
          <PipelineStep
            key={step.label}
            step={idx + 1}
            label={step.label}
            description={step.description}
            isActive={false}
            isDone={true}
          />
        ))}
      </View>

      {/* Architecture */}
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>SYSTEM ARCHITECTURE</Text>
      <View style={[styles.archCard, { backgroundColor: theme.cardBg }, theme.shadowStyle]}>
        {ARCHITECTURE_LAYERS.map((layer) => (
          <View key={layer.layer} style={[styles.archRow, { borderBottomColor: theme.borderColor }]}>
            <View style={styles.archLeft}>
              <Text style={[styles.archLayer, { color: theme.textColor }]}>{layer.layer}</Text>
              <Text style={[styles.archDesc, { color: theme.muted }]}>{layer.description}</Text>
            </View>
            <View style={[styles.archTech, { backgroundColor: theme.iconBg }]}>
              <Text style={[styles.archTechText, { color: theme.isDark ? "#4ADE80" : "#166534" }]}>
                {layer.tech}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Tech Stack */}
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>TECH STACK</Text>
      <View style={styles.techGrid}>
        {TECH_STACK.map((tech) => (
          <View key={tech} style={[styles.techPill, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
            <Text style={[styles.techText, { color: theme.secondaryText }]}>{tech}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  backBtn: { marginRight: 12, marginLeft: -8 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, marginBottom: 28 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 24,
  },

  statsGrid: { gap: 8 },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },

  tenantCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tenantAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tenantAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  tenantAvatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  tenantName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  tenantDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  tenantStatus: { fontSize: 12 },

  pipelineCard: {
    borderRadius: 16,
    padding: 12,
  },

  archCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  archRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  archLeft: { flex: 1, marginRight: 12 },
  archLayer: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  archDesc: { fontSize: 12 },
  archTech: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  archTechText: { fontSize: 11, fontWeight: "600" },

  techGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  techPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  techText: { fontSize: 12, fontWeight: "500" },
});
