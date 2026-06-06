import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";
import type { Source } from "../data/mock-inbox";

interface SourceCitationProps {
  sources: Source[];
}

function scoreColor(score: number, isDark: boolean): string {
  if (score >= 0.85) return isDark ? "#579360" : "#265834";
  if (score >= 0.7) return "#b6ad90";
  return isDark ? "#888080" : "#7A8075";
}

export function SourceCitation({ sources }: SourceCitationProps) {
  const theme = useSalesTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.accentBg, borderColor: theme.borderColor }]}>
      <View style={styles.header}>
        <Ionicons name="link" size={12} color={theme.isDark ? "#579360" : "#265834"} />
        <Text style={[styles.headerText, { color: theme.isDark ? "#579360" : "#265834" }]}>
          Sources
        </Text>
      </View>
      {sources.map((source, idx) => (
        <View
          key={idx}
          style={[styles.sourceRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderColor }]}
        >
          <View style={styles.sourceHeader}>
            <View style={[styles.badge, { backgroundColor: theme.isDark ? "rgba(87,147,96,0.2)" : "rgba(38,88,52,0.12)" }]}>
              <Text style={[styles.badgeText, { color: theme.isDark ? "#579360" : "#265834" }]}>
                {idx + 1}
              </Text>
            </View>
            <Text style={[styles.docName, { color: theme.textColor }]} numberOfLines={1}>
              {source.documentName}
            </Text>
            <View style={[styles.scorePill, { backgroundColor: theme.isDark ? "rgba(87,147,96,0.15)" : "rgba(38,88,52,0.08)" }]}>
              <Text style={[styles.scoreText, { color: scoreColor(source.score, theme.isDark) }]}>
                {(source.score * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
          <Text style={[styles.excerpt, { color: theme.muted }]} numberOfLines={2}>
            Chunk #{source.chunkIndex} — {source.excerpt}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  headerText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sourceRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  docName: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  scorePill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "600",
  },
  excerpt: {
    fontSize: 12,
    lineHeight: 17,
    paddingLeft: 28,
  },
});
