import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, ScreenContainer } from "../design/components/Card";
import { Pill } from "../design/components/Pill";
import { ScreenHeader } from "../design/components/ScreenHeader";
import { TrendChart } from "../design/components/TrendChart";
import { colors, radii, space, type } from "../design/theme";
import { isGroqConfigured } from "../config/env";
import { getExerciseTrend, totalCaloriesForSession } from "../analytics/exerciseTrends";
import { computeRecapStats } from "../analytics/recapGenerator";
import { computeEarnedBadges } from "../gamification/badges";
import { computeStreak } from "../gamification/streaks";
import { getMontyLLM } from "../llm/getMontyLLM";
import { generateRecapIntro } from "../llm/parsers/recapCopy";
import { getMoodLogsSorted } from "../storage/moodLogRepository";
import { getAllSessions } from "../storage/sessionRepository";
import type { MoodLogEntry, UserProfile, WorkoutSessionRecord } from "../storage/types";
import { EXERCISE_LIBRARY } from "../workout-engine/exerciseLibrary";

const FATIGUE_TO_NUMBER = { low: 1, medium: 2, high: 3 } as const;

export default function AnalyticsScreen({ profile, onBack }: { profile: UserProfile; onBack: () => void }) {
  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLogEntry[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [recapIntro, setRecapIntro] = useState<string | null>(null);
  const [loadingRecap, setLoadingRecap] = useState(false);

  useEffect(() => {
    getAllSessions().then(setSessions);
    getMoodLogsSorted().then(setMoodLogs);
  }, []);

  const exercisesLogged = useMemo(() => {
    const ids = new Set(sessions.flatMap((s) => s.sets.map((set) => set.exerciseId)));
    return EXERCISE_LIBRARY.filter((e) => ids.has(e.id));
  }, [sessions]);

  useEffect(() => {
    if (!selectedExerciseId && exercisesLogged.length > 0) {
      setSelectedExerciseId(exercisesLogged[0].id);
    }
  }, [exercisesLogged, selectedExerciseId]);

  const { currentStreak, longestStreak } = useMemo(() => computeStreak(sessions), [sessions]);
  const badges = useMemo(() => computeEarnedBadges(sessions), [sessions]);
  const weekStats = useMemo(() => computeRecapStats(sessions, 7, "This week"), [sessions]);

  const caloriePoints = useMemo(
    () =>
      sessions
        .filter((s) => s.completed)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
        .slice(-8)
        .map((s) => ({ label: s.dateISO.slice(5, 10), value: totalCaloriesForSession(s) })),
    [sessions]
  );

  const exerciseTrendPoints = useMemo(() => {
    if (!selectedExerciseId) return [];
    return getExerciseTrend(sessions, selectedExerciseId)
      .slice(-8)
      .map((p) => ({ label: p.dateISO.slice(5, 10), value: p.maxWeight ?? p.totalReps }));
  }, [sessions, selectedExerciseId]);

  const moodTrendPoints = useMemo(
    () =>
      moodLogs.slice(-8).map((m) => ({
        label: m.dateISO.slice(5, 10),
        value: FATIGUE_TO_NUMBER[m.signal.fatigue],
      })),
    [moodLogs]
  );

  const generateRecap = async () => {
    const llm = getMontyLLM();
    if (!llm) return;
    setLoadingRecap(true);
    try {
      setRecapIntro(await generateRecapIntro(llm, weekStats, profile.language));
    } finally {
      setLoadingRecap(false);
    }
  };

  return (
    <ScreenContainer style={{ paddingTop: 64 }}>
      <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: space(4) }}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <ScreenHeader eyebrow="Progress" title="Analytics" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.streakRow}>
            <View>
              <Text style={styles.streakValue}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
            <View>
              <Text style={styles.streakValue}>{longestStreak}</Text>
              <Text style={styles.streakLabel}>best streak</Text>
            </View>
            <View>
              <Text style={styles.streakValue}>{weekStats.workoutsCompleted}</Text>
              <Text style={styles.streakLabel}>this week</Text>
            </View>
          </View>
          {badges.length > 0 && (
            <View style={styles.badgeRow}>
              {badges.map((b) => (
                <View key={b.id} style={styles.badge}>
                  <Text style={styles.badgeText}>🏅 {b.label}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Weekly recap</Text>
          <Text style={styles.recapStats}>
            {weekStats.workoutsCompleted} workouts · {weekStats.totalSets} sets · ~{weekStats.totalCalories} kcal
          </Text>
          {isGroqConfigured() && (
            <>
              {recapIntro ? (
                <Text style={styles.recapIntro}>{recapIntro}</Text>
              ) : (
                <Pressable onPress={generateRecap} disabled={loadingRecap} style={{ marginTop: space(3) }}>
                  {loadingRecap ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.recapLink}>✦ Get Monty's recap</Text>
                  )}
                </Pressable>
              )}
            </>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Calories burnt / session</Text>
          <TrendChart points={caloriePoints} color={colors.rest} />
        </Card>

        {exercisesLogged.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Exercise progress</Text>
            <View style={styles.pillRow}>
              {exercisesLogged.map((e) => (
                <Pill key={e.id} label={e.name} active={selectedExerciseId === e.id} onPress={() => setSelectedExerciseId(e.id)} />
              ))}
            </View>
            <TrendChart points={exerciseTrendPoints} />
          </Card>
        )}

        {moodTrendPoints.length > 0 && (
          <Card style={[styles.card, { marginBottom: space(10) }]}>
            <Text style={styles.sectionLabel}>Fatigue trend</Text>
            <Text style={styles.caption}>1 = low, 2 = medium, 3 = high</Text>
            <TrendChart points={moodTrendPoints} color={colors.warning} />
          </Card>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { ...type.bodyMedium, color: colors.textSecondary },
  card: { marginBottom: space(4) },
  sectionLabel: { ...type.label, color: colors.textTertiary, textTransform: "uppercase", marginBottom: space(3) },
  caption: { ...type.caption, color: colors.textTertiary, marginBottom: space(2) },
  streakRow: { flexDirection: "row", justifyContent: "space-between" },
  streakValue: { ...type.display, fontSize: 32, color: colors.primary },
  streakLabel: { ...type.caption, color: colors.textSecondary, marginTop: space(1) },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: space(2), marginTop: space(4) },
  badge: { backgroundColor: colors.surfaceElevated, borderRadius: radii.pill, paddingVertical: space(1.5), paddingHorizontal: space(3) },
  badgeText: { ...type.caption, color: colors.textPrimary },
  recapStats: { ...type.bodyMedium, color: colors.textPrimary },
  recapIntro: { ...type.body, color: colors.textSecondary, marginTop: space(3) },
  recapLink: { ...type.bodyMedium, color: colors.primary },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: space(2), marginBottom: space(4) },
});
