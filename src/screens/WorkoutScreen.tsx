import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { isGroqConfigured } from "../config/env";
import { estimateCaloriesForSet } from "../analytics/calorieEstimator";
import { languageToLocale } from "../i18n/locale";
import { getMontyLLM } from "../llm/getMontyLLM";
import { parseWorkoutLog } from "../llm/parsers/logParser";
import { NoopMusicProvider } from "../music/providers/noopProvider";
import { createMusicEventHandler } from "../music/musicController";
import {
  isVoiceAgentRunning,
  isVoiceAgentSupported,
  setActiveVoiceHandler,
  startVoiceAgent,
  stopVoiceAgent,
} from "../stt/voiceAgent";
import type { UserProfile, WorkoutSessionRecord, SetLogEntry } from "../storage/types";
import { speak, stopSpeaking } from "../tts/speak";
import { generateId } from "../util/id";
import { WorkoutEngine } from "../workout-engine/stateMachine";
import type { EngineEvent, VerbosityLevel, VoiceCommand } from "../workout-engine/types";
import { phraseFor } from "../workout-engine/verbosity";
import { matchVoiceCommand } from "../workout-engine/voiceCommands";
import { colors, radii, space, type } from "../design/theme";
import { Button, IconChip } from "../design/components/Button";
import { Pill } from "../design/components/Pill";
import { VoiceIndicator } from "../design/components/VoiceIndicator";

const VERBOSITY_LEVELS: VerbosityLevel[] = ["silent", "minimal", "coach", "hype"];
const COMMANDS: VoiceCommand[] = ["next", "rest", "repeat", "end_workout"];
const COMMAND_LABELS: Record<VoiceCommand, string> = {
  next: "Next",
  rest: "Rest",
  repeat: "Repeat",
  end_workout: "End",
  unknown: "?",
};

