import { useMemo, useState } from "react";
import { Image, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";

import type { Order } from "../types/domain";
import { formatDateTime, formatMMK } from "../utils/formatters";

type OrderDetailScreenProps = {
  order: Order;
  busyAction: boolean;
  refreshing: boolean;
  theme: "dark" | "light";
  onBack: () => void;
  onRefresh: () => void;
  onUpdateLocation: () => void;
  onUploadProof: () => void;
  onMarkDelivered: () => void;
};

export function OrderDetailScreen({
  order,
  busyAction,
  refreshing,
  theme,
  onBack,
  onRefresh,
  onUpdateLocation,
  onUploadProof,
  onMarkDelivered,
}: OrderDetailScreenProps) {
  const [showItems, setShowItems] = useState(false);
  const dark = theme === "dark";

  const coordinates = useMemo(() => {
    if (order.delivery_lat === null || order.delivery_lng === null) {
      return null;
    }

    return {
      latitude: Number(order.delivery_lat),
      longitude: Number(order.delivery_lng),
    };
  }, [order.delivery_lat, order.delivery_lng]);

  async function openInOsm() {
    if (!coordinates) return;
    const url = `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=16/${coordinates.latitude}/${coordinates.longitude}`;
    await Linking.openURL(url);
  }

  return (
    <View className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`}>
      <View className="absolute -left-20 top-8 h-52 w-52 rounded-full bg-cyan-400/15" />
      <View className="absolute -right-16 top-40 h-48 w-48 rounded-full bg-emerald-400/15" />

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 28, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dark ? "#e2e8f0" : "#0f172a"} />}
      >
        <Pressable onPress={onBack} className="self-start rounded-full bg-slate-800/70 px-4 py-2">
          <Text className="text-sm font-bold text-slate-100">← Order List</Text>
        </Pressable>

        <View className={`rounded-3xl border p-5 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
          <View className="flex-row items-start justify-between">
            <Text className={`text-2xl font-black ${dark ? "text-white" : "text-slate-900"}`}>Order #{order.id}</Text>
            <StatusChip status={order.status} />
          </View>
          <Text className={`mt-2 text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>Invoice: {order.invoice_no ?? "-"}</Text>
          <Text className={`text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>Amount: {formatMMK(order.total_amount)}</Text>
          <Text className={`text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>Phone: {order.phone ?? "-"}</Text>
          <Text className={`text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>Address: {order.address ?? "-"}</Text>
        </View>

        <View className={`rounded-3xl border p-4 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
          <View className="flex-row items-center justify-between">
            <Text className={`text-sm font-bold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-600"}`}>Live Location (OSM)</Text>
            <Pressable
              className={`rounded-full px-3 py-1 ${coordinates ? "bg-cyan-500" : "bg-slate-500"}`}
              onPress={() => void openInOsm()}
              disabled={!coordinates}
            >
              <Text className="text-xs font-bold text-white">Open Map</Text>
            </Pressable>
          </View>

          {coordinates ? (
            <View className="mt-3 overflow-hidden rounded-2xl">
              <MapView
                style={{ width: "100%", height: 240 }}
                initialRegion={{
                  ...coordinates,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                mapType="none"
              >
                <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
                <Marker coordinate={coordinates} title="Delivery Location" />
              </MapView>
            </View>
          ) : (
            <Text className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>Location မတင်ရသေးပါ။</Text>
          )}

          <Text className={`mt-2 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Updated: {formatDateTime(order.delivery_updated_at)}</Text>
        </View>

        <View className={`rounded-3xl border p-4 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
          <Text className={`text-sm font-bold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-600"}`}>Actions</Text>

          <Pressable
            className={`mt-3 items-center rounded-2xl px-4 py-3 ${busyAction ? "bg-slate-700" : dark ? "bg-slate-200" : "bg-slate-900"}`}
            disabled={busyAction}
            onPress={onUpdateLocation}
          >
            <Text className={`text-sm font-bold ${dark ? "text-slate-900" : "text-white"}`}>လက်ရှိတည်နေရာ Update</Text>
          </Pressable>

          <Pressable
            className={`mt-2 items-center rounded-2xl px-4 py-3 ${busyAction ? "bg-slate-700" : "bg-cyan-500"}`}
            disabled={busyAction}
            onPress={onUploadProof}
          >
            <Text className="text-sm font-bold text-white">ပို့ဆောင်ပုံ Upload + Shipped</Text>
          </Pressable>

          <Pressable
            className={`mt-2 items-center rounded-2xl px-4 py-3 ${order.status === "shipped" && !busyAction ? "bg-emerald-500" : "bg-slate-700"}`}
            disabled={order.status !== "shipped" || busyAction}
            onPress={onMarkDelivered}
          >
            <Text className="text-sm font-bold text-white">Delivered အဖြစ်သတ်မှတ်မည်</Text>
          </Pressable>
        </View>

        <View className={`rounded-3xl border p-4 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
          <Pressable onPress={() => setShowItems((prev) => !prev)}>
            <Text className={`text-sm font-bold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-600"}`}>
              ကုန်ပစ္စည်းအသေးစိတ် {showItems ? "(ဝှက်မည်)" : "(ပြမည်)"}
            </Text>
          </Pressable>

          {showItems ? (
            (order.items ?? []).length ? (
              order.items?.map((item) => (
                <View key={item.id} className={`mt-3 rounded-xl p-3 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <Text className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>{item.product?.name ?? "Item"}</Text>
                  <Text className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>Qty: {item.quantity} • {formatMMK(item.line_total)}</Text>
                </View>
              ))
            ) : (
              <Text className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>Item data မရရှိပါ။</Text>
            )
          ) : (
            <Text className={`mt-2 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>လိုအပ်မှသာ ဖွင့်ကြည့်နိုင်ပါတယ်။</Text>
          )}
        </View>

        <View className={`rounded-3xl border p-4 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
          <Text className={`text-sm font-bold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-600"}`}>Delivery Proof</Text>
          {order.delivery_proof_url ? (
            <Image source={{ uri: order.delivery_proof_url }} className="mt-3 h-56 w-full rounded-2xl bg-slate-100" />
          ) : (
            <Text className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>ပို့ဆောင်ပုံ မတင်ရသေးပါ။</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === "confirmed") {
    return (
      <View className="rounded-full bg-amber-100 px-3 py-1">
        <Text className="text-[11px] font-bold uppercase text-amber-700">confirmed</Text>
      </View>
    );
  }

  if (status === "shipped") {
    return (
      <View className="rounded-full bg-sky-100 px-3 py-1">
        <Text className="text-[11px] font-bold uppercase text-sky-700">shipped</Text>
      </View>
    );
  }

  if (status === "delivered") {
    return (
      <View className="rounded-full bg-emerald-100 px-3 py-1">
        <Text className="text-[11px] font-bold uppercase text-emerald-700">delivered</Text>
      </View>
    );
  }

  return (
    <View className="rounded-full bg-slate-100 px-3 py-1">
      <Text className="text-[11px] font-bold uppercase text-slate-700">{status}</Text>
    </View>
  );
}
