import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";

interface DocumentCardProps {
  name: string;
  type: "PDF" | "TXT" | "FAQ";
  status: "Ready" | "Processing" | "Failed";
  chunks: number;
  createdAt: string;
  onPress?: () => void;
}

function statusColor(status: string, isDark: boolean): string {
  switch (status) {
    case "Ready": return isDark ? "#579360" : "#265834";
    case "Processing": return "#b6ad90";
    case "Failed": return "#B4463C";
    default: return "#7A8075";
  }
}

function fileIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "PDF": return "document";
    case "FAQ": return "code-slash";
    case "TXT": return "document-text";
    default: return "document";
  }
}

export function DocumentCard({ name, type, status, chunks, createdAt, onPress }: DocumentCardProps) {
  const theme = useSalesTheme();
  const dotColor = statusColor(status, theme.isDark);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBg }, theme.shadowLight]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.fileIconBox, { backgroundColor: theme.iconBg }]}>
        <Ionicons name={fileIcon(type)} size={22} color={theme.isDark ? "#579360" : "#265834"} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.textColor }]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.typeBadge, { backgroundColor: theme.accentBg }]}>
            <Text style={[styles.typeText, { color: theme.isDark ? "#579360" : "#265834" }]}>
              {type}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
            <Text style={[styles.statusText, { color: dotColor }]}>{status}</Text>
          </View>
          {chunks > 0 && (
            <Text style={[styles.chunks, { color: theme.muted }]}>{chunks} chunks</Text>
          )}
        </View>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={16} color={theme.muted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    alignItems: "center",
  },
  fileIconBox: {
    width: 40,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  name: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  chunks: {
    fontSize: 11,
  },
});
