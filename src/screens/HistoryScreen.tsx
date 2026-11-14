import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, ScreenContainer } from "../design/components/Card";
import { ScreenHeader } from "../design/components/ScreenHeader";
import { colors, space, type } from "../design/theme";
import { getAllSessions } from "../storage/sessionRepository";
import type { WorkoutSessionRecord } from "../storage/types";

export default function HistoryScreen({ onBack }: { onBack: () => void }) {
  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([]);

  useEffect(() => {
    getAllSessions().then((all) => setSessions(all.sort((a, b) => b.dateISO.localeCompare(a.dateISO))));
  }, []);

  return (
    <ScreenContainer style={{ paddingTop: 64 }}>
      <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: space(4) }}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <ScreenHeader eyebrow="Progress" title="History" />

      {sessions.length === 0 ? (
        <Text style={styles.empty}>No sessions logged yet. Finish a workout to see it here.</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {sessions.map((session) => {
            const failures = session.sets.filter((s) => s.failure).length;
            return (
              <Card key={session.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.template}>{session.templateId.replaceAll("_", " ")}</Text>
                  <Text style={styles.date}>{new Date(session.dateISO).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.meta}>
                  {session.sets.length} {session.sets.length === 1 ? "set" : "sets"} logged
                  {failures > 0 ? ` · ${failures} missed` : ""}
                </Text>
                {session.moodSignal && (
                  <Text style={styles.mood}>
                    Mood: {session.moodSignal.mood} · Fatigue: {session.moodSignal.fatigue}
                  </Text>
                )}
              </Card>
            );
          })}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { ...type.bodyMedium, color: colors.textSecondary },
  empty: { ...type.body, color: colors.textTertiary, marginTop: space(8) },
  card: { marginBottom: space(3) },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  template: { ...type.h2, color: colors.textPrimary, textTransform: "capitalize" },
  date: { ...type.caption, color: colors.textTertiary },
  meta: { ...type.caption, color: colors.textSecondary, marginTop: space(2) },
  mood: { ...type.caption, color: colors.primary, marginTop: space(1), textTransform: "capitalize" },
});
