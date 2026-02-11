import { Pressable, ScrollView, Text } from "react-native";
import type { Category } from "../types/domain";

type Props = {
  categories: Category[];
  activeCategoryId: number | null;
  onSelect: (id: number | null) => void;
  dark: boolean;
  allLabel: string;
};

export function CategoryPills({ categories, activeCategoryId, onSelect, dark, allLabel }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1" contentContainerStyle={{ paddingHorizontal: 4 }}>
      <Pill label={allLabel} active={activeCategoryId === null} onPress={() => onSelect(null)} dark={dark} />
      {categories.map((category) => (
        <Pill
          key={category.id}
          label={category.name}
          active={activeCategoryId === category.id}
          onPress={() => onSelect(category.id)}
          dark={dark}
        />
      ))}
    </ScrollView>
  );
}

function Pill({ label, active, onPress, dark }: { label: string; active: boolean; onPress: () => void; dark: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 rounded-full px-4 py-2 ${
        active ? "bg-slate-900" : dark ? "border border-slate-700 bg-slate-900" : "border border-slate-200 bg-slate-50"
      }`}
    >
      <Text className={`text-xs font-extrabold ${active ? "text-white" : dark ? "text-slate-300" : "text-slate-700"}`}>{label}</Text>
    </Pressable>
  );
}
