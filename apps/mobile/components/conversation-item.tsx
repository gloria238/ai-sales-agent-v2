import { View, Text, StyleSheet } from "react-native";
import { colors } from "@salesagent/ui-tokens/colors";
import { scoreLabel } from "@salesagent/domain/lead";

interface ConversationItemProps {
  name: string;
  company: string;
  preview: string;
  score: number;
  time: string;
  isDark: boolean;
}

export function ConversationItem({ name, company, preview, score, time, isDark }: ConversationItemProps) {
  const cardBg = isDark ? "#263324" : "#E8E6DF";
  const textColor = isDark ? "#E8EBE6" : "#1F2B1D";
  const muted = isDark ? "#888080" : "#7A8075";
  const label = scoreLabel(score);
  const scoreColor =
    label === "hot" ? colors.primary :
    label === "warm" ? colors.primaryHover :
    colors.warmAccent;

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name[0]}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={[styles.name, { color: textColor }]}>{name}</Text>
          <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}20` }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>{label} · {score}</Text>
          </View>
        </View>
        <Text style={[styles.company, { color: muted }]}>{company}</Text>
        <Text style={[styles.preview, { color: muted }]} numberOfLines={1}>
          {preview}
        </Text>
        <Text style={[styles.time, { color: muted }]}>{time}</Text>
      </View>
    </View>
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#265834",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  info: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  name: { fontSize: 15, fontWeight: "600" },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scoreText: { fontSize: 11, fontWeight: "600" },
  company: { fontSize: 12, marginBottom: 4 },
  preview: { fontSize: 13 },
  time: { fontSize: 11, marginTop: 4 },
});
