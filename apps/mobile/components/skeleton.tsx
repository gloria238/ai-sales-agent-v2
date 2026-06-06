import { View, StyleSheet } from "react-native";
import { useSalesTheme } from "../hooks/use-theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8 }: SkeletonProps) {
  const theme = useSalesTheme();
  return (
    <View
      style={[
        styles.base,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.isDark ? "#3A4A36" : "#D8D6CF",
        },
      ]}
    />
  );
}

/** KPI card skeleton — matches KpiCard dimensions */
export function KpiSkeleton() {
  const theme = useSalesTheme();
  return (
    <View style={[styles.kpiCard, { backgroundColor: theme.cardBg }, theme.shadowStyle]}>
      <Skeleton width={44} height={44} borderRadius={12} />
      <View style={styles.kpiText}>
        <Skeleton width={80} height={11} />
        <Skeleton width={60} height={22} borderRadius={6} />
      </View>
    </View>
  );
}

/** Conversation list item skeleton */
export function ConversationSkeleton() {
  const theme = useSalesTheme();
  return (
    <View style={[styles.convCard, { backgroundColor: theme.cardBg }]}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={styles.convText}>
        <Skeleton width={120} height={14} />
        <Skeleton width="80%" height={12} borderRadius={6} />
        <Skeleton width={60} height={10} borderRadius={6} />
      </View>
    </View>
  );
}

/** Document card skeleton */
export function DocumentSkeleton() {
  const theme = useSalesTheme();
  return (
    <View style={[styles.docCard, { backgroundColor: theme.cardBg }]}>
      <Skeleton width={28} height={36} borderRadius={6} />
      <View style={styles.docText}>
        <Skeleton width={160} height={14} />
        <Skeleton width={80} height={10} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { opacity: 0.5 },
  kpiCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 14,
    flex: 1,
    minWidth: "46%",
  },
  kpiText: { flex: 1, gap: 6 },
  convCard: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    alignItems: "center",
  },
  convText: { flex: 1, gap: 6 },
  docCard: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    alignItems: "center",
  },
  docText: { flex: 1, gap: 6 },
});
