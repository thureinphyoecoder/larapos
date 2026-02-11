import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { tr } from "../i18n/strings";
import { formatMoney } from "../utils/format";
import type { Locale, Product } from "../types/domain";

type Props = {
  locale: Locale;
  dark: boolean;
  product: Product | null;
  busy: boolean;
  error: string;
  adding: boolean;
  onBack: () => void;
  onAddToCart: (product: Product, variantId?: number, quantity?: number) => void;
};

export function ProductDetailScreen({ locale, dark, product, busy, error, adding, onBack, onAddToCart }: Props) {
  const variants = product?.active_variants ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? variants[0],
    [selectedVariantId, variants],
  );
  const effectivePrice = Number(selectedVariant?.effective_price ?? product?.price ?? selectedVariant?.price ?? 0);
  const basePrice = Number(selectedVariant?.base_price ?? product?.base_price ?? selectedVariant?.price ?? effectivePrice);
  const hasDiscount = Boolean(product?.has_discount ?? effectivePrice < basePrice);
  const stockLevel = Number(selectedVariant?.stock_level ?? product?.stock_level ?? 0);
  const totalPrice = effectivePrice * Math.max(1, qty);

  useEffect(() => {
    setSelectedVariantId(product?.active_variants?.[0]?.id ?? null);
    setQty(1);
  }, [product?.id]);

  return (
    <ScrollView className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onBack} className={`h-10 w-10 items-center justify-center rounded-xl border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Ionicons name="chevron-back" size={18} color={dark ? "#e2e8f0" : "#334155"} />
        </Pressable>
        <Text className={`text-lg font-black ${dark ? "text-white" : "text-slate-900"}`}>{tr(locale, "productDetails")}</Text>
        <View className="w-10" />
      </View>

      <View className={`mt-4 overflow-hidden rounded-3xl border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <View className={`aspect-square items-center justify-center ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
          <Text className={`text-5xl font-black ${dark ? "text-slate-500" : "text-slate-300"}`}>{String(product?.name || "?").slice(0, 1).toUpperCase()}</Text>
        </View>

        <View className="p-5">
          <Text className={`text-xl font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{product?.name || "-"}</Text>
          <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{product?.shop?.name || "LaraPee Store"}</Text>

          <View className="mt-4 flex-row items-end gap-2">
            <Text className={`text-2xl font-black ${dark ? "text-orange-300" : "text-orange-600"}`}>{formatMoney(totalPrice)}</Text>
            {hasDiscount ? (
              <Text className={`text-sm line-through ${dark ? "text-slate-500" : "text-slate-400"}`}>{formatMoney(basePrice * Math.max(1, qty))}</Text>
            ) : null}
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <Text className={`text-xs font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "inStock")}</Text>
            <Text className={`text-xs font-black ${stockLevel > 0 ? "text-emerald-600" : "text-rose-600"}`}>{stockLevel}</Text>
          </View>

          {variants.length > 0 ? (
            <View className="mt-4">
              <Text className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "variant")}</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {variants.map((variant) => (
                  <Pressable
                    key={variant.id}
                    onPress={() => setSelectedVariantId(variant.id)}
                    className={`rounded-xl border px-3 py-2 ${
                      selectedVariant?.id === variant.id
                        ? "border-orange-400 bg-orange-50"
                        : dark
                          ? "border-slate-700 bg-slate-800"
                          : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <Text className={`text-xs font-bold ${selectedVariant?.id === variant.id ? "text-orange-600" : dark ? "text-slate-300" : "text-slate-700"}`}>
                      {variant.sku || `#${variant.id}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View className="mt-4 flex-row items-center gap-3">
            <Text className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "quantity")}</Text>
            <View className={`flex-row items-center overflow-hidden rounded-xl border ${dark ? "border-slate-700" : "border-slate-200"}`}>
              <Pressable
                onPress={() => setQty((current) => Math.max(1, current - 1))}
                className={`px-3 py-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}
              >
                <Text className={`font-black ${dark ? "text-slate-100" : "text-slate-700"}`}>-</Text>
              </Pressable>
              <Text className={`px-4 py-2 text-sm font-black ${dark ? "text-slate-100" : "text-slate-800"}`}>{qty}</Text>
              <Pressable
                onPress={() => setQty((current) => current + 1)}
                className={`px-3 py-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}
              >
                <Text className={`font-black ${dark ? "text-slate-100" : "text-slate-700"}`}>+</Text>
              </Pressable>
            </View>
          </View>

          <Text className={`mt-4 text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "description")}</Text>
          <Text className={`mt-2 text-sm leading-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>
            {product?.description || "No description available."}
          </Text>

          {error ? <Text className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</Text> : null}

          <Pressable
            disabled={adding || !product || stockLevel <= 0}
            onPress={() => product && onAddToCart(product, selectedVariant?.id, qty)}
            className={`mt-5 rounded-xl py-3 ${adding || !product || stockLevel <= 0 ? "bg-slate-300" : "bg-orange-600"}`}
          >
            <Text className="text-center text-sm font-black text-white">{adding ? tr(locale, "adding") : tr(locale, "addToCart")}</Text>
          </Pressable>
        </View>
      </View>

      {busy ? <Text className={`mt-4 text-center text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Loading...</Text> : null}
    </ScrollView>
  );
}
