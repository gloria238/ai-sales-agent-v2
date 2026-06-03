import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors } from "@salesagent/ui-tokens/colors";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isDark = useColorScheme() === "dark";

  const bg = isDark ? colors.darkBg : "#F5F4F0";
  const cardBg = isDark ? "#263324" : "#E8E6DF";
  const textColor = isDark ? "#E8EBE6" : "#1F2B1D";
  const muted = isDark ? "#888080" : "#7A8075";
  const borderColor = isDark ? "#3A4A36" : "#C8C6B9";

  const handleLogin = () => {
    // TODO: Use api-client for real auth
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={[styles.brand, { color: colors.primary }]}>SalesAgent</Text>
        <Text style={[styles.title, { color: textColor }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          Sign in to your workspace
        </Text>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            placeholder="Email"
            placeholderTextColor={muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            placeholder="Password"
            placeholderTextColor={muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: 24 },
  brand: { fontSize: 18, fontWeight: "700", marginBottom: 24, textAlign: "center" },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 32 },
  card: { borderRadius: 16, padding: 20, borderWidth: 1 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
