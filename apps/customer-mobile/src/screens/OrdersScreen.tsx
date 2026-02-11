import { RefreshControl, ScrollView, Text, View } from "react-native";
import { OrderCard } from "../components/OrderCard";
import { tr } from "../i18n/strings";
import type { CustomerOrder, Locale } from "../types/domain";

type Props = {
  locale: Locale;
  dark: boolean;
  orders: CustomerOrder[];
  refreshing: boolean;
  onOpenOrder: (orderId: number) => void;
  onRefresh: () => void;
};

export function OrdersScreen({ locale, dark, orders, refreshing, onOpenOrder, onRefresh }: Props) {
  const groupedOrders = groupOrdersByDate(orders);

  return (
    <ScrollView
      className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`}
      contentContainerStyle={{ padding: 16, paddingBottom: 132 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className={`rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <Text className={`text-2xl font-black ${dark ? "text-white" : "text-slate-900"}`}>{tr(locale, "ordersTitle")}</Text>
        <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "ordersSubtitle")}</Text>
      </View>

      <View className="mt-4">
        {groupedOrders.length ? (
          groupedOrders.map((group) => (
            <View key={group.dateKey} className="mb-5">
              <View className="self-start rounded-full bg-orange-50 px-3 py-1">
                <Text className="text-[10px] font-black uppercase tracking-wider text-orange-700">{group.label}</Text>
              </View>

              <View className="mt-2 gap-3">
                {group.orders.map((order) => (
                  <OrderCard key={order.id} order={order} dark={dark} locale={locale} onPress={() => onOpenOrder(order.id)} />
                ))}
              </View>
            </View>
          ))
        ) : (
          <View className={`rounded-2xl border p-6 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <Text className={`${dark ? "text-slate-300" : "text-slate-500"}`}>{tr(locale, "ordersEmpty")}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function groupOrdersByDate(orders: CustomerOrder[]) {
  const groups = new Map<string, CustomerOrder[]>();

  for (const order of orders) {
    const dateKey = normalizeDateKey(order.created_at);
    const list = groups.get(dateKey) ?? [];
    list.push(order);
    groups.set(dateKey, list);
  }

  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, groupedOrders]) => ({
      dateKey,
      label: formatDateHeading(dateKey),
      orders: groupedOrders,
    }));
}

function normalizeDateKey(value: string | null): string {
  if (!value) {
    return "unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateHeading(dateKey: string): string {
  if (dateKey === "unknown") {
    return "Unknown Date";
  }

  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
