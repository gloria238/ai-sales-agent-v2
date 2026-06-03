import { View, Text, FlatList, StyleSheet, useColorScheme } from "react-native";
import { colors } from "@salesagent/ui-tokens/colors";
import { ConversationItem } from "../../components/conversation-item";

// Mock data for MVP — in production this comes from api-client
const MOCK_CONVERSATIONS = [
  { id: "1", name: "Alice Chen", company: "Acme Corp", preview: "I'd love to learn more about your pricing...", score: 85, time: "2m ago" },
  { id: "2", name: "Bob Martinez", company: "StartupXYZ", preview: "Can you send me the proposal?", score: 62, time: "15m ago" },
  { id: "3", name: "Carol Davis", company: "GlobalTech", preview: "Not interested at this time", score: 35, time: "1h ago" },
  { id: "4", name: "Dave Kim", company: "SaaS Co", preview: "Great demo! When can we start?", score: 91, time: "3h ago" },
];

export default function InboxScreen() {
  const isDark = useColorScheme() === "dark";
  const bg = isDark ? colors.darkBg : "#F5F4F0";
  const textColor = isDark ? "#E8EBE6" : "#1F2B1D";
  const muted = isDark ? "#888080" : "#7A8075";

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: textColor }]}>Inbox</Text>
      <Text style={[styles.subtitle, { color: muted }]}>
        AI-powered conversations
      </Text>

      <FlatList
        data={MOCK_CONVERSATIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConversationItem {...item} isDark={isDark} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  list: { gap: 8 },
});
