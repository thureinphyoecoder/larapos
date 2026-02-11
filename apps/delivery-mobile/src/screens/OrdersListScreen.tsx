import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";

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
  { key: "pending", label: "Pending" },
  { key: "shipped", label: "Shipped" },
  { key: "all", label: "All" },
  { key: "delivered", label: "Delivered" },
];
const COMPANY_NAME = "LaraPee Smart";

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
  const [activeStatus, setActiveStatus] = useState<StatusTab>("pending");

  const summary = useMemo(() => {
    const pending = orders.filter((order) => order.status === "pending" || order.status === "confirmed").length;
    const shipped = orders.filter((order) => order.status === "shipped").length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    return { pending, shipped, delivered };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const byStatus =
      activeStatus === "pending"
        ? orders.filter((order) => order.status === "pending" || order.status === "confirmed")
        : activeStatus === "all"
          ? orders.filter((order) => order.status !== "delivered")
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
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dark ? "#e2e8f0" : "#0f172a"} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 54, paddingBottom: 172 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            <View className={`rounded-3xl border p-4 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className={`text-[34px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`}>{COMPANY_NAME}</Text>
                  <Text className={`mt-1 text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "userLabel")}: {user.name}</Text>
                </View>
                <Pressable
                  onPress={onOpenNotifications}
                  className={`relative h-12 w-12 items-center justify-center rounded-2xl ${dark ? "bg-slate-800" : "bg-slate-100"}`}
                >
                  <Ionicons name="notifications-outline" size={20} color={dark ? "#f8fafc" : "#0f172a"} />
                  {unreadCount > 0 ? (
                    <View className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1">
                      <Text className="text-center text-[10px] font-black text-white">{unreadCount > 99 ? "99+" : unreadCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>

              <View className="mt-4 flex-row gap-2">
                <SummaryBadge label={tr(locale, "statusPending")} value={summary.pending} dark={dark} tone="amber" />
                <SummaryBadge label={tr(locale, "statusShipped")} value={summary.shipped} dark={dark} tone="sky" />
                <SummaryBadge label={tr(locale, "statusDelivered")} value={summary.delivered} dark={dark} tone="emerald" />
              </View>
            </View>

            <View className={`rounded-2xl border px-3 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <View className="h-12 flex-row items-center gap-2">
                <Ionicons name="search" size={16} color={dark ? "#94a3b8" : "#64748b"} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={tr(locale, "searchPlaceholder")}
                  placeholderTextColor={dark ? "#94a3b8" : "#64748b"}
                  className={`flex-1 text-sm ${dark ? "text-white" : "text-slate-900"}`}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
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
                    className={`rounded-full px-4 py-2 ${
                      active
                        ? dark
                          ? "bg-white"
                          : "bg-slate-900"
                        : dark
                          ? "bg-slate-800"
                          : "bg-white"
                    }`}
                  >
                    <Text className={`text-xs font-black ${active ? (dark ? "text-slate-900" : "text-white") : dark ? "text-slate-300" : "text-slate-600"}`}>
                      {labelMap[tab.key]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View className={`rounded-2xl border p-8 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <Text className={`text-center text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}>{tr(locale, "emptyOrders")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onOpenOrder(item)}
            className={`rounded-3xl border px-4 py-4 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className={`text-[11px] font-bold uppercase tracking-[1.2px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  {tr(locale, "invoice")}
                </Text>
                <Text className={`mt-1 text-base font-black ${dark ? "text-white" : "text-slate-900"}`}>
                  {item.invoice_no || `#${item.id}`}
                </Text>
              </View>
              <StatusChip status={item.status} />
            </View>

            <View className="mt-3 flex-row gap-2">
              <View className={`flex-1 rounded-2xl px-3 py-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "customerName")}</Text>
                <Text className={`mt-1 text-xs font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>{item.customer?.name || "-"}</Text>
              </View>
              <View className={`flex-1 rounded-2xl px-3 py-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "phone")}</Text>
                <Text className={`mt-1 text-xs font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>{item.phone || tr(locale, "noPhone")}</Text>
              </View>
            </View>

            <View className={`mt-2 rounded-2xl px-3 py-2 ${dark ? "bg-slate-800/80" : "bg-slate-100"}`}>
              <Text className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>Address</Text>
              <Text numberOfLines={2} className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {item.address || "-"}
              </Text>
            </View>

            <View className={`mt-3 rounded-2xl px-3 py-3 ${dark ? "bg-cyan-500/10" : "bg-cyan-50"}`}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "createdAt")}</Text>
                  <Text className={`mt-1 text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{formatDateTime(item.created_at)}</Text>
                </View>
                <View className="items-end">
                  <Text className={`text-[10px] font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "amount")}</Text>
                  <Text className={`mt-1 text-xl font-black ${dark ? "text-cyan-300" : "text-cyan-700"}`}>{formatMMK(item.total_amount)}</Text>
                </View>
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-end">
              <Text className={`text-[11px] font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>Open details</Text>
              <Ionicons name="chevron-forward" size={14} color={dark ? "#94a3b8" : "#64748b"} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function SummaryBadge({
  label,
  value,
  dark,
  tone,
}: {
  label: string;
  value: number;
  dark: boolean;
  tone: "amber" | "sky" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? dark
        ? "bg-amber-500/12 border-amber-500/25"
        : "bg-amber-50 border-amber-200"
      : tone === "sky"
        ? dark
          ? "bg-sky-500/12 border-sky-500/25"
          : "bg-sky-50 border-sky-200"
        : dark
          ? "bg-emerald-500/12 border-emerald-500/25"
          : "bg-emerald-50 border-emerald-200";

  const textClass =
    tone === "amber"
      ? dark
        ? "text-amber-200"
        : "text-amber-800"
      : tone === "sky"
        ? dark
          ? "text-sky-200"
          : "text-sky-800"
        : dark
          ? "text-emerald-200"
          : "text-emerald-800";

  return (
    <View className={`flex-1 rounded-xl border px-2 py-2 ${toneClass}`}>
      <Text className={`text-[10px] font-bold uppercase tracking-wider ${textClass}`}>{label}</Text>
      <Text className={`mt-1 text-lg font-black ${textClass}`}>{value}</Text>
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === "pending" || status === "confirmed") {
    return (
      <View className="rounded-full border border-amber-600/35 bg-amber-100 px-3 py-1">
        <Text className="text-[10px] font-black uppercase text-amber-900">pending</Text>
      </View>
    );
  }

  if (status === "shipped") {
    return (
      <View className="rounded-full border border-sky-600/35 bg-sky-100 px-3 py-1">
        <Text className="text-[10px] font-black uppercase text-sky-900">shipped</Text>
      </View>
    );
  }

  if (status === "delivered") {
    return (
      <View className="rounded-full border border-emerald-700/35 bg-emerald-100 px-3 py-1">
        <Text className="text-[10px] font-black uppercase text-emerald-900">delivered</Text>
      </View>
    );
  }

  return (
    <View className="rounded-full bg-slate-100 px-3 py-1">
      <Text className="text-[10px] font-bold uppercase text-slate-700">{status}</Text>
    </View>
  );
}
