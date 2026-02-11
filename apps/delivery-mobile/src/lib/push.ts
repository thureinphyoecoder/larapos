import Constants from "expo-constants";
import { Platform } from "react-native";

type NotificationModule = any;
const CUSTOM_SOUND = "larapee_alert.wav";

type PushRegistrationResult = {
  token: string | null;
  error: string | null;
};

let notificationModuleCache: NotificationModule | null | undefined;
let handlerConfigured = false;
let channelConfigured = false;

function getNotificationModule(): NotificationModule | null {
  if (notificationModuleCache !== undefined) {
    return notificationModuleCache;
  }

  try {
    // Optional dependency fallback for environments where expo-notifications is unavailable.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    notificationModuleCache = require("expo-notifications");
  } catch {
    notificationModuleCache = null;
  }

  return notificationModuleCache;
}

export function configureNotificationHandler(): void {
  const Notifications = getNotificationModule();
  if (!Notifications || handlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  handlerConfigured = true;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = getNotificationModule();
  if (!Notifications) {
    return false;
  }

  if (!channelConfigured && Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Order Updates",
      importance: Notifications.AndroidImportance?.MAX ?? 5,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16A34A",
      sound: CUSTOM_SOUND,
    });
    channelConfigured = true;
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermission?.status;
  if (finalStatus !== "granted") {
    const nextPermission = await Notifications.requestPermissionsAsync();
    finalStatus = nextPermission?.status;
  }

  return finalStatus === "granted";
}

export async function scheduleLocalNotification(title: string, body: string): Promise<void> {
  const Notifications = getNotificationModule();
  if (!Notifications) {
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: CUSTOM_SOUND,
      channelId: Platform.OS === "android" ? "orders" : undefined,
      priority: Notifications.AndroidNotificationPriority?.MAX,
    },
    trigger: null,
  });
}

export async function registerForRemotePushAsync(): Promise<PushRegistrationResult> {
  const Notifications = getNotificationModule();
  if (!Notifications) {
    return {
      token: null,
      error: "expo-notifications module မရရှိပါ။ ဒီ mode မှာ in-app notification ပဲသုံးပါမယ်။",
    };
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return {
      token: null,
      error: "Notification permission မပေးထားသောကြောင့် push မရနိုင်ပါ။",
    };
  }

  if (!Constants.isDevice) {
    return {
      token: null,
      error: "Remote push သည် emulator/simulator မဟုတ်ပဲ physical phone မှာပဲ စမ်းသပ်နိုင်ပါတယ်။",
    };
  }

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null;

  if (!projectId) {
    return {
      token: null,
      error:
        "EAS projectId မတွေ့ပါ။ app.json > expo.extra.eas.projectId သို့မဟုတ် EXPO_PUBLIC_EAS_PROJECT_ID ထည့်ပြီး dev build ဖြင့် run လုပ်ပါ။",
    };
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token: token.data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown push token error";
    return { token: null, error: `Push token မရရှိပါ: ${message}` };
  }
}
