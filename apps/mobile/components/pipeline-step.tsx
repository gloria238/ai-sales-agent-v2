import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSalesTheme } from "../hooks/use-theme";

interface PipelineStepProps {
  step: number;
  label: string;
  description: string;
  isActive: boolean;
  isDone: boolean;
}

/** A single pipeline step — used in Playground, KB Upload Timeline, System Overview */
export function PipelineStep({ step, label, description, isActive, isDone }: PipelineStepProps) {
  const theme = useSalesTheme();

  const dotColor = isDone || isActive ? "#265834" : theme.borderColor;
  const bgColor = isActive
    ? theme.iconBg
    : isDone
    ? theme.accentBg
    : "transparent";

  return (
    <View style={[styles.row, { backgroundColor: bgColor }]}>
      <View style={[styles.dot, { backgroundColor: dotColor, borderColor: dotColor }]}>
        {isDone ? (
          <Ionicons name="checkmark" size={12} color="#FFF" />
        ) : isActive ? (
          <View style={styles.spinner}>
            <Text style={styles.spinnerText}>⋯</Text>
          </View>
        ) : (
          <Text style={styles.number}>{step}</Text>
        )}
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: isActive || isDone ? theme.textColor : theme.muted }]}>
          {label}
        </Text>
        <Text style={[styles.description, { color: theme.muted }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  number: {
    color: "#7A8075",
    fontSize: 11,
    fontWeight: "700",
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
  },
});
