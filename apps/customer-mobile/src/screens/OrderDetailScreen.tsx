import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { StatusBadge } from "../components/StatusBadge";
import { tr } from "../i18n/strings";
import type { CustomerOrder, Locale } from "../types/domain";
import { formatDate, formatMoney } from "../utils/format";

type Props = {
  locale: Locale;
  dark: boolean;
  order: CustomerOrder | null;
  busy: boolean;
  error: string;
  actionBusy: boolean;
  actionMessage: string;
  onCancelOrder: (reason: string) => void;
  onRequestRefund: () => void;
  onRequestReturn: (reason: string) => void;
  onBack: () => void;
};

type ActionType = "none" | "cancel" | "return";

export function OrderDetailScreen({
  locale,
  dark,
  order,
  busy,
  error,
  actionBusy,
  actionMessage,
  onCancelOrder,
  onRequestRefund,
  onRequestReturn,
  onBack,
}: Props) {
  const [actionType, setActionType] = useState<ActionType>("none");
  const [reason, setReason] = useState("");
  const status = String(order?.status || "").toLowerCase();

  const canCancel = status === "pending";
  const canRefund = (status === "confirmed" || status === "shipped") && Boolean(order?.payment_slip_url);
  const canReturn = status === "delivered";

  const requiresReason = actionType === "cancel" || actionType === "return";
  const validReason = reason.trim().length >= 5;

  const actionTitle = useMemo(() => {
    if (actionType === "cancel") return tr(locale, "cancelOrder");
    if (actionType === "return") return tr(locale, "requestReturn");
    return "";
  }, [actionType, locale]);

  const submitAction = () => {
    if (actionType === "cancel") {
      onCancelOrder(reason.trim());
      return;
    }

    if (actionType === "return") {
      onRequestReturn(reason.trim());
    }
  };

  const receiptText = useMemo(() => {
    const header = [
      "LaraPee Receipt",
      `Invoice: ${order?.invoice_no || "-"}`,
      `Receipt: ${order?.receipt_no || `#${order?.id || "-"}`}`,
      `Date: ${formatDate(order?.created_at || null)}`,
      `Status: ${String(order?.status || "-").toUpperCase()}`,
      "",
      `Phone: ${order?.phone || "-"}`,
      `Address: ${order?.address || "-"}`,
      "",
      "Items:",
    ];

    const lines =
      order?.items?.map(
        (item) =>
          `- ${item.product?.name || `Item #${item.product_id}`} (${item.quantity} x ${formatMoney(item.price)}) = ${formatMoney(item.line_total)}`,
      ) || [];

    return [...header, ...lines, "", `Total: ${formatMoney(order?.total_amount || 0)}`].join("\n");
  }, [order]);

  const onPrintReceipt = async () => {
    try {
      await Share.share({
        title: "LaraPee Receipt",
        message: receiptText,
      });
    } catch {
      // ignore share cancel/action errors
    }
  };

  return (
    <ScrollView className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onBack} className={`h-10 w-10 items-center justify-center rounded-xl border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Ionicons name="chevron-back" size={18} color={dark ? "#e2e8f0" : "#334155"} />
        </Pressable>
        <Text className={`text-lg font-black ${dark ? "text-white" : "text-slate-900"}`}>{tr(locale, "orderDetails")}</Text>
        <View className="w-10" />
      </View>

      <View className={`mt-4 rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className={`text-4xl font-black tracking-tight ${dark ? "text-orange-300" : "text-orange-600"}`}>LaraPee</Text>
            <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "homeWelcomeSubtitle")}</Text>
          </View>
          <View className="items-end">
            <Text className={`text-xl font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{tr(locale, "receiptTitle")}</Text>
            <Text className={`mt-1 text-xs font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>#{order?.id || "-"}</Text>
            <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Invoice: {order?.invoice_no || "-"}</Text>
            <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{formatDate(order?.created_at || null)}</Text>
          </View>
        </View>

        <View className={`mt-4 border-t pt-4 ${dark ? "border-slate-700" : "border-slate-200"}`}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className={`text-xs font-black uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "customerPhone")}</Text>
              <Text className={`mt-1 text-base font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{order?.phone || "-"}</Text>
              <Text className={`mt-1 text-xs leading-5 ${dark ? "text-slate-300" : "text-slate-600"}`}>{order?.address || "-"}</Text>
            </View>
            <StatusBadge status={order?.status || "pending"} locale={locale} dark={dark} />
          </View>
        </View>

        <View className={`mt-4 border-t pt-4 ${dark ? "border-slate-700" : "border-slate-200"}`}>
          <View className="mb-2 flex-row items-center">
            <Text className={`flex-1 text-xs font-bold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "description")}</Text>
            <Text className={`w-16 text-center text-xs font-bold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "quantity")}</Text>
            <Text className={`w-28 text-right text-xs font-bold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "total")}</Text>
          </View>
          <View className="gap-3">
            {order?.items?.length ? (
              order.items.map((item) => (
                <View key={`receipt-${item.id}`} className={`rounded-2xl border px-3 py-3 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-100 bg-slate-50"}`}>
                  <View className="flex-row items-center">
                    <View className="flex-1 pr-2">
                      <Text className={`text-base font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{item.product?.name || `Item #${item.product_id}`}</Text>
                      <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                        {tr(locale, "variant")}: {item.variant?.sku || "-"}
                      </Text>
                    </View>
                    <Text className={`w-16 text-center text-base font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>{item.quantity}</Text>
                    <Text className={`w-28 text-right text-base font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{formatMoney(item.line_total)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "noOrderItems")}</Text>
            )}
          </View>
        </View>

        <View className={`mt-4 border-t pt-4 ${dark ? "border-slate-700" : "border-slate-200"}`}>
          <InfoRow dark={dark} label={tr(locale, "total")} value={formatMoney(order?.total_amount || 0)} />
          <View className="mt-3 flex-row gap-3">
            <Pressable onPress={() => void onPrintReceipt()} className={`flex-1 items-center rounded-2xl px-4 py-3 ${dark ? "bg-slate-800" : "bg-slate-900"}`}>
              <Text className="text-sm font-black text-white">{tr(locale, "printReceipt")}</Text>
            </Pressable>
            <Pressable onPress={onBack} className="flex-1 items-center rounded-2xl bg-orange-600 px-4 py-3">
              <Text className="text-sm font-black text-white">{tr(locale, "backToOrder")}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View className={`mt-4 rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <Text className={`text-base font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{tr(locale, "orderItems")}</Text>

        <View className="mt-3 gap-3">
          {order?.items?.length ? (
            order.items.map((item) => (
              <View key={item.id} className={`rounded-xl border p-3 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-100 bg-slate-50"}`}>
                <Text className={`text-sm font-bold ${dark ? "text-slate-200" : "text-slate-800"}`}>{item.product?.name || `Item #${item.product_id}`}</Text>
                <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  {item.quantity} x {formatMoney(item.price)}
                </Text>
                <Text className={`mt-2 text-sm font-black ${dark ? "text-orange-300" : "text-orange-600"}`}>{formatMoney(item.line_total)}</Text>
              </View>
            ))
          ) : (
            <Text className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "noOrderItems")}</Text>
          )}
        </View>
      </View>

      {status === "cancelled" && order?.cancel_reason ? (
        <View className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <Text className="text-xs font-black uppercase tracking-wider text-rose-700">{tr(locale, "cancelOrder")}</Text>
          <Text className="mt-2 text-xs font-semibold text-rose-800">{order.cancel_reason}</Text>
        </View>
      ) : null}

      {(status === "shipped" || status === "delivered") ? (
        <View className={`mt-4 rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Text className={`text-base font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>Delivery</Text>
          <View className="mt-3 gap-2">
            <InfoRow dark={dark} label={tr(locale, "statusLabel")} value={status === "shipped" ? "On the way" : "Delivered"} />
            <InfoRow
              dark={dark}
              label="Location"
              value={order?.delivery_lat && order?.delivery_lng ? `${order.delivery_lat}, ${order.delivery_lng}` : "-"}
            />
          </View>
        </View>
      ) : null}

      {(canCancel || canRefund || canReturn) ? (
        <View className={`mt-4 rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Text className={`text-base font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{tr(locale, "orderActions")}</Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {canCancel ? (
              <Pressable onPress={() => setActionType("cancel")} className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2">
                <Text className="text-xs font-black uppercase text-rose-700">{tr(locale, "cancelOrder")}</Text>
              </Pressable>
            ) : null}

            {canRefund ? (
              <Pressable onPress={onRequestRefund} disabled={actionBusy} className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2">
                <Text className="text-xs font-black uppercase text-indigo-700">{tr(locale, "requestRefund")}</Text>
              </Pressable>
            ) : null}

            {canReturn ? (
              <Pressable onPress={() => setActionType("return")} className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2">
                <Text className="text-xs font-black uppercase text-amber-700">{tr(locale, "requestReturn")}</Text>
              </Pressable>
            ) : null}
          </View>

          {requiresReason ? (
            <View className="mt-4">
              <Text className={`mb-2 text-xs font-bold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>{actionTitle}</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                className={`rounded-xl border px-3 py-3 text-sm ${dark ? "border-slate-700 bg-slate-800 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-800"}`}
                placeholder={tr(locale, "reasonPlaceholder")}
                placeholderTextColor={dark ? "#94a3b8" : "#64748b"}
              />

              <View className="mt-3 flex-row gap-2">
                <Pressable
                  onPress={submitAction}
                  disabled={actionBusy || !validReason}
                  className={`rounded-xl px-4 py-2 ${actionBusy || !validReason ? "bg-slate-300" : "bg-orange-600"}`}
                >
                  <Text className="text-xs font-black uppercase text-white">{tr(locale, "submitRequest")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setActionType("none");
                    setReason("");
                  }}
                  className={`rounded-xl px-4 py-2 ${dark ? "bg-slate-700" : "bg-slate-200"}`}
                >
                  <Text className={`text-xs font-black uppercase ${dark ? "text-slate-200" : "text-slate-700"}`}>{tr(locale, "back")}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? <Text className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</Text> : null}
      {actionMessage ? <Text className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{actionMessage}</Text> : null}
      {busy ? <Text className={`mt-4 text-center text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Loading...</Text> : null}
    </ScrollView>
  );
}

function InfoRow({ dark, label, value }: { dark: boolean; label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className={`text-xs font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</Text>
      <Text className={`flex-1 text-right text-xs font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>{value}</Text>
    </View>
  );
}
