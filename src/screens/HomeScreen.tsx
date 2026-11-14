import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../design/components/Button";
import { Card, ScreenContainer } from "../design/components/Card";
import { ScreenHeader } from "../design/components/ScreenHeader";
import { VoiceIndicator } from "../design/components/VoiceIndicator";
import { colors, radii, space, type } from "../design/theme";
import { isGroqConfigured } from "../config/env";
import { languageToLocale } from "../i18n/locale";
import { getMontyLLM } from "../llm/getMontyLLM";
import { matchHomeVoiceCommand } from "../navigation/homeVoiceCommands";
import { generateTemplateFromOnboarding } from "../onboarding/templateGenerator";
import { generateDailyPlan, type DailyPlanResult } from "../planning/dailyPlanGenerator";
import {
  isVoiceAgentRunning,
  isVoiceAgentSupported,
  setActiveVoiceHandler,
  startVoiceAgent,
  stopVoiceAgent,
} from "../stt/voiceAgent";
import { getRecentSessions } from "../storage/sessionRepository";
import { getTodayHydration, logCup } from "../storage/hydrationRepository";
import type { HydrationDay, MoodSignal, UserProfile, WorkoutSessionRecord } from "../storage/types";
import type { WorkoutTemplate } from "../workout-engine/types";

interface HomeScreenProps {
  profile: UserProfile;
  moodSignal?: MoodSignal;
  onStartWorkout: (template: WorkoutTemplate) => void;
  onOpenMoodCheckIn: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenAnalytics: () => void;
  onOpenMeasurements: () => void;
}

