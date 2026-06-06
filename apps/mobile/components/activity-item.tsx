import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";
import { activityIcon } from "../data/mock-dashboard";

interface ActivityItemProps {
  type: "booking" | "message" | "document" | "ai";
  description: string;
  memberName?: string;
  time: string;
}

export function ActivityItem({ type, description, memberName, time }: ActivityItemProps) {
  const theme = useSalesTheme();
  const icon = activityIcon(type);

  return (
    <View style={[styles.row, { borderBottomColor: theme.borderColor }]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.iconBg }]}>
        <Ionicons name={icon} size={16} color={theme.isDark ? "#579360" : "#265834"} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.description, { color: theme.textColor }]}>
          {memberName ? (
            <>
              <Text style={styles.name}>{memberName}</Text>
              {" — "}
            </>
          ) : null}
          {description}
        </Text>
        <Text style={[styles.time, { color: theme.muted }]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
  },
  name: {
    fontWeight: "600",
  },
  time: {
    fontSize: 12,
    marginTop: 2,
  },
});
