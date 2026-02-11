import { FlatList, Pressable, Text, View } from "react-native";

import { type Locale, tr } from "../i18n/strings";
import { formatDateTime } from "../utils/formatters";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

type NotificationsScreenProps = {
  locale: Locale;
  theme: "dark" | "light";
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
};

export function NotificationsScreen({ locale, theme, notifications, onMarkAllRead }: NotificationsScreenProps) {
  const dark = theme === "dark";

  return (
    <View className={`flex-1 px-4 pb-28 pt-14 ${dark ? "bg-slate-950" : "bg-slate-100"}`}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className={`text-2xl font-black ${dark ? "text-white" : "text-slate-900"}`}>{tr(locale, "notificationsTitle")}</Text>
        <Pressable className={`rounded-full px-4 py-2 ${dark ? "bg-slate-800" : "bg-white"}`} onPress={onMarkAllRead}>
          <Text className={`text-xs font-bold ${dark ? "text-slate-100" : "text-slate-700"}`}>{tr(locale, "markAllRead")}</Text>
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        ListEmptyComponent={
          <View className={`rounded-2xl border p-6 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
            <Text className={`text-center text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}>{tr(locale, "noNotifications")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className={`rounded-2xl border p-4 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
            <Text className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>{item.title}</Text>
            <Text className={`mt-1 text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>{item.body}</Text>
            <Text className={`mt-2 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{formatDateTime(item.createdAt)}</Text>
          </View>
        )}
      />
    </View>
  );
}
