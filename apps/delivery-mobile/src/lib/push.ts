import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

type PushRegistrationResult = {
  token: string | null;
  error: string | null;
};

export async function registerForRemotePushAsync(): Promise<PushRegistrationResult> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Order Updates",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16A34A",
      sound: "default",
    });
  }

  if (!Constants.isDevice) {
    return {
      token: null,
      error: "Remote push သည် emulator/simulator မဟုတ်ပဲ physical phone မှာပဲ စမ်းသပ်နိုင်ပါတယ်။",
    };
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermission.status;
  if (finalStatus !== "granted") {
    const nextPermission = await Notifications.requestPermissionsAsync();
    finalStatus = nextPermission.status;
  }

  if (finalStatus !== "granted") {
    return {
      token: null,
      error: "Notification permission မပေးထားသောကြောင့် push မရနိုင်ပါ။",
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
