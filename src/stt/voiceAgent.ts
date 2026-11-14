import { getVoiceRecognizer } from "./getVoiceRecognizer";

export type TranscriptHandler = (transcript: string) => void;

/**
 * App-wide, always-listening voice agent. One recognizer instance lives
 * for the whole session; whichever screen is focused registers itself as
 * the active transcript handler (setActiveVoiceHandler) rather than
 * owning its own recognizer — that's what makes this feel like one
 * ongoing conversation across screens instead of a per-screen mic button.
 *
 * Browser mic permission still requires a real user gesture the first
 * time (a tap) — startVoiceAgent() should be called from that tap, not
 * on app load. After that first grant it keeps itself alive by
 * auto-restarting whenever the underlying recognition session ends
 * (Chrome ends it after a stretch of silence even in continuous mode).
 */
let activeHandler: TranscriptHandler | null = null;
let running = false;
let currentLanguage = "en-IN";
let restartTimer: ReturnType<typeof setTimeout> | null = null;
let wired = false;

function scheduleRestart(): void {
  if (!running) return;
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    if (running) getVoiceRecognizer().start({ language: currentLanguage });
  }, 350);
}

function wireOnce(): void {
  if (wired) return;
  wired = true;
  const recognizer = getVoiceRecognizer();

  recognizer.onResult(({ transcript, isFinal }) => {
    if (isFinal && transcript.trim()) {
      activeHandler?.(transcript.trim());
    }
  });
  recognizer.onEnd(scheduleRestart);
  recognizer.onError((error) => {
    if (error === "not_supported") return;
    scheduleRestart();
  });
}

export function isVoiceAgentSupported(): boolean {
  return getVoiceRecognizer().isSupported;
}

export function isVoiceAgentRunning(): boolean {
  return running;
}

/** Call this from a user tap — browsers require a real gesture to grant mic access the first time. */
export function startVoiceAgent(language: string): void {
  currentLanguage = language;
  if (running) return;
  wireOnce();
  running = true;
  getVoiceRecognizer().start({ language });
}

export function stopVoiceAgent(): void {
  running = false;
  if (restartTimer) clearTimeout(restartTimer);
  getVoiceRecognizer().stop();
}

export function setVoiceAgentLanguage(language: string): void {
  currentLanguage = language;
}

/** The currently-focused screen registers its transcript handler here; clears it (pass null) on unmount. */
export function setActiveVoiceHandler(handler: TranscriptHandler | null): void {
  activeHandler = handler;
}
