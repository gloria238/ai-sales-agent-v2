import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";

interface ConversationItemProps {
  name: string;
  club: string;
  preview: string;
  confidence: number;
  time: string;
  onPress: () => void;
}

function confidenceColor(pct: number, isDark: boolean): string {
  if (pct >= 85) return isDark ? "#579360" : "#265834";
  if (pct >= 70) return "#b6ad90";
  return isDark ? "#888080" : "#7A8075";
}

export function ConversationItem({
  name,
  club,
  preview,
  confidence,
  time,
  onPress,
}: ConversationItemProps) {
  const theme = useSalesTheme();
  const pctColor = confidenceColor(confidence, theme.isDark);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBg }, theme.shadowLight]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name[0]}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: theme.textColor }]} numberOfLines={1}>
            {name}
          </Text>
          <View style={[styles.confidencePill, { backgroundColor: theme.accentBg }]}>
            <Text style={[styles.confidenceText, { color: pctColor }]}>
              {confidence}%
            </Text>
          </View>
        </View>
        <Text style={[styles.club, { color: theme.muted }]}>{club}</Text>
        <Text style={[styles.preview, { color: theme.secondaryText }]} numberOfLines={2}>
          {preview}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={[styles.time, { color: theme.muted }]}>{time}</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.muted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    alignItems: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#265834",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  info: { flex: 1 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  name: { fontSize: 15, fontWeight: "600", flex: 1 },
  confidencePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: { fontSize: 11, fontWeight: "700" },
  club: { fontSize: 12, marginBottom: 4 },
  preview: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  time: { fontSize: 11 },
});
