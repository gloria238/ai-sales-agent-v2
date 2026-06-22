import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";
import { SourceCitation } from "./source-citation";
import type { Source } from "../data/mock-inbox";

interface MessageBubbleProps {
  content: string;
  direction: "inbound" | "outbound";
  isAI: boolean;
  timestamp: string;
  sources?: Source[];
}

export function MessageBubble({ content, direction, isAI, timestamp, sources }: MessageBubbleProps) {
  const theme = useSalesTheme();
  const isInbound = direction === "inbound";

  return (
    <View style={[styles.wrapper, isInbound ? styles.wrapperLeft : styles.wrapperRight]}>
      <View
        style={[
          styles.bubble,
          isInbound
            ? [styles.inbound, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]
            : [styles.outbound, { backgroundColor: "#166534" }],
          isInbound ? styles.bubbleLeft : styles.bubbleRight,
        ]}
      >
        {isAI && (
          <View style={styles.aiLabel}>
            <Ionicons name="sparkles" size={11} color={isInbound ? "#166534" : "rgba(255,255,255,0.8)"} />
            <Text style={[styles.aiText, { color: isInbound ? "#166534" : "rgba(255,255,255,0.7)" }]}>
              AI Concierge
            </Text>
          </View>
        )}
        <Text
          style={[
            styles.content,
            { color: isInbound ? theme.textColor : "#FFFFFF" },
          ]}
        >
          {content}
        </Text>
        <Text
          style={[
            styles.timestamp,
            { color: isInbound ? theme.muted : "rgba(255,255,255,0.5)" },
          ]}
        >
          {timestamp}
        </Text>
      </View>
      {sources && sources.length > 0 && (
        <SourceCitation sources={sources} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    paddingHorizontal: 16,
    maxWidth: "85%",
  },
  wrapperLeft: {
    alignSelf: "flex-start",
  },
  wrapperRight: {
    alignSelf: "flex-end",
  },
  bubble: {
    borderRadius: 20,
    padding: 14,
  },
  bubbleLeft: {
    borderTopLeftRadius: 6,
    borderWidth: 1,
  },
  bubbleRight: {
    borderTopRightRadius: 6,
  },
  inbound: {},
  outbound: {},
  aiLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  aiText: {
    fontSize: 10,
    fontWeight: "600",
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    textAlign: "right",
  },
});
