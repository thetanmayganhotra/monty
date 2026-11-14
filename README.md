# Monty

A voice-first AI fitness coach app — like a gym buddy who talks in English or Hinglish, plans your workout for the day, counts reps out loud and adjusts as you go.

Built with **Expo (React Native)**. It runs on iOS, Android and web.

## What it does

- **Onboarding** — goal (strength, hypertrophy, fat loss, general fitness), experience, equipment, session length and coaching style (silent / minimal / coach / hype). This builds a starting plan from templates.
- **Daily plan** — makes today's workout from your history, progress and mood check-in (`src/planning`, `src/workout-engine`).
- **Workout session** — a state machine runs sets, reps and rest. It talks through TTS (`src/tts`), and you can control it by voice ("next", "skip", "pause") through the Web Speech API (`src/stt`).
- **Safety** — if you mention pain, it changes the plan or stops (`src/safety/painDetector.ts`).
- **Analytics** — history, calorie estimates, exercise trends, weekly recap, body measurements.
- **Gamification** — streaks and badges.
- **Hydration reminders** — local notifications.
- **LLM** — Groq (`openai/gpt-oss-20b` by default) for coaching lines and recaps (`src/llm`).

## Run it

```bash
npm install
cp .env.example .env     # add your keys
npm start                # Expo dev server — i (iOS), a (Android), w (web)
```

To check the Groq key:

```bash
npm run verify:groq
```

### Environment

Every variable is explained in `.env.example`:

| Variable | What it's for |
|---|---|
| `GROQ_API_KEY` | LLM (required for AI coaching) |
| `GROQ_MODEL` | Optional model override |
| `FIREBASE_*` | Phone auth + Firestore sync. Without these, the app runs fully local with AsyncStorage |
| `SUPABASE_*` | Optional alternative backend (schema in `supabase/schema.sql`) |

Firestore rules are in `firebase/firestore.rules`.

## Project layout

```
App.tsx                 font loading + navigator
src/
  screens/              Home, Workout, Onboarding, History, Analytics, Settings, Login, Mood, Body
  workout-engine/       state machine, exercise library, progression, adaptive rules, voice commands
  planning/             daily plan generator
  onboarding/           template generator
  llm/                  provider-agnostic LLM layer (Groq), prompts, parsers
  stt/ tts/             voice in / voice out
  storage/              AsyncStorage repositories (profile, sessions, mood, hydration, measurements)
  backend/              Firebase / Supabase clients + sync
  analytics/ gamification/ notifications/ safety/ i18n/ design/
firebase/               Firestore rules
supabase/               Postgres schema
scripts/verify-groq.ts  API key smoke test
```

## Stack

Expo SDK · React Native · TypeScript · Groq · Firebase (Auth + Firestore) · AsyncStorage · Zod

## License

MIT — see [LICENSE](LICENSE).
