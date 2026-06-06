import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../../hooks/use-theme";
import { StatsCard } from "../../components/stats-card";
import { DocumentCard } from "../../components/document-card";
import { PipelineStep } from "../../components/pipeline-step";
import { EmptyState } from "../../components/empty-state";
import { MOCK_KB_STATS, MOCK_DOCUMENTS } from "../../data";

export default function KBScreen() {
  const theme = useSalesTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textColor }]}>Knowledge Base</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            RAG-powered document intelligence
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.askBtn, { backgroundColor: "#265834" }, theme.shadowStyle]}
          onPress={() => router.push("/playground")}
        >
          <Ionicons name="sparkles" size={16} color="#FFF" />
          <Text style={styles.askBtnText}>Ask AI</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row — tap to see System Overview */}
      <TouchableOpacity style={styles.statsRow} onPress={() => router.push("/system")} activeOpacity={0.7}>
        <StatsCard label="Documents" value={String(MOCK_KB_STATS.docCount)} icon="document" />
        <StatsCard label="Chunks" value={MOCK_KB_STATS.chunkCount.toLocaleString()} icon="cube" />
        <StatsCard label="Accuracy" value={MOCK_KB_STATS.accuracy} icon="checkmark-circle" />
      </TouchableOpacity>

      {/* Documents */}
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>DOCUMENTS</Text>
      <View style={styles.docList}>
        {MOCK_DOCUMENTS.map((doc) => (
          <DocumentCard
            key={doc.id}
            name={doc.name}
            type={doc.type}
            status={doc.status}
            chunks={doc.chunks}
            createdAt={doc.createdAt}
          />
        ))}
      </View>

      {/* Upload Pipeline */}
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>UPLOAD PIPELINE</Text>
      <View style={[styles.pipelineCard, { backgroundColor: theme.cardBg }, theme.shadowStyle]}>
        {[
          { label: "Upload", desc: "PDF / TXT / FAQ ingestion" },
          { label: "Parse", desc: "Extract text content" },
          { label: "Chunk", desc: "Recursive text splitter" },
          { label: "Embed", desc: "OpenAI text-embedding-3-small" },
          { label: "Store", desc: "pgvector cosine index" },
          { label: "Ready", desc: "Searchable in Knowledge Base" },
        ].map((step, idx) => (
          <PipelineStep
            key={step.label}
            step={idx + 1}
            label={step.label}
            description={step.desc}
            isActive={false}
            isDone={true}
          />
        ))}
      </View>

      {/* Last Sync */}
      <View style={[styles.syncBar, { borderTopColor: theme.borderColor }]}>
        <View style={styles.syncDot} />
        <Text style={[styles.syncText, { color: theme.muted }]}>
          Last sync {MOCK_KB_STATS.lastSync}
        </Text>
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
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 2 },
  subtitle: { fontSize: 14 },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  askBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },

  docList: {
    gap: 8,
    marginBottom: 28,
  },

  pipelineCard: {
    borderRadius: 16,
    padding: 12,
  },

  syncBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#579360",
  },
  syncText: { fontSize: 12 },
});
