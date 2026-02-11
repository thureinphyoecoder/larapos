import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { Locale } from "../types/domain";
import { tr } from "../i18n/strings";

type Props = {
  locale: Locale;
  registerName: string;
  registerConfirmPassword: string;
  email: string;
  password: string;
  busy: boolean;
  error: string;
  onRegisterNameChange: (value: string) => void;
  onRegisterConfirmPasswordChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmitLogin: () => void;
  onSubmitRegister: () => void;
};

export function LoginScreen({
  locale,
  registerName,
  registerConfirmPassword,
  email,
  password,
  busy,
  error,
  onRegisterNameChange,
  onRegisterConfirmPasswordChange,
  onEmailChange,
  onPasswordChange,
  onSubmitLogin,
  onSubmitRegister,
}: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");

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
            <View className="rounded-xl bg-slate-100 p-1">
              <View className="flex-row">
                <Pressable onPress={() => setMode("login")} className={`flex-1 rounded-lg py-2 ${mode === "login" ? "bg-orange-600" : "bg-transparent"}`}>
                  <Text className={`text-center text-xs font-black ${mode === "login" ? "text-white" : "text-slate-600"}`}>Login</Text>
                </Pressable>
                <Pressable onPress={() => setMode("register")} className={`flex-1 rounded-lg py-2 ${mode === "register" ? "bg-orange-600" : "bg-transparent"}`}>
                  <Text className={`text-center text-xs font-black ${mode === "register" ? "text-white" : "text-slate-600"}`}>Register</Text>
                </Pressable>
              </View>
            </View>
            <Text className="mt-3 text-xl font-black text-slate-900">{mode === "login" ? tr(locale, "loginTitle") : "Create Account"}</Text>
            <Text className="mt-1 text-sm text-slate-500">{mode === "login" ? tr(locale, "loginSubtitle") : "Create a new customer account to continue."}</Text>
          </View>

          <View className="mt-6 gap-3">
            {mode === "register" ? (
              <View>
                <Text className="mb-1 text-xs font-bold text-slate-500">{tr(locale, "name")}</Text>
                <TextInput
                  value={registerName}
                  onChangeText={onRegisterNameChange}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900"
                  placeholder="Your Name"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            ) : null}
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
            {mode === "register" ? (
              <View>
                <Text className="mb-1 text-xs font-bold text-slate-500">Confirm Password</Text>
                <TextInput
                  value={registerConfirmPassword}
                  secureTextEntry
                  onChangeText={onRegisterConfirmPasswordChange}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            ) : null}

            {error ? <Text className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</Text> : null}

            <Pressable onPress={mode === "login" ? onSubmitLogin : onSubmitRegister} disabled={busy} className="rounded-xl bg-orange-600 py-3">
              <Text className="text-center text-sm font-black text-white">{busy ? tr(locale, "signingIn") : mode === "login" ? tr(locale, "signIn") : "Create Account"}</Text>
            </Pressable>
          </View>

          <Text className="mt-5 text-xs text-slate-500">{tr(locale, "demoHint")}</Text>
        </View>
      </View>
    </View>
  );
}
