import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, space, type } from "../theme";

/**
 * Persistent ambient status — not a push-to-talk button. Tap to enable
 * (first-time mic permission grant) or mute/resume once running.
 */
export function VoiceIndicator({
  supported,
  running,
  onPress,
}: {
  supported: boolean;
  running: boolean;
  onPress: () => void;
}) {
  if (!supported) return null;

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={[styles.dot, running && styles.dotActive]} />
      <Text style={styles.label}>{running ? "Listening" : "Tap to enable voice"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    paddingVertical: space(1.5),
    paddingHorizontal: space(3),
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textTertiary },
  dotActive: { backgroundColor: colors.danger },
  label: { ...type.caption, color: colors.textSecondary },
});
