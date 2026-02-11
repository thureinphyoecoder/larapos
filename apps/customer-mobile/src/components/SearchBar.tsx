import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { Pressable, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  dark: boolean;
};

export function SearchBar({ value, onChange, placeholder, dark }: Props) {
  return (
    <View
      className={`flex-row items-center rounded-2xl border px-3 py-2.5 ${
        dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
      }`}
    >
      <Ionicons name="search-outline" size={16} color={dark ? "#94a3b8" : "#64748b"} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={dark ? "#94a3b8" : "#9ca3af"}
        value={value}
        onChangeText={onChange}
        className={`ml-2 flex-1 text-sm ${dark ? "text-slate-100" : "text-slate-900"}`}
        returnKeyType="search"
      />
      {value.trim().length ? (
        <Pressable onPress={() => onChange("")} className="ml-1 rounded-full p-1">
          <Ionicons name="close-circle" size={16} color={dark ? "#94a3b8" : "#94a3b8"} />
        </Pressable>
      ) : null}
    </View>
  );
}
