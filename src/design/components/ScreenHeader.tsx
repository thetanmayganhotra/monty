import { StyleSheet, Text, View } from "react-native";
import { colors, space, type } from "../theme";

export function ScreenHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space(6) },
  eyebrow: { ...type.label, color: colors.primary, marginBottom: space(1), textTransform: "uppercase" },
  title: { ...type.display, color: colors.textPrimary },
  subtitle: { ...type.body, color: colors.textSecondary, marginTop: space(2) },
});
