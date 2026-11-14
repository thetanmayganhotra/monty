import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../design/components/Button";
import { ScreenContainer } from "../design/components/Card";
import { Pill } from "../design/components/Pill";
import { ScreenHeader } from "../design/components/ScreenHeader";
import { colors, space, type } from "../design/theme";
import {
  COACHING_STYLE_OPTIONS,
  DURATION_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  FREQUENCY_OPTIONS,
  GOAL_OPTIONS,
  LANGUAGE_OPTIONS,
  type OnboardingAnswers,
} from "../onboarding/types";

interface StepConfig {
  key: keyof OnboardingAnswers;
  question: string;
  options: { value: string | number; label: string }[];
}

const STEPS: StepConfig[] = [
  { key: "goal", question: "What's your main goal?", options: GOAL_OPTIONS },
  { key: "experience", question: "How experienced are you?", options: EXPERIENCE_OPTIONS },
  { key: "equipment", question: "What have you got to train with?", options: EQUIPMENT_OPTIONS },
  { key: "sessionDurationMinutes", question: "How long per session?", options: DURATION_OPTIONS.map((m) => ({ value: m, label: `${m} min` })) },
  { key: "frequencyPerWeek", question: "How many days a week?", options: FREQUENCY_OPTIONS.map((f) => ({ value: f, label: `${f}x / week` })) },
  { key: "coachingStyle", question: "How much should Monty talk?", options: COACHING_STYLE_OPTIONS },
  { key: "language", question: "English or Hinglish?", options: LANGUAGE_OPTIONS },
];

export default function OnboardingScreen({ onComplete }: { onComplete: (answers: OnboardingAnswers) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});

  const step = STEPS[stepIndex];
  const selected = answers[step.key];
  const isLast = stepIndex === STEPS.length - 1;

  const select = (value: string | number) => {
    setAnswers((prev) => ({ ...prev, [step.key]: value }));
  };

  const next = () => {
    if (isLast) {
      onComplete(answers as OnboardingAnswers);
      return;
    }
    setStepIndex((i) => i + 1);
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
        ))}
      </View>

      <ScreenHeader eyebrow={`Step ${stepIndex + 1} of ${STEPS.length}`} title={step.question} />

      <View style={styles.options}>
        {step.options.map((opt) => (
          <Pill key={String(opt.value)} label={opt.label} active={selected === opt.value} onPress={() => select(opt.value)} />
        ))}
      </View>

      <View style={styles.footer}>
        {stepIndex > 0 && (
          <Text style={styles.back} onPress={() => setStepIndex((i) => i - 1)}>
            Back
          </Text>
        )}
        <Button label={isLast ? "Let's go" : "Continue"} onPress={next} disabled={selected === undefined} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 72, paddingBottom: 32, justifyContent: "space-between" },
  progressRow: { flexDirection: "row", gap: space(1.5), marginBottom: space(8) },
  dot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  options: { flexDirection: "row", flexWrap: "wrap", gap: space(2.5) },
  footer: { marginTop: "auto", gap: space(3) },
  back: { ...type.bodyMedium, color: colors.textSecondary, textAlign: "center" },
});