export default function HomeScreen({
  profile,
  moodSignal,
  onStartWorkout,
  onOpenMoodCheckIn,
  onOpenHistory,
  onOpenSettings,
  onOpenAnalytics,
  onOpenMeasurements,
}: HomeScreenProps) {
  const [template, setTemplate] = useState<WorkoutTemplate>(() =>
    generateTemplateFromOnboarding(profile)
  );
  const [plan, setPlan] = useState<DailyPlanResult | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [recent, setRecent] = useState<WorkoutSessionRecord[]>([]);
  const [hydration, setHydration] = useState<HydrationDay | null>(null);
  const [voiceOn, setVoiceOn] = useState(isVoiceAgentRunning());
  const templateRef = useRef(template);

  useEffect(() => {
    templateRef.current = template;
  }, [template]);

  useEffect(() => {
    getRecentSessions(3).then(setRecent);
    getTodayHydration().then(setHydration);
  }, []);

  useEffect(() => {
    setActiveVoiceHandler((transcript) => {
      const command = matchHomeVoiceCommand(transcript);
      switch (command) {
        case "start_workout":
          onStartWorkout(templateRef.current);
          break;
        case "mood_checkin":
          onOpenMoodCheckIn();
          break;
        case "analytics":
          onOpenAnalytics();
          break;
        case "history":
          onOpenHistory();
          break;
        case "settings":
          onOpenSettings();
          break;
        case "measurements":
          onOpenMeasurements();
          break;
      }
    });
    return () => setActiveVoiceHandler(null);
  }, [onStartWorkout, onOpenMoodCheckIn, onOpenAnalytics, onOpenHistory, onOpenSettings, onOpenMeasurements]);

  const toggleVoiceAgent = () => {
    if (voiceOn) {
      stopVoiceAgent();
      setVoiceOn(false);
    } else {
      startVoiceAgent(languageToLocale(profile.language));
      setVoiceOn(true);
    }
  };

  const addCup = async () => setHydration(await logCup());

  const generateSmartPlan = async () => {
    const llm = getMontyLLM();
    if (!llm) return;
    setLoadingPlan(true);
    try {
      const result = await generateDailyPlan(profile, llm, moodSignal);
      setPlan(result);
      setTemplate(result.template);
    } finally {
      setLoadingPlan(false);
    }
  };

  const totalMinutesEstimate = Math.round(
    template.exercises.reduce((sum, e) => sum + e.sets * (30 + e.restSeconds), 0) / 60
  );

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <ScreenHeader eyebrow="Today" title="Ready, coach?" />
          <Pressable onPress={onOpenSettings} hitSlop={12}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        <View style={{ marginBottom: space(4) }}>
          <VoiceIndicator supported={isVoiceAgentSupported()} running={voiceOn} onPress={toggleVoiceAgent} />
        </View>

        {moodSignal && (
          <View style={styles.moodBadge}>
            <Text style={styles.moodBadgeText}>
              Mood: {moodSignal.mood} · Fatigue: {moodSignal.fatigue}
            </Text>
          </View>
        )}

        <Card style={styles.planCard}>
          <Text style={styles.planLabel}>{plan ? "Monty's plan" : "Today's session"}</Text>
          <Text style={styles.planName}>{template.name}</Text>
          {plan?.introCopy && <Text style={styles.introCopy}>{plan.introCopy}</Text>}

          <View style={styles.exerciseChips}>
            {template.exercises.map((e) => (
              <View key={e.id} style={styles.exerciseChip}>
                <Text style={styles.exerciseChipText}>{e.name}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.meta}>
            {template.exercises.length} exercises · ~{totalMinutesEstimate} min
          </Text>

          {plan?.requiresApproval && (
            <Text style={styles.approvalNote}>
              Review this one — Monty needs a few approved plans before generating fully on its own.
            </Text>
          )}
        </Card>

        {isGroqConfigured() && (
          <Pressable onPress={generateSmartPlan} style={styles.smartPlanLink} disabled={loadingPlan}>
            {loadingPlan ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.smartPlanText}>
                {plan ? "↻ Regenerate with progression" : "✦ Generate with Monty's progression"}
              </Text>
            )}
          </Pressable>
        )}

        <Button label="Start Workout" onPress={() => onStartWorkout(template)} style={styles.startButton} />

        <Pressable onPress={onOpenMoodCheckIn} style={styles.secondaryRow}>
          <Text style={styles.secondaryRowText}>How are you feeling today? →</Text>
        </Pressable>

        {hydration && (
          <Card style={styles.hydrationCard}>
            <View>
              <Text style={styles.hydrationLabel}>💧 Hydration</Text>
              <Text style={styles.hydrationValue}>
                {hydration.cupsLogged} / {hydration.targetCups} cups
              </Text>
            </View>
            <Pressable onPress={addCup} style={styles.hydrationButton}>
              <Text style={styles.hydrationButtonText}>+1</Text>
            </Pressable>
          </Card>
        )}

        <View style={styles.navRow}>
          <Pressable onPress={onOpenAnalytics} style={styles.navLink}>
            <Text style={styles.navLinkText}>📊 Analytics</Text>
          </Pressable>
          <Pressable onPress={onOpenMeasurements} style={styles.navLink}>
            <Text style={styles.navLinkText}>📏 Measurements</Text>
          </Pressable>
        </View>

        {recent.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionLabel}>Recent sessions</Text>
            {recent.map((s) => (
              <View key={s.id} style={styles.recentRow}>
                <Text style={styles.recentDate}>{s.dateISO.slice(0, 10)}</Text>
                <Text style={styles.recentTemplate}>{s.templateId.replaceAll("_", " ")}</Text>
              </View>
            ))}
            <Pressable onPress={onOpenHistory}>
              <Text style={styles.viewAll}>View all history →</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 64 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  settingsIcon: { fontSize: 22, color: colors.textSecondary, marginTop: space(1) },
  moodBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    paddingVertical: space(1.5),
    paddingHorizontal: space(3),
    marginBottom: space(4),
  },
  moodBadgeText: { ...type.caption, color: colors.textSecondary, textTransform: "capitalize" },
  planCard: { marginBottom: space(4) },
  planLabel: { ...type.label, color: colors.primary, textTransform: "uppercase", marginBottom: space(1) },
  planName: { ...type.h1, color: colors.textPrimary },
  introCopy: { ...type.body, color: colors.textSecondary, marginTop: space(2) },
  exerciseChips: { flexDirection: "row", flexWrap: "wrap", gap: space(2), marginTop: space(4) },
  exerciseChip: { backgroundColor: colors.surfaceElevated, borderRadius: radii.pill, paddingVertical: space(1.5), paddingHorizontal: space(3) },
  exerciseChipText: { ...type.caption, color: colors.textPrimary },
  meta: { ...type.caption, color: colors.textTertiary, marginTop: space(4) },
  approvalNote: { ...type.caption, color: colors.warning, marginTop: space(3) },
  smartPlanLink: { alignItems: "center", marginBottom: space(4), paddingVertical: space(1) },
  smartPlanText: { ...type.bodyMedium, color: colors.primary },
  startButton: { marginBottom: space(4) },
  secondaryRow: { alignItems: "center", marginBottom: space(6) },
  secondaryRowText: { ...type.bodyMedium, color: colors.textSecondary },
  hydrationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space(4),
  },
  hydrationLabel: { ...type.caption, color: colors.textSecondary },
  hydrationValue: { ...type.h2, color: colors.textPrimary, marginTop: space(1) },
  hydrationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  hydrationButtonText: { ...type.bodyMedium, color: colors.onPrimary, fontWeight: "700" },
  navRow: { flexDirection: "row", gap: space(3), marginBottom: space(8) },
  navLink: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space(3),
    alignItems: "center",
  },
  navLinkText: { ...type.bodyMedium, color: colors.textPrimary },
  recentSection: { marginBottom: space(8) },
  sectionLabel: { ...type.label, color: colors.textTertiary, textTransform: "uppercase", marginBottom: space(3) },
  recentRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: space(2), borderBottomWidth: 1, borderBottomColor: colors.border },
  recentDate: { ...type.caption, color: colors.textTertiary },
  recentTemplate: { ...type.caption, color: colors.textSecondary, textTransform: "capitalize" },
  viewAll: { ...type.caption, color: colors.primary, marginTop: space(3) },
});
