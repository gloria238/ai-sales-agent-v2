import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { colors } from "@salesagent/ui-tokens/colors";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? "#888080" : "#7A8075",
        tabBarStyle: {
          backgroundColor: isDark ? colors.darkBg : "#F5F4F0",
          borderTopColor: isDark ? "#3A4A36" : "#C8C6B9",
        },
        headerStyle: {
          backgroundColor: isDark ? colors.darkBg : "#F5F4F0",
        },
        headerTintColor: isDark ? "#E8EBE6" : "#1F2B1D",
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
    </Tabs>
  );
}
