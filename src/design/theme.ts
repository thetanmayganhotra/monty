/**
 * Monty design tokens — dark-first, high-contrast, minimal.
 * One accent (neon lime) for primary actions/energy, one for rest/calm
 * (coral), everything else restrained. Built for glanceable use: big
 * type, big tap targets, low visual noise (this is an audio-first app).
 */
export const colors = {
  bg: "#0A0A0F",
  surface: "#15151C",
  surfaceElevated: "#1E1E29",
  border: "#26262F",
  borderStrong: "#34343F",

  primary: "#D4FF3D",
  primaryPressed: "#BEEB29",
  onPrimary: "#0A0A0F",

  rest: "#7C9BFF",
  danger: "#FF4D6D",
  success: "#34D399",
  warning: "#FBBF24",

  textPrimary: "#F5F5F7",
  textSecondary: "#9A9AA6",
  textTertiary: "#5C5C68",
} as const;

export const radii = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 } as const;

export const space = (n: number) => n * 4;

export const type = {
  display: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
  h1: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  h2: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18, lineHeight: 24 },
  label: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 13, lineHeight: 16, letterSpacing: 0.4 },
  body: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: "Inter_500Medium", fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
  mono: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 56, letterSpacing: -1 },
} as const;

export const fontAssets = {
  SpaceGrotesk_700Bold: require("@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf"),
  SpaceGrotesk_600SemiBold: require("@expo-google-fonts/space-grotesk/600SemiBold/SpaceGrotesk_600SemiBold.ttf"),
  SpaceGrotesk_500Medium: require("@expo-google-fonts/space-grotesk/500Medium/SpaceGrotesk_500Medium.ttf"),
  Inter_400Regular: require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf"),
  Inter_500Medium: require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
  Inter_600SemiBold: require("@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf"),
};
