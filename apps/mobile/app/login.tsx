import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSalesTheme } from "../hooks/use-theme";
import { useDemoMode } from "../hooks/use-demo-mode";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const theme = useSalesTheme();
  const { apiBaseUrl, setMode } = useDemoMode();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const resp = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Login failed");
        return;
      }
      // Switch to live mode and navigate
      setMode("live");
      router.replace("/(tabs)");
    } catch {
      setError("Cannot connect to server. Enter demo mode instead.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setMode("demo");
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Brand */}
        <Text style={[styles.brand, { color: "#166534" }]}>Ringible</Text>
        <Text style={[styles.title, { color: theme.textColor }]}>AI Concierge Platform</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Multi-Tenant · Knowledge Base · RAG{'\n'}Web + Mobile · Background Workers
        </Text>

        {/* Login card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          {error ? (
            <Text style={[styles.errorText, { color: theme.dangerColor }]}>{error}</Text>
          ) : null}
          <TextInput
            style={[styles.input, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.bg }]}
            placeholder="Email"
            placeholderTextColor={theme.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.bg }]}
            placeholder="Password"
            placeholderTextColor={theme.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: loading ? "#849b70" : "#166534" }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.borderColor }]} />
            <Text style={[styles.dividerText, { color: theme.muted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.borderColor }]} />
          </View>

          {/* Demo Button */}
          <TouchableOpacity
            style={[styles.demoButton, { borderColor: "#166534" }]}
            onPress={handleDemoLogin}
          >
            <Text style={[styles.demoButtonText, { color: "#166534" }]}>Enter Demo →</Text>
          </TouchableOpacity>
          <Text style={[styles.demoHint, { color: theme.muted }]}>
            Explore Riverside Club · Elite Tennis · Westside Sports
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: 28 },
  brand: { fontSize: 20, fontWeight: "700", marginBottom: 16, textAlign: "center", letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: "center", marginBottom: 36, lineHeight: 20 },

  card: { borderRadius: 20, padding: 24, borderWidth: 1 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  signInButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  signInButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  errorText: { fontSize: 13, textAlign: "center", marginBottom: 12 },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12 },

  demoButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  demoButtonText: { fontSize: 16, fontWeight: "600" },
  demoHint: { fontSize: 11, textAlign: "center", marginTop: 8 },
});
