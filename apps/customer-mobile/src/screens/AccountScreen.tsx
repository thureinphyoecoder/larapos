import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { tr } from "../i18n/strings";
import type { Locale, ThemeMode } from "../types/domain";

type Props = {
  locale: Locale;
  dark: boolean;
  userName: string;
  userEmail: string;
  theme: ThemeMode;
  profileBusy: boolean;
  profileError: string;
  profileMessage: string;
  profileName: string;
  profileEmail: string;
  profilePhone: string;
  profileNrc: string;
  profileAddress: string;
  profileCity: string;
  profileState: string;
  profilePostalCode: string;
  onProfileNameChange: (value: string) => void;
  onProfileEmailChange: (value: string) => void;
  onProfilePhoneChange: (value: string) => void;
  onProfileNrcChange: (value: string) => void;
  onProfileAddressChange: (value: string) => void;
  onProfileCityChange: (value: string) => void;
  onProfileStateChange: (value: string) => void;
  onProfilePostalCodeChange: (value: string) => void;
  onSaveProfile: () => void;
  onToggleLocale: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
};

export function AccountScreen({
  locale,
  dark,
  userName,
  userEmail,
  theme,
  profileBusy,
  profileError,
  profileMessage,
  profileName,
  profileEmail,
  profilePhone,
  profileNrc,
  profileAddress,
  profileCity,
  profileState,
  profilePostalCode,
  onProfileNameChange,
  onProfileEmailChange,
  onProfilePhoneChange,
  onProfileNrcChange,
  onProfileAddressChange,
  onProfileCityChange,
  onProfileStateChange,
  onProfilePostalCodeChange,
  onSaveProfile,
  onToggleLocale,
  onToggleTheme,
  onLogout,
}: Props) {
  return (
    <ScrollView className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`} contentContainerStyle={{ padding: 16, paddingBottom: 132 }}>
      <View className={`rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <Text className={`text-2xl font-black ${dark ? "text-white" : "text-slate-900"}`}>{tr(locale, "accountTitle")}</Text>
        <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{tr(locale, "accountSubtitle")}</Text>
      </View>

      <View className={`mt-4 rounded-2xl border p-5 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <View className={`h-12 w-12 items-center justify-center rounded-2xl ${dark ? "bg-slate-700" : "bg-orange-100"}`}>
          <Text className={`text-lg font-black ${dark ? "text-orange-300" : "text-orange-700"}`}>{String(userName || "U").slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text className={`mt-3 text-lg font-black ${dark ? "text-white" : "text-slate-900"}`}>{userName}</Text>
        <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{userEmail}</Text>
      </View>

      <View className={`mt-3 rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <Text className={`text-sm font-black ${dark ? "text-slate-100" : "text-slate-900"}`}>{tr(locale, "accountProfile")}</Text>

        <View className="mt-3 gap-3">
          <InputField label={tr(locale, "name")} value={profileName} onChange={onProfileNameChange} dark={dark} />
          <InputField label={tr(locale, "email")} value={profileEmail} onChange={onProfileEmailChange} dark={dark} autoCapitalize="none" keyboardType="email-address" />
          <InputField label={tr(locale, "phoneNumber")} value={profilePhone} onChange={onProfilePhoneChange} dark={dark} keyboardType="phone-pad" />
          <InputField label={tr(locale, "nrcNumber")} value={profileNrc} onChange={onProfileNrcChange} dark={dark} />
          <InputField label={tr(locale, "addressLine")} value={profileAddress} onChange={onProfileAddressChange} dark={dark} />
          <InputField label={tr(locale, "city")} value={profileCity} onChange={onProfileCityChange} dark={dark} />
          <InputField label={tr(locale, "stateRegion")} value={profileState} onChange={onProfileStateChange} dark={dark} />
          <InputField label={tr(locale, "postalCode")} value={profilePostalCode} onChange={onProfilePostalCodeChange} dark={dark} />
        </View>

        {profileError ? <Text className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{profileError}</Text> : null}
        {profileMessage ? <Text className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{profileMessage}</Text> : null}

        <Pressable onPress={onSaveProfile} disabled={profileBusy} className={`mt-4 rounded-xl py-3 ${profileBusy ? "bg-slate-300" : "bg-orange-600"}`}>
          <Text className="text-center text-sm font-black text-white">{profileBusy ? tr(locale, "savingProfile") : tr(locale, "saveProfile")}</Text>
        </Pressable>
      </View>

      <View className={`mt-3 rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <Row label={tr(locale, "language")} value={locale.toUpperCase()} onPress={onToggleLocale} dark={dark} />
        <Row label={tr(locale, "theme")} value={theme === "dark" ? tr(locale, "dark") : tr(locale, "light")} onPress={onToggleTheme} dark={dark} />
      </View>

      <Pressable onPress={onLogout} className="mt-4 rounded-xl bg-rose-600 py-3">
        <Text className="text-center text-sm font-black text-white">{tr(locale, "logout")}</Text>
      </Pressable>
    </ScrollView>
  );
}

function InputField({
  label,
  value,
  onChange,
  dark,
  autoCapitalize = "sentences",
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dark: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
}) {
  return (
    <View>
      <Text className={`mb-1 text-xs font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholderTextColor={dark ? "#64748b" : "#94a3b8"}
        className={`rounded-xl border px-4 py-3 text-sm ${dark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
      />
    </View>
  );
}

function Row({ label, value, onPress, dark }: { label: string; value: string; onPress: () => void; dark: boolean }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-3">
      <Text className={`text-sm font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>{label}</Text>
      <Text className={`text-sm font-black ${dark ? "text-orange-300" : "text-orange-600"}`}>{value}</Text>
    </Pressable>
  );
}
