import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { API_BASE_URL } from "../config/server";
import { tr } from "../i18n/strings";
import { fetchAddressSuggestions, type AddressSuggestion } from "../services/addressService";
import type { CartItem, Locale } from "../types/domain";
import { formatMoney } from "../utils/format";

type Props = {
  locale: Locale;
  dark: boolean;
  cartItems: CartItem[];
  phone: string;
  address: string;
  paymentSlipUri: string | null;
  qrData: string;
  busy: boolean;
  error: string;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onSlipUriChange: (value: string | null) => void;
  onQrDataChange: (value: string) => void;
  onBack: () => void;
  onConfirm: () => void;
};

export function CheckoutScreen({
  locale,
  dark,
  cartItems,
  phone,
  address,
  paymentSlipUri,
  qrData,
  busy,
  error,
  onPhoneChange,
  onAddressChange,
  onSlipUriChange,
  onQrDataChange,
  onBack,
  onConfirm,
}: Props) {
  const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.line_total || item.unit_price * item.quantity || 0), 0);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerLocked, setScannerLocked] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [addressFocused, setAddressFocused] = useState(false);
  const [addressSuggestBusy, setAddressSuggestBusy] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);

  const qrPayload = useMemo(
    () => `LARAPEE_PAY|WAVEPAY|09123456789|U_THUREIN_PHYO|MMK|AMOUNT=${Math.round(totalPrice)}|ORDER_ITEMS=${cartItems.length}`,
    [cartItems.length, totalPrice],
  );
  const qrImageUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayload)}`,
    [qrPayload],
  );
  const scannedAmount = useMemo(() => extractAmountFromQr(qrData), [qrData]);

  useEffect(() => {
    const query = address.trim();
    if (query.length < 2) {
      setAddressSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setAddressSuggestBusy(true);
      try {
        const items = await fetchAddressSuggestions(API_BASE_URL, query, 8);
        setAddressSuggestions(items);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setAddressSuggestBusy(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [address]);

  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        return;
      }
    }

    setScannerLocked(false);
    setScannerVisible(true);
  };

  const downloadQr = async () => {
    await Linking.openURL(qrImageUrl);
  };

  const pickSlipImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    onSlipUriChange(result.assets[0].uri);
  };

  return (
    <>
      <ScrollView className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onBack} className={`h-10 w-10 items-center justify-center rounded-xl border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <Ionicons name="chevron-back" size={18} color={dark ? "#e2e8f0" : "#334155"} />
          </Pressable>
          <Text className={`text-lg font-black ${dark ? "text-white" : "text-slate-900"}`}>{tr(locale, "checkout")}</Text>
          <View className="w-10" />
        </View>

        <View className={`mt-4 rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Text className={`text-sm font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{tr(locale, "paymentMethod")}</Text>
          <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "scanQrToPay")}</Text>

          <View className={`mt-3 items-center rounded-2xl border p-3 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
            <Image source={{ uri: qrImageUrl }} className="h-48 w-48 rounded-xl" resizeMode="contain" />
            <Text className={`mt-2 text-[11px] font-bold ${dark ? "text-slate-300" : "text-slate-700"}`}>Wave/KPay: 09 123 456 789</Text>
            <Text className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>U Thurein Phyo</Text>
            <Text className={`mt-1 text-xs font-black ${dark ? "text-emerald-300" : "text-emerald-700"}`}>Amount: {formatMoney(totalPrice)}</Text>
          </View>

          <View className="mt-3 flex-row gap-2">
            <Pressable onPress={openScanner} className="flex-1 rounded-xl bg-sky-600 py-3">
              <Text className="text-center text-xs font-black text-white">{tr(locale, "scanQr")}</Text>
            </Pressable>
            <Pressable onPress={pickSlipImage} className="flex-1 rounded-xl bg-orange-600 py-3">
              <Text className="text-center text-xs font-black text-white">{tr(locale, "uploadSlip")}</Text>
            </Pressable>
          </View>
          <Pressable onPress={downloadQr} className="mt-2 rounded-xl border border-slate-300 bg-white py-2">
            <Text className="text-center text-xs font-black text-slate-700">Download QR Image</Text>
          </Pressable>

          {qrData ? (
            <View className="mt-2 rounded-lg bg-emerald-50 px-3 py-2">
              <Text className="text-xs font-semibold text-emerald-700">
                {tr(locale, "qrScanned")}: {qrData}
              </Text>
              {scannedAmount !== null ? (
                <Text className={`mt-1 text-xs font-bold ${Math.round(scannedAmount) === Math.round(totalPrice) ? "text-emerald-700" : "text-amber-700"}`}>
                  Scanned Amount: {formatMoney(scannedAmount)} / Expected: {formatMoney(totalPrice)}
                </Text>
              ) : null}
            </View>
          ) : null}

          {paymentSlipUri ? (
            <View className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2">
              <Image source={{ uri: paymentSlipUri }} className="h-36 w-full rounded-lg" resizeMode="cover" />
              <View className="mt-2 flex-row justify-end">
                <Pressable onPress={() => onSlipUriChange(null)} className="rounded-lg bg-rose-600 px-3 py-1.5">
                  <Text className="text-[11px] font-bold text-white">{tr(locale, "remove")}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View className={`mt-4 rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Text className={`text-sm font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{tr(locale, "deliveryAddress")}</Text>

          <View className="mt-3 gap-3">
            <View>
              <Text className={`mb-1 text-xs font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "customerPhone")}</Text>
              <TextInput
                value={phone}
                onChangeText={onPhoneChange}
                keyboardType="phone-pad"
                className={`rounded-xl border px-4 py-3 text-sm ${dark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
                placeholder="09xxxxxxxxx"
                placeholderTextColor={dark ? "#64748b" : "#94a3b8"}
              />
            </View>

            <View>
              <Text className={`mb-1 text-xs font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "addressLine")}</Text>
              <TextInput
                value={address}
                onChangeText={onAddressChange}
                onFocus={() => setAddressFocused(true)}
                onBlur={() => setTimeout(() => setAddressFocused(false), 120)}
                multiline
                numberOfLines={4}
                className={`rounded-xl border px-4 py-3 text-sm ${dark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
                placeholder="No, Street, Township, City"
                placeholderTextColor={dark ? "#64748b" : "#94a3b8"}
              />
              {addressFocused && (addressSuggestBusy || addressSuggestions.length > 0) ? (
                <View className={`mt-2 overflow-hidden rounded-xl border ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                  {addressSuggestBusy ? (
                    <Text className={`px-3 py-2 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Loading suggestions...</Text>
                  ) : (
                    addressSuggestions.map((item) => (
                      <Pressable
                        key={`${item.label}-${item.township || ""}-${item.state || ""}`}
                        onPress={() => {
                          onAddressChange(item.label);
                          setAddressSuggestions([]);
                          setAddressFocused(false);
                        }}
                        className={`border-b px-3 py-2 ${dark ? "border-slate-700" : "border-slate-100"}`}
                      >
                        <Text className={`text-xs font-semibold ${dark ? "text-slate-100" : "text-slate-700"}`}>{item.label}</Text>
                      </Pressable>
                    ))
                  )}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View className={`mt-4 rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Text className={`mb-3 text-sm font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{tr(locale, "cartSummary")}</Text>

          <View className="gap-2">
            {cartItems.map((item) => (
              <View key={item.id} className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className={`text-xs font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>{item.product?.name || `Item #${item.product_id}`}</Text>
                  <Text className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>x {item.quantity}</Text>
                </View>
                <Text className={`text-xs font-bold ${dark ? "text-slate-100" : "text-slate-800"}`}>{formatMoney(item.line_total)}</Text>
              </View>
            ))}
          </View>

          <View className={`mt-3 border-t pt-3 ${dark ? "border-slate-700" : "border-slate-200"}`}>
            <View className="flex-row items-center justify-between">
              <Text className={`${dark ? "text-slate-300" : "text-slate-500"}`}>{tr(locale, "total")}</Text>
              <Text className={`text-lg font-black ${dark ? "text-orange-300" : "text-orange-600"}`}>{formatMoney(totalPrice)}</Text>
            </View>
          </View>

          {error ? <Text className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</Text> : null}

          <Pressable onPress={onConfirm} disabled={busy} className={`mt-4 rounded-xl py-3 ${busy ? "bg-slate-300" : "bg-orange-600"}`}>
            <Text className="text-center text-sm font-black text-white">{busy ? tr(locale, "checkingOut") : tr(locale, "checkout")}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View className="flex-1 bg-black">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={
              scannerLocked
                ? undefined
                : ({ data }) => {
                    setScannerLocked(true);
                    const parsedAmount = extractAmountFromQr(data);
                    onQrDataChange(parsedAmount !== null ? `${data} | amount=${Math.round(parsedAmount)}` : data);
                    setScannerVisible(false);
                  }
            }
          />
          <View className="absolute left-0 right-0 top-12 items-center">
            <Text className="rounded-xl bg-black/50 px-4 py-2 text-xs font-bold text-white">{tr(locale, "scanQr")}</Text>
          </View>
          <View className="absolute bottom-8 left-0 right-0 items-center">
            <Pressable onPress={() => setScannerVisible(false)} className="rounded-xl bg-white px-4 py-3">
              <Text className="text-xs font-black text-slate-900">{tr(locale, "back")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function extractAmountFromQr(value: string): number | null {
  if (!value) return null;
  const amountMatch = value.match(/amount\s*[:=]\s*(\d+(?:\.\d+)?)/i);
  if (amountMatch?.[1]) {
    return Number(amountMatch[1]);
  }

  const lastNumber = value.match(/(\d+(?:\.\d+)?)\s*$/);
  if (lastNumber?.[1]) {
    const parsed = Number(lastNumber[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
