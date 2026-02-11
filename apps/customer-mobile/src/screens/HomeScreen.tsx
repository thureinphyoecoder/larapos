import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { CategoryPills } from "../components/CategoryPills";
import { ProductCard } from "../components/ProductCard";
import { SearchBar } from "../components/SearchBar";
import { tr } from "../i18n/strings";
import type { Category, Locale, Product } from "../types/domain";

type Props = {
  locale: Locale;
  dark: boolean;
  userName: string;
  query: string;
  categories: Category[];
  activeCategoryId: number | null;
  products: Product[];
  addingProductId: number | null;
  refreshing: boolean;
  onQueryChange: (value: string) => void;
  onSelectCategory: (id: number | null) => void;
  onAddToCart: (product: Product) => void;
  onOpenProduct: (product: Product) => void;
  onRefresh: () => void;
};

export function HomeScreen({
  locale,
  dark,
  userName,
  query,
  categories,
  activeCategoryId,
  products,
  addingProductId,
  refreshing,
  onQueryChange,
  onSelectCategory,
  onAddToCart,
  onOpenProduct,
  onRefresh,
}: Props) {
  return (
    <ScrollView
      className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`}
      contentContainerStyle={{ padding: 16, paddingBottom: 132 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className={`text-3xl font-black tracking-tight ${dark ? "text-orange-300" : "text-orange-600"}`}>LaraPee</Text>
          <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "homeWelcomeSubtitle")}</Text>
        </View>
        <View className={`h-11 w-11 items-center justify-center rounded-2xl border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Ionicons name="notifications-outline" size={18} color={dark ? "#e2e8f0" : "#334155"} />
        </View>
      </View>

      <View className="relative mt-4 overflow-hidden rounded-3xl bg-orange-600 px-5 py-6">
        <View className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-white/20" />
        <View className="absolute -left-6 -bottom-8 h-24 w-24 rounded-full bg-amber-300/40" />

        <Text className="text-[11px] font-extrabold uppercase tracking-widest text-orange-100">{tr(locale, "featuredProducts")}</Text>
        <Text className="mt-3 text-2xl font-black leading-tight text-white">
          {tr(locale, "welcomeBack")}, {userName}
        </Text>
        <Text className="mt-2 text-xs leading-5 text-orange-100">{tr(locale, "pullToRefresh")}</Text>

        <View className="mt-5 flex-row gap-3">
          <StatPill label={tr(locale, "discoverProducts")} value={String(products.length)} />
          <StatPill label={tr(locale, "categories")} value={String(categories.length)} />
        </View>
      </View>

      <View className="mt-4">
        <SearchBar value={query} onChange={onQueryChange} placeholder={tr(locale, "searchPlaceholder")} dark={dark} />
      </View>

      <View className="mt-4">
        <Text className={`mb-2 text-sm font-black ${dark ? "text-slate-200" : "text-slate-700"}`}>{tr(locale, "categories")}</Text>
        <CategoryPills
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelect={onSelectCategory}
          dark={dark}
          allLabel={tr(locale, "all")}
        />
      </View>

      <View className="mt-5">
        <View className="flex-row items-end justify-between">
          <Text className={`text-lg font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{tr(locale, "discoverProducts")}</Text>
          <Text className={`text-xs font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {products.length} {tr(locale, "itemsFound")}
          </Text>
        </View>

        {products.length ? (
          <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                dark={dark}
                adding={addingProductId === product.id}
                onAdd={onAddToCart}
                onOpen={onOpenProduct}
                addLabel={tr(locale, "addToCart")}
                addingLabel={tr(locale, "adding")}
                saleLabel={tr(locale, "sale")}
                flashSaleLabel={tr(locale, "flashSale")}
                inStockLabel={tr(locale, "inStock")}
                outOfStockLabel={tr(locale, "outOfStock")}
                stockLeftLabel={tr(locale, "stockLeft")}
                fromLabel={tr(locale, "fromLabel")}
                viewDetailsLabel={tr(locale, "viewDetails")}
              />
            ))}
          </View>
        ) : (
          <View className={`mt-3 rounded-2xl border p-6 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <Text className={`text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}>{tr(locale, "noProducts")}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-2xl border border-white/40 bg-white/20 px-3 py-2">
      <Text className="text-[10px] font-bold uppercase tracking-wide text-orange-100">{label}</Text>
      <Text className="text-lg font-black text-white">{value}</Text>
    </View>
  );
}
