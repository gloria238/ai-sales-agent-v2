import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { colors } from "@salesagent/ui-tokens";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? "#4ADE80" : "#166534",
        tabBarInactiveTintColor: isDark ? "#5C6E55" : "#94A3B8",
        tabBarStyle: {
          backgroundColor: isDark ? colors.darkBg : "#F8F9FA",
          borderTopColor: isDark ? "#1A2814" : "#CBD5E1",
          borderTopWidth: 0.5,
          paddingTop: 8,
          paddingBottom: 10,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: isDark ? colors.darkBg : "#F8F9FA",
        },
        headerTintColor: isDark ? "#F1F5F9" : "#0F172A",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="kb"
        options={{
          title: "Knowledge Base",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
