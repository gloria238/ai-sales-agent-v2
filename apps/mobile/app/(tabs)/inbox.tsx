import { View, Text, FlatList, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSalesTheme } from "../../hooks/use-theme";
import { ConversationItem } from "../../components/conversation-item";
import { EmptyState } from "../../components/empty-state";
import { MOCK_CONVERSATIONS } from "../../data";

export default function InboxScreen() {
  const theme = useSalesTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textColor }]}>Inbox</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          AI Concierge handling conversations
        </Text>
      </View>

      <FlatList
        data={MOCK_CONVERSATIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            name={item.name}
            club={item.club}
            preview={item.preview}
            confidence={item.confidence}
            time={item.time}
            onPress={() => router.push(`/(tabs)/inbox/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles"
            title="No conversations yet"
            description="AI Concierge will handle incoming messages automatically"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 2 },
  subtitle: { fontSize: 14 },
  list: { paddingHorizontal: 24, paddingBottom: 24 },
});
