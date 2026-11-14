import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../design/components/Button";
import { VoiceIndicator } from "../design/components/VoiceIndicator";
import { colors, radii, space, type } from "../design/theme";
import { isGroqConfigured } from "../config/env";
import { languageToLocale } from "../i18n/locale";
import { getMontyLLM } from "../llm/getMontyLLM";
import { classifyMoodFromConversation, getMoodCheckInReply } from "../llm/parsers/moodCheckIn";
import type { ChatMessage } from "../llm/types";
import {
  isVoiceAgentRunning,
  isVoiceAgentSupported,
  setActiveVoiceHandler,
  startVoiceAgent,
  stopVoiceAgent,
} from "../stt/voiceAgent";
import { addMoodLog } from "../storage/moodLogRepository";
import type { Language, MoodSignal } from "../storage/types";
import { speak } from "../tts/speak";
import { generateId } from "../util/id";

const CHECK_IN_SECONDS = 5 * 60;
const OPENING_LINE: Record<Language, string> = {
  en: "Hey! How are you feeling today, before we get into it?",
  hinglish: "Hey! Aaj kaisa feel ho raha hai, workout se pehle?",
};

interface Turn {
  role: "assistant" | "user" | "safety";
  text: string;
}

export default function MoodCheckInScreen({
  language,
  onComplete,
  onSkip,
}: {
  language: Language;
  onComplete: (signal: MoodSignal) => void;
  onSkip: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([{ role: "assistant", text: OPENING_LINE[language] }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CHECK_IN_SECONDS);
  const [voiceOn, setVoiceOn] = useState(isVoiceAgentRunning());
  const conversationRef = useRef<ChatMessage[]>([{ role: "assistant", content: OPENING_LINE[language] }]);
  const scrollRef = useRef<ScrollView>(null);

  const llm = getMontyLLM();

  useEffect(() => {
    speak(OPENING_LINE[language], language);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      finish();
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    if (!llm) {
      const fallback: MoodSignal = { mood: "ok", fatigue: "medium" };
      await addMoodLog(generateId(), fallback);
      onComplete(fallback);
      return;
    }
    const signal = await classifyMoodFromConversation(llm, conversationRef.current);
    await addMoodLog(generateId(), signal);
    onComplete(signal);
  };

  const sendingRef = useRef(false);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    // Ref check (not the `sending` state) so this stays correct even
    // when called from the voice handler's closure, which is registered
    // once and would otherwise see a stale `sending` value.
    if (!text || !llm || sendingRef.current) return;
    sendingRef.current = true;
    setInput("");
    setTurns((t) => [...t, { role: "user", text }]);
    setSending(true);

    const result = await getMoodCheckInReply(llm, conversationRef.current, text, language);
    conversationRef.current = [...conversationRef.current, { role: "user", content: text }];

    if (result.status === "safety_refusal") {
      setTurns((t) => [...t, { role: "safety", text: result.message }]);
      speak(result.message, language);
      sendingRef.current = false;
      setSending(false);
      return;
    }

    conversationRef.current = [...conversationRef.current, { role: "assistant", content: result.message }];
    setTurns((t) => [...t, { role: "assistant", text: result.message }]);
    speak(result.message, language);
    sendingRef.current = false;
    setSending(false);
  };

  useEffect(() => {
    setActiveVoiceHandler((transcript) => send(transcript));
    return () => setActiveVoiceHandler(null);
  }, []);

  const toggleVoiceAgent = () => {
    if (voiceOn) {
      stopVoiceAgent();
      setVoiceOn(false);
    } else {
      startVoiceAgent(languageToLocale(language));
      setVoiceOn(true);
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  if (!isGroqConfigured()) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.notConfiguredText}>Mood check-in needs Groq connected.</Text>
        <Button label="Skip for now" onPress={onSkip} variant="secondary" style={{ marginTop: space(6) }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.topBar}>
        <Pressable onPress={onSkip} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
        <Text style={styles.timerText}>{mm}:{ss}</Text>
      </View>

      <View style={{ marginBottom: space(4) }}>
        <VoiceIndicator supported={isVoiceAgentSupported()} running={voiceOn} onPress={toggleVoiceAgent} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {turns.map((turn, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              turn.role === "user" && styles.bubbleUser,
              turn.role === "safety" && styles.bubbleSafety,
            ]}
          >
            <Text style={[styles.bubbleText, turn.role === "user" && styles.bubbleTextUser]}>{turn.text}</Text>
          </View>
        ))}
        {sending && <ActivityIndicator color={colors.primary} style={{ marginTop: space(2) }} />}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type how you're feeling..."
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          onSubmitEditing={() => send()}
          returnKeyType="send"
        />
        <Pressable onPress={() => send()} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>↵</Text>
        </Pressable>
      </View>

      <Button label={finishing ? "Wrapping up..." : "I'm ready — let's train"} onPress={finish} disabled={finishing} style={{ marginTop: space(4) }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space(5), paddingTop: 64, paddingBottom: space(6) },
  center: { alignItems: "center", justifyContent: "center" },
  notConfiguredText: { ...type.body, color: colors.textSecondary, textAlign: "center" },

  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space(5) },
  skipText: { ...type.bodyMedium, color: colors.textTertiary },
  timerText: { ...type.label, color: colors.primary },

  chat: { flex: 1 },
  bubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderBottomLeftRadius: radii.sm,
    paddingVertical: space(3),
    paddingHorizontal: space(4),
    marginBottom: space(3),
    maxWidth: "85%",
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.sm,
  },
  bubbleSafety: { backgroundColor: "#2A2412", borderWidth: 1, borderColor: colors.warning },
  bubbleText: { ...type.body, color: colors.textPrimary },
  bubbleTextUser: { color: colors.onPrimary },

  inputRow: { flexDirection: "row", alignItems: "center", gap: space(2), marginTop: space(3) },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space(3),
    paddingHorizontal: space(4),
    color: colors.textPrimary,
    ...type.body,
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  sendButtonText: { color: colors.onPrimary, fontSize: 18, fontWeight: "700" },
});
