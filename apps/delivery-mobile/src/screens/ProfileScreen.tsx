import { Pressable, Text, View } from "react-native";

import { type Locale, tr } from "../i18n/strings";
import type { ApiUser, SalaryPreview, StaffProfile } from "../types/domain";
import { formatMMK } from "../utils/formatters";

type ProfileScreenProps = {
  locale: Locale;
  theme: "dark" | "light";
  user: ApiUser;
  profile: StaffProfile | null;
  salaryPreview: SalaryPreview | null;
  onToggleTheme: () => void;
  onLogout: () => void;
  onSetLanguage: (locale: Locale) => void;
};

export function ProfileScreen({ locale, theme, user, profile, salaryPreview, onToggleTheme, onLogout, onSetLanguage }: ProfileScreenProps) {
  const dark = theme === "dark";

  return (
    <View className={`flex-1 px-4 pb-28 pt-14 ${dark ? "bg-slate-950" : "bg-slate-100"}`}>
      <Text className={`text-2xl font-black ${dark ? "text-white" : "text-slate-900"}`}>{tr(locale, "profileTitle")}</Text>

      <View className={`mt-4 rounded-3xl border p-4 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
        <Text className={`text-lg font-black ${dark ? "text-white" : "text-slate-900"}`}>{user.name}</Text>
        <Text className={`mt-1 text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>{user.email}</Text>
        <Text className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "role")}: {user.roles?.join(", ") || "-"}</Text>
        <Text className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "shop")}: {profile?.shop_name || "-"}</Text>
        <Text className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "phone")}: {profile?.phone_number || "-"}</Text>
      </View>

      <View className={`mt-3 rounded-3xl border p-4 ${dark ? "border-emerald-800 bg-emerald-900/20" : "border-emerald-100 bg-emerald-50"}`}>
        <Text className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-emerald-300" : "text-emerald-700"}`}>{tr(locale, "salaryPreview")}</Text>
        <Text className={`mt-2 text-2xl font-black ${dark ? "text-emerald-200" : "text-emerald-700"}`}>{formatMMK(salaryPreview?.net_salary || 0)}</Text>
      </View>

      <View className={`mt-3 rounded-2xl border p-3 ${dark ? "border-slate-800 bg-slate-900/95" : "border-white bg-white"}`}>
        <Text className={`mb-2 text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-600"}`}>{tr(locale, "language")}</Text>
        <View className="flex-row gap-2">
          <Pressable className={`flex-1 items-center rounded-xl px-3 py-2 ${locale === "en" ? "bg-sky-500" : dark ? "bg-slate-800" : "bg-slate-100"}`} onPress={() => onSetLanguage("en")}>
            <Text className={`text-xs font-bold ${locale === "en" ? "text-white" : dark ? "text-slate-100" : "text-slate-700"}`}>EN</Text>
          </Pressable>
          <Pressable className={`flex-1 items-center rounded-xl px-3 py-2 ${locale === "mm" ? "bg-sky-500" : dark ? "bg-slate-800" : "bg-slate-100"}`} onPress={() => onSetLanguage("mm")}>
            <Text className={`text-xs font-bold ${locale === "mm" ? "text-white" : dark ? "text-slate-100" : "text-slate-700"}`}>MM</Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        <Pressable className={`flex-1 items-center rounded-2xl px-4 py-3 ${dark ? "bg-slate-800" : "bg-white"}`} onPress={onToggleTheme}>
          <Text className={`text-sm font-bold ${dark ? "text-slate-100" : "text-slate-700"}`}>{dark ? tr(locale, "lightMode") : tr(locale, "darkMode")}</Text>
        </Pressable>
        <Pressable className="flex-1 items-center rounded-2xl bg-rose-500 px-4 py-3" onPress={onLogout}>
          <Text className="text-sm font-bold text-white">{tr(locale, "logout")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