export default function WorkoutScreen({
  profile,
  template,
  onFinish,
  onExit,
}: {
  profile: UserProfile;
  template: import("../workout-engine/types").WorkoutTemplate;
  onFinish: (session: WorkoutSessionRecord) => void;
  onExit: () => void;
}) {
  const [verbosity, setVerbosity] = useState<VerbosityLevel>(profile.coachingStyle);
  const [phase, setPhase] = useState<"idle" | "active" | "resting" | "done">("idle");
  const [caption, setCaption] = useState<string>("");
  const [currentExerciseName, setCurrentExerciseName] = useState<string>(template.exercises[0]?.name ?? "");
  const [setInfo, setSetInfo] = useState<{ setNumber: number; totalSets: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState<number>(0);
  const [awaitingLog, setAwaitingLog] = useState(false);
  const [logText, setLogText] = useState("");
  const [logStatus, setLogStatus] = useState<"idle" | "parsing" | "safety" | "error">("idle");
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(isVoiceAgentRunning());

  const engineRef = useRef<WorkoutEngine | null>(null);
  const setLogsRef = useRef<SetLogEntry[]>([]);
  const pendingExerciseIdRef = useRef<string>(template.exercises[0]?.id ?? "");
  const pendingSetNumberRef = useRef<number>(1);
  const awaitingLogRef = useRef(false);
  const musicHandler = useMemo(() => createMusicEventHandler(new NoopMusicProvider()), []);

  const finishSession = () => {
    const session: WorkoutSessionRecord = {
      id: generateId(),
      templateId: template.id,
      dateISO: new Date().toISOString(),
      sets: setLogsRef.current,
      completed: true,
    };
    onFinish(session);
  };

  const handleEvent = (event: EngineEvent) => {
    musicHandler(event);
    const phrase = phraseFor(event, verbosityRef.current, profile.language);
    if (phrase) {
      setCaption(phrase);
      speak(phrase, profile.language);
    }

    switch (event.type) {
      case "exercise_announce":
        if (event.exercise) {
          setCurrentExerciseName(event.exercise.name);
          pendingExerciseIdRef.current = event.exercise.id;
        }
        break;
      case "set_start":
        setPhase("active");
        setAwaitingLog(false);
        if (event.setNumber && event.totalSets) {
          setSetInfo({ setNumber: event.setNumber, totalSets: event.totalSets });
          pendingSetNumberRef.current = event.setNumber;
        }
        break;
      case "set_complete":
        setAwaitingLog(isGroqConfigured());
        break;
      case "rest_start":
        setPhase("resting");
        setSecondsLeft(event.secondsRemaining ?? 0);
        setRestTotal(event.secondsRemaining ?? 0);
        break;
      case "rest_complete":
        setSecondsLeft(null);
        break;
      case "workout_complete":
        setPhase("done");
        setSecondsLeft(null);
        break;
    }
  };

  const verbosityRef = useRef(verbosity);
  useEffect(() => {
    verbosityRef.current = verbosity;
  }, [verbosity]);

  useEffect(() => {
    awaitingLogRef.current = awaitingLog;
  }, [awaitingLog]);

  useEffect(() => {
    engineRef.current = new WorkoutEngine(template, verbosity, handleEvent);
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0 || phase !== "resting") return;
    const id = setInterval(() => {
      engineRef.current?.tick(1);
      setSecondsLeft((s) => (s !== null ? Math.max(0, s - 1) : s));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft, phase]);

  const sendCommand = (command: VoiceCommand) => engineRef.current?.handleCommand(command);

  const submitLog = async (overrideText?: string) => {
    const text = (overrideText ?? logText).trim();
    const llm = getMontyLLM();
    const exercise = template.exercises.find((e) => e.id === pendingExerciseIdRef.current);
    if (!llm || !exercise || !text) return;

    setLogStatus("parsing");
    setSafetyMessage(null);
    const result = await parseWorkoutLog(llm, text, profile.language);

    if (result.status === "safety_refusal") {
      setLogStatus("safety");
      setSafetyMessage(result.message);
      speak(result.message, profile.language);
      return;
    }
    if (result.status === "error") {
      setLogStatus("error");
      return;
    }

    const lastLoggedWeight = [...setLogsRef.current].reverse().find((s) => s.exerciseId === exercise.id)?.weight;
    const actualReps = result.data.reps ?? exercise.reps;
    setLogsRef.current = [
      ...setLogsRef.current,
      {
        exerciseId: exercise.id,
        setNumber: pendingSetNumberRef.current,
        weight: result.data.weight ?? lastLoggedWeight ?? exercise.targetWeight,
        weightUnit: result.data.unit ?? exercise.weightUnit,
        reps: actualReps,
        targetReps: exercise.reps,
        failure: result.data.failure,
        caloriesBurnt: estimateCaloriesForSet(exercise.kind, actualReps, profile.bodyWeightKg),
      },
    ];
    setLogStatus("idle");
    setLogText("");
    setAwaitingLog(false);
  };

  const handleVoiceInput = (transcript: string) => {
    const command = matchVoiceCommand(transcript);
    if (command !== "unknown") {
      sendCommand(command);
      return;
    }
    if (awaitingLogRef.current) {
      submitLog(transcript);
    }
  };

  useEffect(() => {
    setActiveVoiceHandler(handleVoiceInput);
    return () => setActiveVoiceHandler(null);
  }, []);

  const toggleVoiceAgent = () => {
    if (voiceOn) {
      stopVoiceAgent();
      setVoiceOn(false);
    } else {
      startVoiceAgent(languageToLocale(profile.language));
      setVoiceOn(true);
    }
  };

  if (phase === "idle") {
    return (
      <View style={styles.screen}>
        <Text style={styles.eyebrow}>{template.name}</Text>
        <Text style={styles.idleTitle}>{template.exercises.length} exercises today</Text>
        <View style={styles.exerciseList}>
          {template.exercises.map((e, i) => (
            <View key={e.id} style={styles.exerciseRow}>
              <Text style={styles.exerciseIndex}>{String(i + 1).padStart(2, "0")}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseRowName}>{e.name}</Text>
                <Text style={styles.exerciseRowMeta}>
                  {e.sets} × {e.reps}{e.targetWeight ? ` · ${e.targetWeight}${e.weightUnit}` : ""}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.idleFooter}>
          <View style={styles.verbosityRow}>
            {VERBOSITY_LEVELS.map((level) => (
              <Pill key={level} label={level} active={verbosity === level} onPress={() => setVerbosity(level)} />
            ))}
          </View>
          <Button label="Start Workout" onPress={() => engineRef.current?.start()} />
          <Pressable onPress={onExit} style={{ alignItems: "center" }}>
            <Text style={styles.exitLink}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === "done") {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.doneEmoji}>✓</Text>
        <Text style={styles.doneTitle}>Workout complete</Text>
        <Text style={styles.doneSubtitle}>
          {setLogsRef.current.length} {setLogsRef.current.length === 1 ? "set" : "sets"} logged
        </Text>
        <Button label="Back Home" onPress={finishSession} style={{ marginTop: space(8) }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.topBar}>
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={styles.exitIcon}>✕</Text>
        </Pressable>
        <Text style={styles.topBarExercise}>{currentExerciseName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.centerArea}>
        {phase === "resting" ? (
          <>
            <Text style={styles.restLabel}>REST</Text>
            <Text style={styles.timer}>{secondsLeft ?? 0}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${restTotal ? ((restTotal - (secondsLeft ?? 0)) / restTotal) * 100 : 0}%` },
                ]}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.setBig}>
              {setInfo ? `${setInfo.setNumber} / ${setInfo.totalSets}` : ""}
            </Text>
            <Text style={styles.setBigLabel}>SET</Text>
          </>
        )}
        {!!caption && <Text style={styles.caption}>{caption}</Text>}
      </View>

      <View style={styles.micRow}>
        <VoiceIndicator supported={isVoiceAgentSupported()} running={voiceOn} onPress={toggleVoiceAgent} />
      </View>

      {awaitingLog && (
        <View style={styles.logCard}>
          {logStatus === "safety" && safetyMessage ? (
            <Text style={styles.safetyText}>{safetyMessage}</Text>
          ) : (
            <>
              <Text style={styles.logPrompt}>How'd that set go?</Text>
              <View style={styles.logInputRow}>
                <TextInput
                  value={logText}
                  onChangeText={setLogText}
                  placeholder='"20 kilos, all reps" · "same as last time"'
                  placeholderTextColor={colors.textTertiary}
                  style={styles.logInput}
                  onSubmitEditing={() => submitLog()}
                  returnKeyType="done"
                />
                {logStatus === "parsing" ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Pressable onPress={() => submitLog()} style={styles.logSubmit}>
                    <Text style={styles.logSubmitText}>↵</Text>
                  </Pressable>
                )}
              </View>
              {logStatus === "error" && <Text style={styles.errorText}>Couldn't catch that — try again.</Text>}
              <Pressable onPress={() => setAwaitingLog(false)}>
                <Text style={styles.skipLog}>Skip logging this set</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      <View style={styles.commandBar}>
        {COMMANDS.map((cmd) => (
          <IconChip key={cmd} label={COMMAND_LABELS[cmd]} onPress={() => sendCommand(cmd)} />
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space(5), paddingTop: 64, paddingBottom: space(6) },
  center: { alignItems: "center", justifyContent: "center" },

  eyebrow: { ...type.label, color: colors.primary, textTransform: "uppercase" },
  idleTitle: { ...type.display, color: colors.textPrimary, marginTop: space(2), marginBottom: space(6) },
  exerciseList: { flex: 1 },
  exerciseRow: { flexDirection: "row", alignItems: "center", paddingVertical: space(3), borderBottomWidth: 1, borderBottomColor: colors.border },
  exerciseIndex: { ...type.h2, color: colors.textTertiary, width: 36 },
  exerciseRowName: { ...type.bodyMedium, color: colors.textPrimary },
  exerciseRowMeta: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  idleFooter: { gap: space(4) },
  verbosityRow: { flexDirection: "row", gap: space(2), justifyContent: "center" },
  exitLink: { ...type.body, color: colors.textTertiary },

  doneEmoji: { fontSize: 48, color: colors.primary },
  doneTitle: { ...type.h1, color: colors.textPrimary, marginTop: space(4) },
  doneSubtitle: { ...type.body, color: colors.textSecondary, marginTop: space(2) },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space(6) },
  exitIcon: { fontSize: 18, color: colors.textSecondary },
  topBarExercise: { ...type.bodyMedium, color: colors.textPrimary },

  centerArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  restLabel: { ...type.label, color: colors.rest, letterSpacing: 4 },
  timer: { ...type.mono, fontSize: 96, color: colors.textPrimary, marginVertical: space(4) },
  progressTrack: { width: 160, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: colors.rest },
  setBig: { ...type.mono, fontSize: 72, color: colors.primary },
  setBigLabel: { ...type.label, color: colors.textTertiary, letterSpacing: 4, marginTop: space(1) },
  caption: { ...type.body, color: colors.textSecondary, textAlign: "center", marginTop: space(8), paddingHorizontal: space(6) },

  logCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    marginBottom: space(4),
  },
  logPrompt: { ...type.bodyMedium, color: colors.textPrimary, marginBottom: space(3) },
  logInputRow: { flexDirection: "row", alignItems: "center", gap: space(2) },
  logInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    paddingVertical: space(2.5),
    paddingHorizontal: space(4),
    color: colors.textPrimary,
    ...type.body,
  },
  logSubmit: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logSubmitText: { color: colors.onPrimary, fontSize: 18, fontWeight: "700" },
  errorText: { ...type.caption, color: colors.danger, marginTop: space(2) },
  safetyText: { ...type.bodyMedium, color: colors.warning },
  skipLog: { ...type.caption, color: colors.textTertiary, marginTop: space(3), textAlign: "center" },

  commandBar: { flexDirection: "row", justifyContent: "center", gap: space(2.5), flexWrap: "wrap" },
  micRow: { alignItems: "center", marginBottom: space(4) },
});
