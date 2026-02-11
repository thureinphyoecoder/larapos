import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { tr } from "../i18n/strings";
import { formatDate, formatMoney } from "../utils/format";
import type { Locale, Product } from "../types/domain";

type Props = {
  locale: Locale;
  dark: boolean;
  product: Product | null;
  busy: boolean;
  error: string;
  reviewBusy: boolean;
  reviewError: string;
  reviewMessage: string;
  adding: boolean;
  onBack: () => void;
  onOpenCart: () => void;
  cartCount: number;
  onOpenProduct: (product: Product) => void;
  onAddToCart: (product: Product, variantId?: number, quantity?: number) => void;
  onSubmitReview: (rating: number | null, comment: string) => void;
};

export function ProductDetailScreen({
  locale,
  dark,
  product,
  busy,
  error,
  reviewBusy,
  reviewError,
  reviewMessage,
  adding,
  onBack,
  onOpenCart,
  cartCount,
  onOpenProduct,
  onAddToCart,
  onSubmitReview,
}: Props) {
  const variants = (product?.active_variants && product.active_variants.length ? product.active_variants : product?.variants) ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"details" | "reviews">("details");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? variants[0],
    [selectedVariantId, variants],
  );
  const galleryImages = useMemo(() => {
    const dynamic = [product?.image_url].filter((item): item is string => Boolean(item));
    const fallback = [
      `https://placehold.co/600x600/F59E0B/FFFFFF?text=${encodeURIComponent(product?.name || "Product")}`,
      "https://placehold.co/600x600/FB923C/FFFFFF?text=Detail+1",
      "https://placehold.co/600x600/F97316/FFFFFF?text=Detail+2",
    ];
    return [...dynamic, ...fallback];
  }, [product?.image_url, product?.name]);
  const [selectedImage, setSelectedImage] = useState<string | null>(galleryImages[0] || null);
  const firstVariantId = variants[0]?.id ?? null;
  const firstGalleryImage = galleryImages[0] || null;
  const effectivePrice = Number(selectedVariant?.effective_price ?? product?.price ?? selectedVariant?.price ?? 0);
  const basePrice = Number(selectedVariant?.base_price ?? product?.base_price ?? selectedVariant?.price ?? effectivePrice);
  const hasDiscount = Boolean(product?.has_discount ?? effectivePrice < basePrice);
  const stockLevel = Number(selectedVariant?.stock_level ?? product?.stock_level ?? 0);
  const totalPrice = effectivePrice * Math.max(1, qty);
  const ratingAverage = Number(product?.rating_summary?.average || 0);
  const ratingCount = Number(product?.rating_summary?.count || 0);
  const reviews = product?.reviews || [];
  const recommendations = product?.recommendations || [];

  useEffect(() => {
    setSelectedVariantId(firstVariantId);
    setQty(1);
    setSelectedImage((product?.image_url || firstGalleryImage) as string | null);
    setTab("details");
    setReviewRating(5);
    setReviewComment("");
  }, [firstGalleryImage, firstVariantId, product?.id, product?.image_url]);

  return (
    <ScrollView className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onBack} className={`h-10 w-10 items-center justify-center rounded-xl border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Ionicons name="chevron-back" size={18} color={dark ? "#e2e8f0" : "#334155"} />
        </Pressable>
        <Text className={`text-lg font-black ${dark ? "text-white" : "text-slate-900"}`}>{tr(locale, "productDetails")}</Text>
        <Pressable onPress={onOpenCart} className={`relative h-10 w-10 items-center justify-center rounded-xl border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Ionicons name="bag-handle-outline" size={16} color={dark ? "#e2e8f0" : "#334155"} />
          {cartCount > 0 ? (
            <View className="absolute -right-1 -top-1 rounded-full bg-orange-600 px-1.5 py-0.5">
              <Text className="text-[9px] font-black text-white">{cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View className={`mt-4 overflow-hidden rounded-3xl border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <View className={`aspect-square items-center justify-center ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Text className={`text-5xl font-black ${dark ? "text-slate-500" : "text-slate-300"}`}>{String(product?.name || "?").slice(0, 1).toUpperCase()}</Text>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-3 py-3">
          {galleryImages.map((imageUrl) => (
            <Pressable
              key={imageUrl}
              onPress={() => setSelectedImage(imageUrl)}
              className={`mr-2 h-16 w-16 overflow-hidden rounded-xl border ${
                selectedImage === imageUrl ? "border-orange-400" : dark ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>

        <View className="p-5">
          <Text className={`text-xl font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{product?.name || "-"}</Text>
          <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{product?.shop?.name || "LaraPee Store"}</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <Text className={`text-xs font-bold ${dark ? "text-amber-300" : "text-amber-600"}`}>{"★".repeat(Math.round(ratingAverage || 0))}</Text>
            <Text className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>
              {ratingAverage.toFixed(1)} ({ratingCount})
            </Text>
          </View>

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

          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={() => setTab("details")}
              className={`rounded-full px-3 py-1.5 ${tab === "details" ? "bg-orange-600" : dark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <Text className={`text-[11px] font-black uppercase ${tab === "details" ? "text-white" : dark ? "text-slate-300" : "text-slate-600"}`}>
                {tr(locale, "description")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab("reviews")}
              className={`rounded-full px-3 py-1.5 ${tab === "reviews" ? "bg-orange-600" : dark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <Text className={`text-[11px] font-black uppercase ${tab === "reviews" ? "text-white" : dark ? "text-slate-300" : "text-slate-600"}`}>
                {tr(locale, "customerReviews")}
              </Text>
            </Pressable>
          </View>

          {tab === "details" ? (
            <>
              <Text className={`mt-4 text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "description")}</Text>
              <Text className={`mt-2 text-sm leading-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                {product?.description || "No description available."}
              </Text>
            </>
          ) : (
            <View className="mt-4">
              <View className={`rounded-xl border p-3 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                <Text className={`text-xs font-black ${dark ? "text-slate-200" : "text-slate-700"}`}>{tr(locale, "writeReview")}</Text>
                <View className="mt-2 flex-row gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Pressable key={value} onPress={() => setReviewRating(value)}>
                      <Text className={`text-lg ${value <= reviewRating ? "text-amber-500" : dark ? "text-slate-600" : "text-slate-300"}`}>★</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={3}
                  placeholder={tr(locale, "reviewPlaceholder")}
                  placeholderTextColor={dark ? "#64748b" : "#94a3b8"}
                  className={`mt-2 rounded-xl border px-3 py-3 text-sm ${dark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
                />
                <Pressable
                  onPress={() => onSubmitReview(reviewRating, reviewComment)}
                  disabled={reviewBusy}
                  className={`mt-2 rounded-xl py-2 ${reviewBusy ? "bg-slate-300" : "bg-orange-600"}`}
                >
                  <Text className="text-center text-xs font-black text-white">{reviewBusy ? tr(locale, "savingProfile") : tr(locale, "submitRequest")}</Text>
                </Pressable>
                {reviewError ? <Text className="mt-2 text-xs font-semibold text-rose-600">{reviewError}</Text> : null}
                {reviewMessage ? <Text className="mt-2 text-xs font-semibold text-emerald-600">{reviewMessage}</Text> : null}
              </View>

              {reviews.length ? (
                <View className="mt-3 gap-3">
                  {reviews.map((review) => (
                    <View key={review.id} className={`rounded-xl border p-3 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-100 bg-slate-50"}`}>
                      <View className="flex-row items-center justify-between">
                        <Text className={`text-xs font-black ${dark ? "text-slate-200" : "text-slate-800"}`}>{review.reviewer_name || "Customer"}</Text>
                        <Text className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>{formatDate(review.created_at || null)}</Text>
                      </View>
                      <Text className={`mt-1 text-xs ${dark ? "text-amber-300" : "text-amber-600"}`}>{"★".repeat(Number(review.rating || 0))}</Text>
                      <Text className={`mt-2 text-sm ${dark ? "text-slate-300" : "text-slate-700"}`}>{review.comment || "-"}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "noReviews")}</Text>
              )}
            </View>
          )}

          {error ? <Text className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</Text> : null}

          <Pressable
            disabled={adding || !product || stockLevel <= 0}
            onPress={() => product && onAddToCart(product, selectedVariant?.id, qty)}
            className={`mt-5 rounded-xl py-3 ${adding || !product || stockLevel <= 0 ? "bg-slate-300" : "bg-orange-600"}`}
          >
            <Text className="text-center text-sm font-black text-white">{adding ? tr(locale, "adding") : tr(locale, "addToCart")}</Text>
          </Pressable>
          <Pressable
            onPress={onOpenCart}
            className={`mt-2 rounded-xl border py-3 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
          >
            <Text className={`text-center text-xs font-black ${dark ? "text-slate-200" : "text-slate-700"}`}>
              Open Cart ({cartCount})
            </Text>
          </Pressable>
        </View>
      </View>

      {recommendations.length ? (
        <View className={`mt-4 rounded-3xl border p-4 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Text className={`text-sm font-black uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-700"}`}>AI Recommendations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            {recommendations.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onOpenProduct(item)}
                className={`mr-3 w-36 overflow-hidden rounded-2xl border ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
              >
                <View className={`${dark ? "bg-slate-700" : "bg-slate-200"} aspect-square`}>
                  {item.image_url ? <Image source={{ uri: item.image_url }} className="h-full w-full" resizeMode="cover" /> : null}
                </View>
                <View className="p-2">
                  <Text className={`text-xs font-black ${dark ? "text-slate-100" : "text-slate-800"}`} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className="mt-1 text-[11px] font-bold text-orange-600">{formatMoney(Number(item.price || 0))}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {busy ? <Text className={`mt-4 text-center text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Loading...</Text> : null}
    </ScrollView>
  );
}
