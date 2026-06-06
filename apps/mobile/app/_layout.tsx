import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { colors } from "@salesagent/ui-tokens";
import { DemoModeProvider } from "../hooks/use-demo-mode";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <DemoModeProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? colors.darkBg : "#F5F4F0",
          },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="playground"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="system"
          options={{ headerShown: false, presentation: "card" }}
        />
      </Stack>
    </DemoModeProvider>
  );
}
