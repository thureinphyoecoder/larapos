import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let initialized = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!initialized && Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 200, 250],
      lightColor: "#ea580c",
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    initialized = true;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return Boolean(requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
}

export async function showLocalNotification(title: string, body: string): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}
