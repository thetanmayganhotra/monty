import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../design/components/Button";
import { Card, ScreenContainer } from "../design/components/Card";
import { ScreenHeader } from "../design/components/ScreenHeader";
import { TrendChart } from "../design/components/TrendChart";
import { colors, radii, space, type } from "../design/theme";
import { saveProfile } from "../storage/profileRepository";
import { addMeasurement, getMeasurementsSorted } from "../storage/measurementRepository";
import type { BodyMeasurement, UserProfile } from "../storage/types";
import { generateId } from "../util/id";

export default function BodyMeasurementsScreen({
  profile,
  onProfileUpdate,
  onBack,
}: {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onBack: () => void;
}) {
  const [history, setHistory] = useState<BodyMeasurement[]>([]);
  const [weight, setWeight] = useState(profile.bodyWeightKg ? String(profile.bodyWeightKg) : "");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [arm, setArm] = useState("");

  const loadHistory = () => getMeasurementsSorted().then(setHistory);

  useEffect(() => {
    loadHistory();
  }, []);

  const save = async () => {
    const weightKg = weight ? Number(weight) : undefined;
    const measurement: BodyMeasurement = {
      id: generateId(),
      dateISO: new Date().toISOString(),
      weightKg,
      waistCm: waist ? Number(waist) : undefined,
      chestCm: chest ? Number(chest) : undefined,
      armCm: arm ? Number(arm) : undefined,
    };
    await addMeasurement(measurement);

    if (weightKg && weightKg !== profile.bodyWeightKg) {
      const updated = { ...profile, bodyWeightKg: weightKg };
      await saveProfile(updated);
      onProfileUpdate(updated);
    }

    setWaist("");
    setChest("");
    setArm("");
    loadHistory();
  };

  const weightPoints = history
    .filter((m) => m.weightKg !== undefined)
    .slice(-8)
    .map((m) => ({ label: m.dateISO.slice(5, 10), value: m.weightKg! }));

  return (
    <ScreenContainer style={{ paddingTop: 64 }}>
      <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: space(4) }}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <ScreenHeader eyebrow="Body" title="Measurements" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Weight (kg)</Text>
          <TrendChart points={weightPoints} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionLabel}>Log today</Text>
          <View style={styles.row}>
            <Field label="Weight (kg)" value={weight} onChangeText={setWeight} />
            <Field label="Waist (cm)" value={waist} onChangeText={setWaist} />
          </View>
          <View style={styles.row}>
            <Field label="Chest (cm)" value={chest} onChangeText={setChest} />
            <Field label="Arm (cm)" value={arm} onChangeText={setArm} />
          </View>
          <Button label="Save" onPress={save} style={{ marginTop: space(4) }} />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  back: { ...type.bodyMedium, color: colors.textSecondary },
  card: { marginBottom: space(4) },
  formCard: { marginBottom: space(8), gap: space(3) },
  sectionLabel: { ...type.label, color: colors.textTertiary, textTransform: "uppercase", marginBottom: space(3) },
  row: { flexDirection: "row", gap: space(3) },
  fieldLabel: { ...type.caption, color: colors.textSecondary, marginBottom: space(1.5) },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    paddingVertical: space(2.5),
    paddingHorizontal: space(3),
    color: colors.textPrimary,
    ...type.body,
  },
});
