import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radii, space, type } from "../theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = "primary", disabled, fullWidth = true, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        fullWidth && { alignSelf: "stretch" },
        pressed && !disabled && { opacity: 0.85, transform: [{ scale: 0.985 }] },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[styles.label, textVariantStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

/** Small round icon/command button — used for in-workout controls. */
export function IconChip({ label, onPress, active }: { label: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: colors.primary, borderColor: colors.primary },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.chipLabel, active && { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: space(4),
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { ...type.h2, fontSize: 16 },
  chip: {
    paddingVertical: space(2.5),
    paddingHorizontal: space(4),
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipLabel: { ...type.bodyMedium, color: colors.textSecondary, textTransform: "capitalize" },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderStrong },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: colors.danger },
};

const textVariantStyles: Record<Variant, { color: string }> = {
  primary: { color: colors.onPrimary },
  secondary: { color: colors.textPrimary },
  ghost: { color: colors.textSecondary },
  danger: { color: "#FFFFFF" },
};
