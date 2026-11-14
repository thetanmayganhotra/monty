import { StyleSheet, Text, View } from "react-native";
import { colors, radii, space, type } from "../theme";

const CHART_HEIGHT = 100;

export interface TrendPoint {
  label: string;
  value: number;
}

/** Minimal bar chart built from Views — no charting library dependency. */
export function TrendChart({ points, color = colors.primary }: { points: TrendPoint[]; color?: string }) {
  if (points.length === 0) {
    return <Text style={styles.empty}>Not enough data yet.</Text>;
  }

  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <View style={styles.wrap}>
      {points.map((p, i) => (
        <View key={i} style={styles.barColumn}>
          <View
            style={[
              styles.bar,
              { height: Math.max(4, (p.value / max) * CHART_HEIGHT), backgroundColor: color },
            ]}
          />
          <Text style={styles.value}>{p.value}</Text>
          <Text style={styles.label}>{p.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: CHART_HEIGHT + 44,
    gap: space(2),
  },
  barColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "60%", borderRadius: radii.sm, minHeight: 4 },
  value: { ...type.caption, color: colors.textPrimary, marginTop: space(1.5) },
  label: { ...type.caption, fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  empty: { ...type.caption, color: colors.textTertiary },
});
