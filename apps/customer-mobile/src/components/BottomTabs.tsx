import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CustomerTab } from "../types/domain";

type TabItem = {
  key: CustomerTab;
  label: string;
};

type Props = {
  activeTab: CustomerTab;
  onChange: (tab: CustomerTab) => void;
  items: TabItem[];
  dark: boolean;
  badges?: Partial<Record<CustomerTab, number>>;
};

export function BottomTabs({ activeTab, onChange, items, dark, badges = {} }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`mx-4 mb-6 flex-row rounded-[28px] border px-2 py-1.5 shadow-sm ${
        dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white/95"
      }`}
      style={{ marginBottom: Math.max(insets.bottom + 8, 20) }}
    >
      {items.map((item) => {
        const active = activeTab === item.key;

        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            className={`flex-1 items-center rounded-2xl px-2 py-2 ${active ? "bg-orange-600" : "bg-transparent"}`}
          >
            <View className="relative">
              <Ionicons name={iconForTab(item.key)} size={16} color={active ? "#ffffff" : dark ? "#cbd5e1" : "#475569"} />
              {Number(badges[item.key] || 0) > 0 ? (
                <View className={`absolute -right-3 -top-2 min-w-[16px] rounded-full px-1 ${active ? "bg-white" : "bg-orange-600"}`}>
                  <Text className={`text-center text-[9px] font-black ${active ? "text-orange-600" : "text-white"}`}>
                    {Number(badges[item.key]) > 99 ? "99+" : Number(badges[item.key])}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className={`mt-1 text-[11px] font-black ${active ? "text-white" : dark ? "text-slate-300" : "text-slate-600"}`}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function iconForTab(tab: CustomerTab): ComponentProps<typeof Ionicons>["name"] {
  if (tab === "home") return "home-outline";
  if (tab === "orders") return "receipt-outline";
  if (tab === "cart") return "bag-handle-outline";
  if (tab === "support") return "chatbubbles-outline";
  return "person-circle-outline";
}
