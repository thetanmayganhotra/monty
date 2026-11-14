import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radii, space } from "../theme";

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenContainer({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(5),
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space(5),
  },
});
