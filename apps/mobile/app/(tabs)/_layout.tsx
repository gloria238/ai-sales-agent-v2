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
        tabBarActiveTintColor: isDark ? "#579360" : "#265834",
        tabBarInactiveTintColor: isDark ? "#66775E" : "#8A9080",
        tabBarStyle: {
          backgroundColor: isDark ? colors.darkBg : "#F5F4F0",
          borderTopColor: isDark ? "#2A3D28" : "#D8D6CF",
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
          backgroundColor: isDark ? colors.darkBg : "#F5F4F0",
        },
        headerTintColor: isDark ? "#E8EBE6" : "#1F2B1D",
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
