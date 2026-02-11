import { Pressable, Text, TextInput, View } from "react-native";
import type { Locale } from "../types/domain";
import { tr } from "../i18n/strings";

type Props = {
  locale: Locale;
  email: string;
  password: string;
  busy: boolean;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function LoginScreen({
  locale,
  email,
  password,
  busy,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: Props) {
  return (
    <View className="flex-1 justify-center bg-slate-100 px-5 py-8">
      <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <View className="relative overflow-hidden bg-orange-600 px-6 py-6">
          <View className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-white/20" />
          <View className="absolute -left-8 -bottom-10 h-24 w-24 rounded-full bg-amber-300/40" />
          <Text className="text-3xl font-black tracking-tight text-white">{tr(locale, "appName")}</Text>
          <Text className="mt-2 text-sm text-orange-100">{tr(locale, "appTagline")}</Text>
        </View>

        <View className="p-6">
          <View>
            <Text className="text-xl font-black text-slate-900">{tr(locale, "loginTitle")}</Text>
            <Text className="mt-1 text-sm text-slate-500">{tr(locale, "loginSubtitle")}</Text>
          </View>

          <View className="mt-6 gap-3">
            <View>
              <Text className="mb-1 text-xs font-bold text-slate-500">{tr(locale, "email")}</Text>
              <TextInput
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={onEmailChange}
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900"
                placeholder="customer@email.com"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View>
              <Text className="mb-1 text-xs font-bold text-slate-500">{tr(locale, "password")}</Text>
              <TextInput
                value={password}
                secureTextEntry
                onChangeText={onPasswordChange}
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900"
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {error ? <Text className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</Text> : null}

            <Pressable onPress={onSubmit} disabled={busy} className="rounded-xl bg-orange-600 py-3">
              <Text className="text-center text-sm font-black text-white">{busy ? tr(locale, "signingIn") : tr(locale, "signIn")}</Text>
            </Pressable>
          </View>

          <Text className="mt-5 text-xs text-slate-500">{tr(locale, "demoHint")}</Text>
        </View>
      </View>
    </View>
  );
}
