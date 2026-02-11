import { Pressable, Text, View } from "react-native";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatMoney } from "../utils/format";
import type { CustomerOrder, Locale } from "../types/domain";

type Props = {
  order: CustomerOrder;
  dark: boolean;
  locale: Locale;
  onPress: () => void;
};

export function OrderCard({ order, dark, locale, onPress }: Props) {
  const normalized = String(order.status || "").toLowerCase();
  const accentClass =
    normalized === "delivered"
      ? "border-l-emerald-500"
      : normalized === "pending"
        ? "border-l-amber-500"
        : normalized === "cancelled"
          ? "border-l-rose-500"
          : "border-l-sky-500";

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl border border-l-4 p-4 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"} ${accentClass}`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className={`text-sm font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{order.invoice_no || `Order #${order.id}`}</Text>
          <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{formatDate(order.created_at)}</Text>
          {order.shop?.name ? (
            <Text className={`mt-1 text-[11px] font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>{order.shop.name}</Text>
          ) : null}
        </View>
        <StatusBadge status={order.status} locale={locale} dark={dark} />
      </View>

      <View className={`mt-3 rounded-xl px-3 py-2 ${dark ? "bg-slate-800" : "bg-slate-50"}`}>
        <Text className={`text-[11px] uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>Total</Text>
        <Text className={`text-base font-black ${dark ? "text-orange-300" : "text-orange-600"}`}>{formatMoney(order.total_amount)}</Text>
      </View>
    </Pressable>
  );
}
