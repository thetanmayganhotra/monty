import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, ScreenContainer } from "../design/components/Card";
import { Pill } from "../design/components/Pill";
import { ScreenHeader } from "../design/components/ScreenHeader";
import { colors, space, type } from "../design/theme";
import { isFirebaseConfigured, isGroqConfigured } from "../config/env";
import {
  cancelHydrationReminders,
  requestNotificationPermission,
  scheduleHydrationReminders,
} from "../notifications/hydrationReminders";
import { COACHING_STYLE_OPTIONS, LANGUAGE_OPTIONS } from "../onboarding/types";
import { getJSON, setJSON } from "../storage/asyncStore";
import { saveProfile } from "../storage/profileRepository";
import type { UserProfile } from "../storage/types";

const HYDRATION_REMINDERS_KEY = "monty:hydrationRemindersOn";

export default function SettingsScreen({
  profile,
  onUpdate,
  onBack,
}: {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onBack: () => void;
}) {
  const [local, setLocal] = useState(profile);
  const [hydrationRemindersOn, setHydrationRemindersOn] = useState(false);

  useEffect(() => {
    getJSON<boolean>(HYDRATION_REMINDERS_KEY).then((v) => setHydrationRemindersOn(!!v));
  }, []);

  const update = async (patch: Partial<UserProfile>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    await saveProfile(next);
    onUpdate(next);
  };

  const toggleHydrationReminders = async () => {
    const next = !hydrationRemindersOn;
    if (next) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await scheduleHydrationReminders(2);
    } else {
      await cancelHydrationReminders();
    }
    setHydrationRemindersOn(next);
    await setJSON(HYDRATION_REMINDERS_KEY, next);
  };

  return (
    <ScreenContainer style={{ paddingTop: 64 }}>
      <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: space(4) }}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <ScreenHeader eyebrow="Settings" title="Tune Monty" />

      <Text style={styles.sectionLabel}>Coaching style</Text>
      <View style={styles.pillRow}>
        {COACHING_STYLE_OPTIONS.map((opt) => (
          <Pill key={opt.value} label={opt.label} active={local.coachingStyle === opt.value} onPress={() => update({ coachingStyle: opt.value })} />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Language</Text>
      <View style={styles.pillRow}>
        {LANGUAGE_OPTIONS.map((opt) => (
          <Pill key={opt.value} label={opt.label} active={local.language === opt.value} onPress={() => update({ language: opt.value })} />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Hydration reminders</Text>
      <View style={styles.pillRow}>
        <Pill label="On" active={hydrationRemindersOn} onPress={() => !hydrationRemindersOn && toggleHydrationReminders()} />
        <Pill label="Off" active={!hydrationRemindersOn} onPress={() => hydrationRemindersOn && toggleHydrationReminders()} />
      </View>

      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isGroqConfigured() ? colors.success : colors.textTertiary }]} />
          <Text style={styles.statusText}>Groq {isGroqConfigured() ? "connected" : "not configured"}</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isFirebaseConfigured() ? colors.success : colors.textTertiary }]} />
          <Text style={styles.statusText}>
            Firebase {isFirebaseConfigured() ? "connected" : "not configured (using on-device storage)"}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={styles.statusText}>Spotify not connected</Text>
        </View>
      </Card>

      <Text style={styles.approvedNote}>{local.approvedPlanCount} plans approved so far</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { ...type.bodyMedium, color: colors.textSecondary },
  sectionLabel: { ...type.label, color: colors.textTertiary, textTransform: "uppercase", marginTop: space(6), marginBottom: space(3) },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: space(2) },
  statusCard: { marginTop: space(8), gap: space(3) },
  statusRow: { flexDirection: "row", alignItems: "center", gap: space(2.5) },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...type.caption, color: colors.textSecondary },
  approvedNote: { ...type.caption, color: colors.textTertiary, marginTop: space(6), textAlign: "center" },
});
