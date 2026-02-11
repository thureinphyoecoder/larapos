import { Image, Pressable, Text, View } from "react-native";
import { formatMoney } from "../utils/format";
import type { Product } from "../types/domain";

type Props = {
  product: Product;
  onAdd: (product: Product) => void;
  onOpen: (product: Product) => void;
  adding: boolean;
  dark: boolean;
  addLabel: string;
  addingLabel: string;
  saleLabel: string;
  flashSaleLabel: string;
  inStockLabel: string;
  outOfStockLabel: string;
  stockLeftLabel: string;
  fromLabel: string;
  viewDetailsLabel: string;
};

export function ProductCard({
  product,
  onAdd,
  onOpen,
  adding,
  dark,
  addLabel,
  addingLabel,
  saleLabel,
  flashSaleLabel,
  inStockLabel,
  outOfStockLabel,
  stockLeftLabel,
  fromLabel,
  viewDetailsLabel,
}: Props) {
  const firstVariant = product.active_variants?.[0];
  const effectivePrice = Number(firstVariant?.effective_price ?? product.price ?? firstVariant?.price ?? 0);
  const basePrice = Number(firstVariant?.base_price ?? product.base_price ?? firstVariant?.price ?? effectivePrice);
  const hasDiscount = Boolean(product.has_discount ?? effectivePrice < basePrice);
  const stockLevel = Number(firstVariant?.stock_level ?? product.stock_level ?? 0);
  const inStock = stockLevel > 0;
  const promotionType = String(firstVariant?.promotion?.type || "").toLowerCase();
  const promotionLabel = promotionType === "flash_sale" ? flashSaleLabel : saleLabel;

  return (
    <Pressable
      onPress={() => onOpen(product)}
      className={`w-[48%] overflow-hidden rounded-3xl border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
    >
      <View className={`relative aspect-square overflow-hidden ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full items-center justify-center bg-slate-200 px-4">
            <Text className="text-2xl font-black text-slate-500">{String(product.name || "?").slice(0, 1).toUpperCase()}</Text>
          </View>
        )}

        <View className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1">
          <Text className={`text-[10px] font-black ${inStock ? "text-emerald-700" : "text-rose-700"}`}>{inStock ? inStockLabel : outOfStockLabel}</Text>
        </View>

        {hasDiscount ? (
          <View className="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-1">
            <Text className="text-[10px] font-black text-white">{promotionLabel}</Text>
          </View>
        ) : null}
      </View>

      <View className="p-3">
        <Text className={`min-h-[40px] text-sm font-black ${dark ? "text-slate-100" : "text-slate-900"}`} numberOfLines={2}>
          {product.name}
        </Text>
        <Text className={`mt-1 text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`} numberOfLines={1}>
          {product.shop?.name || "LaraPee Store"}
        </Text>

        <View className="mt-3 flex-row items-end flex-wrap gap-x-1">
          <Text className={`text-[11px] font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>{fromLabel}</Text>
          <Text className={`text-sm font-black ${dark ? "text-orange-300" : "text-orange-600"}`}>{formatMoney(effectivePrice)}</Text>
          {hasDiscount ? (
            <Text className={`text-[11px] line-through ${dark ? "text-slate-500" : "text-slate-400"}`}>{formatMoney(basePrice)}</Text>
          ) : null}
        </View>

        <View className="mt-3 flex-row items-center justify-between border-t border-slate-200/70 pt-3">
          <Text className={`text-[11px] font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>
            {inStock ? `${stockLevel} ${stockLeftLabel}` : outOfStockLabel}
          </Text>
        </View>

        <View className="mt-2 flex-row items-center justify-between">
          <Text className={`text-[11px] font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>{viewDetailsLabel}</Text>
          <Pressable onPress={() => onAdd(product)} disabled={adding || !inStock} className={`rounded-xl px-3 py-2 ${adding || !inStock ? "bg-slate-300" : "bg-orange-600"}`}>
            <Text className="text-[11px] font-black text-white">{adding ? addingLabel : addLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
