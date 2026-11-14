import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, space, type } from "../theme";

export function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: space(2),
    paddingHorizontal: space(4),
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: { ...type.caption, ...type.bodyMedium, fontSize: 13, color: colors.textSecondary, textTransform: "capitalize" },
  labelActive: { color: colors.onPrimary },
});
