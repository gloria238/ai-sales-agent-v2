import { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";

interface ConversationItemProps {
  name: string;
  club: string;
  preview: string;
  confidence: number;
  time: string;
  seed?: string;
  onPress: () => void;
}

function pravatarUrl(seed: string, size = 100): string {
  return `https://i.pravatar.cc/${size}?u=${encodeURIComponent(seed)}`;
}

function confidenceColor(pct: number, isDark: boolean): string {
  if (pct >= 85) return isDark ? "#4ADE80" : "#166534";
  if (pct >= 70) return "#849b70";
  return isDark ? "#888080" : "#94A3B8";
}

export function ConversationItem({
  name,
  club,
  preview,
  confidence,
  time,
  seed,
  onPress,
}: ConversationItemProps) {
  const theme = useSalesTheme();
  const pctColor = confidenceColor(confidence, theme.isDark);
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBg }, theme.shadowLight]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: theme.iconBg }]}>
        {imgError ? (
          <Text style={[styles.avatarText, { color: theme.successColor }]}>{name[0]}</Text>
        ) : (
          <Image
            source={{ uri: pravatarUrl(seed || name, 100) }}
            style={styles.avatarImg}
            onError={() => setImgError(true)}
          />
        )}
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
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarText: {
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
