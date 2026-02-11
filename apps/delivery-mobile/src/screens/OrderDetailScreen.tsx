import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Image, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type Locale, tr } from "../i18n/strings";
import type { Order } from "../types/domain";
import { formatDateTime, formatMMK } from "../utils/formatters";

type OrderDetailScreenProps = {
  locale: Locale;
  order: Order;
  busyAction: boolean;
  actionMessage: string;
  actionError: string;
  refreshing: boolean;
  theme: "dark" | "light";
  onBack: () => void;
  onRefresh: () => void;
  onUpdateLocation: () => void;
  onUploadProof: () => void;
  onMarkDelivered: () => void;
};

export function OrderDetailScreen({
  locale,
  order,
  busyAction,
  actionMessage,
  actionError,
  refreshing,
  theme,
  onBack,
  onRefresh,
  onUpdateLocation,
  onUploadProof,
  onMarkDelivered,
}: OrderDetailScreenProps) {
  const [showItems, setShowItems] = useState(false);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofLoadFailed, setProofLoadFailed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const dark = theme === "dark";
  const insets = useSafeAreaInsets();
  const proofUrls = useMemo(() => {
    if (order.delivery_proof_urls?.length) {
      return order.delivery_proof_urls;
    }

    return order.delivery_proof_url ? [order.delivery_proof_url] : [];
  }, [order.delivery_proof_url, order.delivery_proof_urls]);

  const coordinates = useMemo(() => {
    if (order.delivery_lat === null || order.delivery_lng === null) {
      return null;
    }

    return {
      latitude: Number(order.delivery_lat),
      longitude: Number(order.delivery_lng),
    };
  }, [order.delivery_lat, order.delivery_lng]);

  async function openInMaps() {
    if (!coordinates) return;
    const label = encodeURIComponent(`Order ${order.id} Delivery Location`);
    const latLng = `${coordinates.latitude},${coordinates.longitude}`;
    const nativeUrl =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${latLng}&q=${label}`
        : `geo:${latLng}?q=${latLng}(${label})`;
    const webFallback = `https://www.google.com/maps/search/?api=1&query=${latLng}`;

    const supported = await Linking.canOpenURL(nativeUrl);
    await Linking.openURL(supported ? nativeUrl : webFallback);
  }

  return (
    <View className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: Math.max(24, insets.bottom + 20), gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dark ? "#e2e8f0" : "#0f172a"} />}
      >
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onBack} className={`flex-row items-center rounded-full px-3 py-2 ${dark ? "bg-slate-900" : "bg-white"}`}>
            <Ionicons name="arrow-back" size={16} color={dark ? "#e2e8f0" : "#0f172a"} />
            <Text className={`ml-2 text-xs font-bold ${dark ? "text-slate-200" : "text-slate-800"}`}>{tr(locale, "orderListBack")}</Text>
          </Pressable>
          <StatusChip status={order.status} />
        </View>

        <View className={`rounded-2xl border px-4 py-4 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <View className="flex-row items-start justify-between">
            <Text className={`text-xl font-black ${dark ? "text-white" : "text-slate-900"}`}>#{order.id}</Text>
            <StatusChip status={order.status} />
          </View>
          <Text className={`mt-1 text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "invoice")}: {order.invoice_no ?? "-"}</Text>
          <Text className={`mt-1 text-lg font-black ${dark ? "text-cyan-300" : "text-cyan-700"}`}>{formatMMK(order.total_amount)}</Text>
          <View className={`mt-3 rounded-xl px-3 py-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
            <Text className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "phone")}: {order.phone ?? "-"}</Text>
            <Text className={`mt-1 text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{order.address ?? "-"}</Text>
          </View>
        </View>

        <View className={`rounded-2xl border p-4 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <View className="flex-row items-center justify-between">
            <Text className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "liveLocation")}</Text>
            <Pressable
              className={`rounded-full px-3 py-1 ${coordinates ? (dark ? "bg-cyan-500/20" : "bg-cyan-100") : dark ? "bg-slate-700" : "bg-slate-200"}`}
              onPress={() => void openInMaps()}
              disabled={!coordinates}
            >
              <Text className={`text-xs font-bold ${coordinates ? (dark ? "text-cyan-200" : "text-cyan-800") : dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "openMap")}</Text>
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
                mapType="standard"
              >
                <Marker coordinate={coordinates} title="Delivery Location" />
              </MapView>
            </View>
          ) : (
            <Text className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "locationMissing")}</Text>
          )}

          <Text className={`mt-2 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "updatedAt")}: {formatDateTime(order.delivery_updated_at)}</Text>
        </View>

        <View className={`rounded-2xl border p-4 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Text className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "actions")}</Text>

          <Pressable
            className={`mt-3 flex-row items-center justify-between rounded-xl px-4 py-3 ${busyAction ? "bg-slate-700" : dark ? "bg-slate-800" : "bg-slate-900"}`}
            disabled={busyAction}
            onPress={onUpdateLocation}
          >
            <View className="flex-row items-center">
              <Ionicons name="locate-outline" size={16} color="#fff" />
              <Text className="ml-2 text-sm font-bold text-white">{tr(locale, "updateLocation")}</Text>
            </View>
            {busyAction ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="chevron-forward" size={16} color="#fff" />}
          </Pressable>

          <Pressable
            className={`mt-2 flex-row items-center justify-between rounded-xl px-4 py-3 ${busyAction ? "bg-slate-700" : "bg-cyan-500"}`}
            disabled={busyAction}
            onPress={onUploadProof}
          >
            <View className="flex-row items-center">
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text className="ml-2 text-sm font-bold text-white">{tr(locale, "uploadProofShipped")}</Text>
            </View>
            {busyAction ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="chevron-forward" size={16} color="#fff" />}
          </Pressable>

          <Pressable
            className={`mt-2 flex-row items-center justify-between rounded-xl px-4 py-3 ${order.status === "shipped" && !busyAction ? "bg-emerald-500" : "bg-slate-700"}`}
            disabled={order.status !== "shipped" || busyAction}
            onPress={onMarkDelivered}
          >
            <View className="flex-row items-center">
              <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
              <Text className="ml-2 text-sm font-bold text-white">{tr(locale, "markDelivered")}</Text>
            </View>
            {busyAction ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="chevron-forward" size={16} color="#fff" />}
          </Pressable>

          <View className={`mt-3 rounded-xl px-3 py-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
            <Text className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>
              {actionMessage || tr(locale, "actionIdleHint")}
            </Text>
            {actionError ? <Text className="mt-1 text-xs font-semibold text-rose-400">{actionError}</Text> : null}
          </View>
        </View>

        <View className={`rounded-2xl border p-4 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Pressable onPress={() => setShowItems((prev) => !prev)}>
            <Text className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-600"}`}>
              {tr(locale, "itemDetails")} {showItems ? `(${tr(locale, "hide")})` : `(${tr(locale, "show")})`}
            </Text>
          </Pressable>

          {showItems ? (
            (order.items ?? []).length ? (
              order.items?.map((item) => (
                <View key={item.id} className={`mt-3 rounded-xl p-3 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <Text className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>{item.product?.name ?? "Item"}</Text>
                  <Text className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "qty")}: {item.quantity} • {formatMMK(item.line_total)}</Text>
                </View>
              ))
            ) : (
              <Text className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "itemDataMissing")}</Text>
            )
          ) : (
            <Text className={`mt-2 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "openWhenNeeded")}</Text>
          )}
        </View>

        <View className={`rounded-2xl border p-4 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Text className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "deliveryProof")}</Text>
          {proofUrls.length ? (
            <View className={`mt-3 overflow-hidden rounded-2xl border p-2 ${dark ? "border-slate-700 bg-slate-800/80" : "border-slate-200 bg-slate-50"}`}>
              <Image
                source={{ uri: proofUrls[Math.min(viewerIndex, proofUrls.length - 1)] }}
                className="h-64 w-full rounded-xl"
                resizeMode="cover"
                onLoadStart={() => {
                  setProofLoading(true);
                  setProofLoadFailed(false);
                }}
                onLoadEnd={() => setProofLoading(false)}
                onError={() => {
                  setProofLoading(false);
                  setProofLoadFailed(true);
                }}
              />
              {proofLoading ? (
                <View className="absolute inset-0 items-center justify-center bg-slate-900/35">
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : null}
              {proofLoadFailed ? (
                <View className="absolute inset-0 items-center justify-center px-4">
                  <Text className="text-center text-sm font-semibold text-white">Proof image မဖွင့်နိုင်ပါ။ Connection/URL ကိုစစ်ပြီး refresh ပြန်လုပ်ပါ။</Text>
                </View>
              ) : null}

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2" contentContainerStyle={{ gap: 8 }}>
                {proofUrls.map((uri, index) => (
                  <Pressable
                    key={`${uri}-${index}`}
                    onPress={() => {
                      setViewerIndex(index);
                      setViewerOpen(true);
                    }}
                    className={`overflow-hidden rounded-xl border ${index === viewerIndex ? "border-cyan-400" : dark ? "border-slate-700" : "border-slate-300"}`}
                  >
                    <Image source={{ uri }} className="h-16 w-16" resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
              <Text className={`mt-2 text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{proofUrls.length} files</Text>
            </View>
          ) : (
            <Text className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "proofMissing")}</Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={viewerOpen} animationType="fade" transparent onRequestClose={() => setViewerOpen(false)}>
        <View className="flex-1 bg-black/90">
          <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12 }} className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-white">
              Proof {Math.min(viewerIndex + 1, proofUrls.length)} / {proofUrls.length}
            </Text>
            <Pressable onPress={() => setViewerOpen(false)} className="rounded-full bg-white/15 px-3 py-1.5">
              <Text className="text-sm font-bold text-white">Close</Text>
            </Pressable>
          </View>

          <View className="mt-3 flex-1 items-center justify-center px-3">
            {proofUrls[viewerIndex] ? <Image source={{ uri: proofUrls[viewerIndex] }} className="h-full w-full" resizeMode="contain" /> : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: Math.max(insets.bottom + 14, 18), gap: 8 }}
          >
            {proofUrls.map((uri, index) => (
              <Pressable
                key={`${uri}-viewer-${index}`}
                className={`h-16 w-16 overflow-hidden rounded-lg border ${index === viewerIndex ? "border-cyan-400" : "border-white/30"}`}
                onPress={() => setViewerIndex(index)}
              >
                <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === "confirmed") {
    return (
      <View className="rounded-full border border-amber-500/30 bg-amber-100 px-3 py-1">
        <Text className="text-[10px] font-bold uppercase text-amber-700">confirmed</Text>
      </View>
    );
  }

  if (status === "shipped") {
    return (
      <View className="rounded-full border border-sky-500/30 bg-sky-100 px-3 py-1">
        <Text className="text-[10px] font-bold uppercase text-sky-700">shipped</Text>
      </View>
    );
  }

  if (status === "delivered") {
    return (
      <View className="rounded-full border border-emerald-500/30 bg-emerald-100 px-3 py-1">
        <Text className="text-[10px] font-bold uppercase text-emerald-700">delivered</Text>
      </View>
    );
  }

  return (
    <View className="rounded-full bg-slate-100 px-3 py-1">
      <Text className="text-[11px] font-bold uppercase text-slate-700">{status}</Text>
    </View>
  );
}
