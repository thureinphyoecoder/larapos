import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { type Locale, tr } from "../i18n/strings";
import { formatDateTime } from "../utils/formatters";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  orderId: number | null;
  kind: "new_order" | "status_changed";
  isRead: boolean;
};

type NotificationsScreenProps = {
  locale: Locale;
  theme: "dark" | "light";
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onOpenNotification: (notification: NotificationItem) => void;
};

export function NotificationsScreen({
  locale,
  theme,
  notifications,
  onMarkAllRead,
  onOpenNotification,
}: NotificationsScreenProps) {
  const dark = theme === "dark";
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const hasUnread = unreadCount > 0;
  const filteredNotifications = useMemo(
    () => (filter === "unread" ? notifications.filter((item) => !item.isRead) : notifications),
    [filter, notifications],
  );

  return (
    <View className={`flex-1 px-4 pb-28 pt-14 ${dark ? "bg-slate-950" : "bg-slate-100"}`}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className={`text-2xl font-black ${dark ? "text-white" : "text-slate-900"}`}>{tr(locale, "notificationsTitle")}</Text>
        <Pressable className={`rounded-full px-4 py-2 ${dark ? "bg-slate-800" : "bg-white"}`} onPress={onMarkAllRead} disabled={!hasUnread}>
          <Text className={`text-xs font-bold ${dark ? "text-slate-100" : "text-slate-700"}`}>{tr(locale, "markAllRead")}</Text>
        </Pressable>
      </View>

      <View className="mb-3 flex-row gap-3">
        <View className={`flex-1 rounded-2xl border px-4 py-3 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
          <Text className={`text-[11px] font-bold uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "notificationsUnreadLabel")}</Text>
          <Text className={`mt-1 text-xl font-black ${dark ? "text-rose-300" : "text-rose-600"}`}>{unreadCount}</Text>
        </View>
        <View className={`flex-1 rounded-2xl border px-4 py-3 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
          <Text className={`text-[11px] font-bold uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "notificationsAllLabel")}</Text>
          <Text className={`mt-1 text-xl font-black ${dark ? "text-cyan-300" : "text-cyan-700"}`}>{notifications.length}</Text>
        </View>
      </View>

      <View className="mb-3 flex-row gap-2">
        <Pressable
          onPress={() => setFilter("all")}
          className={`rounded-full px-3 py-1.5 ${filter === "all" ? (dark ? "bg-cyan-500" : "bg-slate-900") : dark ? "bg-slate-800" : "bg-white"}`}
        >
          <Text className={`text-xs font-bold ${filter === "all" ? "text-white" : dark ? "text-slate-200" : "text-slate-600"}`}>
            {tr(locale, "notificationsFilterAll")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter("unread")}
          className={`rounded-full px-3 py-1.5 ${filter === "unread" ? (dark ? "bg-cyan-500" : "bg-slate-900") : dark ? "bg-slate-800" : "bg-white"}`}
        >
          <Text className={`text-xs font-bold ${filter === "unread" ? "text-white" : dark ? "text-slate-200" : "text-slate-600"}`}>
            {tr(locale, "notificationsFilterUnread")}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        ListEmptyComponent={
          <View className={`rounded-2xl border p-6 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
            <Text className={`text-center text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}>{tr(locale, "noNotifications")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onOpenNotification(item)}
            className={`rounded-2xl border p-4 ${
              item.isRead
                ? dark
                  ? "border-slate-800 bg-slate-900/95"
                  : "border-white bg-white"
                : dark
                  ? "border-cyan-500/50 bg-slate-900"
                  : "border-cyan-300 bg-cyan-50/60"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <Text className={`text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>{item.title}</Text>
              <Text className={`text-[10px] font-bold uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {item.kind === "new_order" ? tr(locale, "notificationTypeOrder") : tr(locale, "notificationTypeStatus")}
              </Text>
            </View>
            <Text className={`mt-1 text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>{item.body}</Text>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {item.createdAt ? formatDateTime(item.createdAt) : tr(locale, "notificationNow")}
              </Text>
              {item.orderId ? (
                <Text className={`text-xs font-bold ${dark ? "text-cyan-300" : "text-cyan-700"}`}>{tr(locale, "notificationOpenOrder")} #{item.orderId}</Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
