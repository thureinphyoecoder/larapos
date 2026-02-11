import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";

import { type Locale, tr } from "../i18n/strings";
import type { ApiUser, Order } from "../types/domain";
import { formatDateTime, formatMMK } from "../utils/formatters";

type StatusTab = "all" | "pending" | "shipped" | "delivered";

type OrdersListScreenProps = {
  locale: Locale;
  user: ApiUser;
  orders: Order[];
  refreshing: boolean;
  theme: "dark" | "light";
  unreadCount: number;
  onRefresh: () => void;
  onOpenOrder: (order: Order) => void;
  onOpenNotifications: () => void;
};

const STATUS_TABS: Array<{ key: StatusTab; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];
const COMPANY_NAME = "LaraPOS Smart";

export function OrdersListScreen({
  locale,
  user,
  orders,
  refreshing,
  theme,
  unreadCount,
  onRefresh,
  onOpenOrder,
  onOpenNotifications,
}: OrdersListScreenProps) {
  const dark = theme === "dark";
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusTab>("all");

  const filteredOrders = useMemo(() => {
    const byStatus =
      activeStatus === "all"
        ? orders
        : activeStatus === "pending"
          ? orders.filter((order) => order.status === "pending" || order.status === "confirmed")
          : orders.filter((order) => order.status === activeStatus);
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return byStatus;
    }

    return byStatus.filter((order) => {
      const idText = String(order.id);
      const invoice = (order.invoice_no ?? "").toLowerCase();
      const phone = (order.phone ?? "").toLowerCase();
      const address = (order.address ?? "").toLowerCase();
      return idText.includes(normalized) || invoice.includes(normalized) || phone.includes(normalized) || address.includes(normalized);
    });
  }, [orders, query, activeStatus]);

  return (
    <View className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`}>
      <View className="absolute -left-24 top-6 h-56 w-56 rounded-full bg-cyan-400/15" />
      <View className="absolute -right-20 top-28 h-52 w-52 rounded-full bg-emerald-400/15" />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dark ? "#e2e8f0" : "#0f172a"} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 56, paddingBottom: 136, gap: 12 }}
        ListHeaderComponent={
          <View className="mb-2 gap-3">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className={`text-[28px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`}>{COMPANY_NAME}</Text>
                <View className="mt-2 flex-row gap-2">
                  <View className={`rounded-full px-3 py-1 ${dark ? "bg-violet-500/25" : "bg-violet-100"}`}>
                    <Text className={`text-xs font-bold ${dark ? "text-violet-200" : "text-violet-800"}`}>{tr(locale, "userLabel")}: {user.name}</Text>
                  </View>
                  <View className={`rounded-full px-3 py-1 ${dark ? "bg-cyan-500/25" : "bg-cyan-100"}`}>
                    <Text className={`text-xs font-bold ${dark ? "text-cyan-200" : "text-cyan-800"}`}>{tr(locale, "ordersLabel")}: {filteredOrders.length}</Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={onOpenNotifications}
                className={`relative h-11 w-11 items-center justify-center rounded-full ${dark ? "bg-slate-900" : "bg-white"}`}
              >
                <Ionicons name="notifications-outline" size={20} color={dark ? "#e2e8f0" : "#0f172a"} />
                {unreadCount > 0 ? (
                  <View className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1">
                    <Text className="text-center text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            <View className={`rounded-xl border px-3 ${dark ? "border-cyan-500/45 bg-slate-900/95" : "border-cyan-500/40 bg-white"}`}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={tr(locale, "searchPlaceholder")}
                placeholderTextColor={dark ? "#94a3b8" : "#64748b"}
                className={`h-10 text-sm ${dark ? "text-white" : "text-slate-900"}`}
                autoCapitalize="none"
              />
            </View>

            <View className="flex-row gap-2">
              {STATUS_TABS.map((tab) => {
                const active = tab.key === activeStatus;
                const labelMap = {
                  all: tr(locale, "statusAll"),
                  pending: tr(locale, "statusPending"),
                  shipped: tr(locale, "statusShipped"),
                  delivered: tr(locale, "statusDelivered"),
                } as const;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveStatus(tab.key)}
                    className={`rounded-full px-3 py-2 ${active ? (dark ? "bg-cyan-500" : "bg-slate-900") : dark ? "bg-slate-800" : "bg-white"}`}
                  >
                    <Text className={`text-xs font-bold ${active ? "text-white" : dark ? "text-slate-300" : "text-slate-600"}`}>{labelMap[tab.key]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className={`rounded-2xl border p-6 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
            <Text className={`text-center text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}>{tr(locale, "emptyOrders")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => onOpenOrder(item)} className={`rounded-2xl border p-4 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
            <View className="flex-row items-start justify-between">
              <Text className={`text-base font-black ${dark ? "text-white" : "text-slate-900"}`}>
                #{item.id} {item.invoice_no ? `• ${item.invoice_no}` : ""}
              </Text>
              <StatusChip status={item.status} />
            </View>
            <Text className={`mt-2 text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>{tr(locale, "amount")}: {formatMMK(item.total_amount)}</Text>
            <Text className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{item.phone || tr(locale, "noPhone")}</Text>
            <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "createdAt")}: {formatDateTime(item.created_at)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === "pending" || status === "confirmed") {
    return (
      <View className="rounded-full border border-amber-600/40 bg-amber-200 px-3 py-1">
        <Text className="text-[11px] font-black uppercase text-amber-900">pending</Text>
      </View>
    );
  }

  if (status === "shipped") {
    return (
      <View className="rounded-full border border-sky-600/35 bg-sky-200 px-3 py-1">
        <Text className="text-[11px] font-black uppercase text-sky-900">shipped</Text>
      </View>
    );
  }

  if (status === "delivered") {
    return (
      <View className="rounded-full border border-emerald-700/40 bg-emerald-200 px-3 py-1">
        <Text className="text-[11px] font-black uppercase text-emerald-900">delivered</Text>
      </View>
    );
  }

  return (
    <View className="rounded-full bg-slate-100 px-3 py-1">
      <Text className="text-[11px] font-bold uppercase text-slate-700">{status}</Text>
    </View>
  );
}
