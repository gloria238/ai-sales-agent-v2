import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../../../hooks/use-theme";
import { MessageBubble } from "../../../components/message-bubble";
import { MOCK_CONVERSATIONS } from "../../../data";

export default function InboxDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useSalesTheme();

  const conversation = MOCK_CONVERSATIONS.find((c) => c.id === id);

  // Show skeleton-style placeholder while params resolve
  if (!id) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <View style={[styles.headerPlaceholder, { backgroundColor: theme.cardBg }]} />
        </View>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={[styles.name, { color: theme.textColor }]}>Conversation</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.iconBg }]}>
            <Ionicons name="chatbubble-ellipses" size={36} color={theme.muted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textColor }]}>No message selected</Text>
          <Text style={[styles.emptyDesc, { color: theme.muted }]}>
            Choose a conversation from the list to view AI-powered messages and source citations.
          </Text>
          <TouchableOpacity
            style={[styles.backToListBtn, { borderColor: theme.borderColor }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backToListText, { color: theme.secondaryText }]}>Back to Inbox</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerTop}>
            <Text style={[styles.name, { color: theme.textColor }]}>{conversation.name}</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: theme.accentBg }]}>
              <Ionicons name="sparkles" size={11} color={theme.isDark ? "#4ADE80" : "#166534"} />
              <Text style={[styles.confidenceText, { color: theme.isDark ? "#4ADE80" : "#166534" }]}>
                {conversation.confidence}%
              </Text>
            </View>
          </View>
          <Text style={[styles.club, { color: theme.muted }]}>{conversation.club}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={conversation.messages}
        keyExtractor={(msg) => msg.id}
        renderItem={({ item }) => (
          <MessageBubble
            content={item.content}
            direction={item.direction}
            isAI={item.isAI}
            timestamp={item.timestamp}
            sources={item.sources}
          />
        )}
        contentContainerStyle={styles.messageList}
      />

      {/* Compose bar (visual only — demo) */}
      <View style={[styles.compose, { backgroundColor: theme.cardBg, borderTopColor: theme.borderColor }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.bg, color: theme.textColor, borderColor: theme.borderColor }]}
          placeholder="Type a message..."
          placeholderTextColor={theme.muted}
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: "#166534" }]}>
          <Ionicons name="send" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerPlaceholder: {
    flex: 1,
    height: 20,
    borderRadius: 10,
    opacity: 0.5,
  },
  backBtn: {
    paddingRight: 12,
  },
  headerInfo: { flex: 1 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  name: { fontSize: 18, fontWeight: "700" },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  confidenceText: { fontSize: 12, fontWeight: "700" },
  club: { fontSize: 13 },
  messageList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  compose: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  backToListBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  backToListText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
