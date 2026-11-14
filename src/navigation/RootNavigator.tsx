import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { subscribeAuthState } from "../auth/session";
import { isFirebaseConfigured } from "../config/env";
import { colors } from "../design/theme";
import type { OnboardingAnswers } from "../onboarding/types";
import { getProfile, saveProfile } from "../storage/profileRepository";
import { saveSession } from "../storage/sessionRepository";
import type { MoodSignal, UserProfile, WorkoutSessionRecord } from "../storage/types";
import { generateId } from "../util/id";
import type { WorkoutTemplate } from "../workout-engine/types";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import BodyMeasurementsScreen from "../screens/BodyMeasurementsScreen";
import HistoryScreen from "../screens/HistoryScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import MoodCheckInScreen from "../screens/MoodCheckInScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import SettingsScreen from "../screens/SettingsScreen";
import WorkoutScreen from "../screens/WorkoutScreen";

type Screen =
  | "loading"
  | "login"
  | "onboarding"
  | "home"
  | "workout"
  | "mood_checkin"
  | "history"
  | "settings"
  | "analytics"
  | "measurements";

export default function RootNavigator() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [authChecked, setAuthChecked] = useState(!isFirebaseConfigured());
  const [loggedIn, setLoggedIn] = useState(!isFirebaseConfigured());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [moodSignal, setMoodSignal] = useState<MoodSignal | undefined>(undefined);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return subscribeAuthState((user) => {
      setLoggedIn(!!user);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!loggedIn) {
      setScreen("login");
      return;
    }
    getProfile().then((p) => {
      setProfile(p);
      setScreen(p ? "home" : "onboarding");
    });
  }, [authChecked, loggedIn]);

  const handleOnboardingComplete = async (answers: OnboardingAnswers) => {
    const newProfile: UserProfile = {
      id: generateId(),
      ...answers,
      createdAt: new Date().toISOString(),
      approvedPlanCount: 0,
    };
    await saveProfile(newProfile);
    setProfile(newProfile);
    setScreen("home");
  };

  const handleWorkoutFinish = async (session: WorkoutSessionRecord) => {
    await saveSession({ ...session, moodSignal });
    setActiveTemplate(null);
    setMoodSignal(undefined);
    setScreen("home");
  };

  if (screen === "loading" || (loggedIn && !profile && screen !== "onboarding" && screen !== "login")) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  switch (screen) {
    case "login":
      return <LoginScreen onLoggedIn={() => setLoggedIn(true)} />;

    case "onboarding":
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;

    case "workout":
      if (!profile || !activeTemplate) return null;
      return (
        <WorkoutScreen
          profile={profile}
          template={activeTemplate}
          onFinish={handleWorkoutFinish}
          onExit={() => {
            setActiveTemplate(null);
            setScreen("home");
          }}
        />
      );

    case "mood_checkin":
      if (!profile) return null;
      return (
        <MoodCheckInScreen
          language={profile.language}
          onComplete={(signal) => {
            setMoodSignal(signal);
            setScreen("home");
          }}
          onSkip={() => setScreen("home")}
        />
      );

    case "history":
      return <HistoryScreen onBack={() => setScreen("home")} />;

    case "analytics":
      if (!profile) return null;
      return <AnalyticsScreen profile={profile} onBack={() => setScreen("home")} />;

    case "measurements":
      if (!profile) return null;
      return (
        <BodyMeasurementsScreen
          profile={profile}
          onProfileUpdate={setProfile}
          onBack={() => setScreen("home")}
        />
      );

    case "settings":
      if (!profile) return null;
      return <SettingsScreen profile={profile} onUpdate={setProfile} onBack={() => setScreen("home")} />;

    case "home":
    default:
      if (!profile) return null;
      return (
        <HomeScreen
          profile={profile}
          moodSignal={moodSignal}
          onStartWorkout={(template) => {
            setActiveTemplate(template);
            setScreen("workout");
          }}
          onOpenMoodCheckIn={() => setScreen("mood_checkin")}
          onOpenHistory={() => setScreen("history")}
          onOpenSettings={() => setScreen("settings")}
          onOpenAnalytics={() => setScreen("analytics")}
          onOpenMeasurements={() => setScreen("measurements")}
        />
      );
  }
}
