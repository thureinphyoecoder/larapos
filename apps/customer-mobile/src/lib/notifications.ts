import { Platform } from "react-native";

type NotificationModule = any;

let notificationModuleCache: NotificationModule | null | undefined;
let handlerConfigured = false;
let channelConfigured = false;

function getNotificationModule(): NotificationModule | null {
  if (notificationModuleCache !== undefined) {
    return notificationModuleCache;
  }

  try {
    // Optional guard: if the native module is unavailable, app remains usable.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    notificationModuleCache = require("expo-notifications");
  } catch {
    notificationModuleCache = null;
  }

  return notificationModuleCache;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = getNotificationModule();
  if (!Notifications) {
    return false;
  }

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }

  if (!channelConfigured && Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance?.HIGH ?? 4,
      vibrationPattern: [0, 250, 200, 250],
      lightColor: "#ea580c",
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1,
    });
    channelConfigured = true;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current?.granted || current?.ios?.status === Notifications.IosAuthorizationStatus?.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return Boolean(requested?.granted || requested?.ios?.status === Notifications.IosAuthorizationStatus?.PROVISIONAL);
}

export async function showLocalNotification(title: string, body: string): Promise<void> {
  const Notifications = getNotificationModule();
  if (!Notifications) {
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority?.HIGH ?? 4,
    },
    trigger: null,
  });
}
