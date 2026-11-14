import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

/**
 * Deterministic scheduling — a fixed repeating local notification, no
 * LLM, no server. Local notifications aren't supported on web, so these
 * are all safe no-ops there.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleHydrationReminders(intervalHours: number): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: "💧 Hydration check", body: "Time for a glass of water." },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: intervalHours * 60 * 60,
      repeats: true,
    },
  });
}

export async function cancelHydrationReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
