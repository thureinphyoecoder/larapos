import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { type Locale, tr } from "../i18n/strings";

type LoginScreenProps = {
  locale: Locale;
  release: string;
  email: string;
  password: string;
  busy: boolean;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function LoginScreen(props: LoginScreenProps) {
  const { locale, release, email, password, busy, error, onEmailChange, onPasswordChange, onSubmit } = props;
  const [showHelp, setShowHelp] = useState(false);

  return (
    <View className="flex-1 justify-center bg-slate-950 px-5">
      <View className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-sky-400/20" />
      <View className="absolute -right-16 top-40 h-48 w-48 rounded-full bg-indigo-400/20" />

      <View className="rounded-3xl border border-white/20 bg-slate-900/90 p-5">
        <Text className="text-3xl font-black text-white">LaraPOS Delivery</Text>
        <Text className="mt-1 text-sm text-slate-300">{tr(locale, "loginSubtitle")}</Text>
        <Text className="mt-1 text-xs font-bold text-sky-300">{release}</Text>

        <View className="mt-5 gap-3">
          <View>
            <Text className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-300">{tr(locale, "loginEmail")}</Text>
            <TextInput
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white"
              value={email}
              onChangeText={onEmailChange}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View>
            <Text className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-300">{tr(locale, "loginPassword")}</Text>
            <TextInput
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white"
              value={password}
              onChangeText={onPasswordChange}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {error ? (
            <View className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <Text className="text-sm font-medium text-rose-700">{error}</Text>
            </View>
          ) : null}

          <Pressable
            className={`items-center rounded-xl px-4 py-3 ${busy ? "bg-sky-300" : "bg-sky-500"}`}
            disabled={busy}
            onPress={onSubmit}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#0f172a" />
            ) : (
              <Text className="text-sm font-black text-slate-900">{tr(locale, "loginButton")}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => setShowHelp((prev) => !prev)}>
            <Text className="text-center text-xs font-semibold text-slate-300">
              {showHelp ? tr(locale, "loginHelpHide") : tr(locale, "loginHelpShow")}
            </Text>
          </Pressable>

          {showHelp ? (
            <View className="rounded-xl border border-sky-300/30 bg-sky-900/30 p-3">
              <Text className="text-xs text-sky-100">
                {tr(locale, "loginHelpText")}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
