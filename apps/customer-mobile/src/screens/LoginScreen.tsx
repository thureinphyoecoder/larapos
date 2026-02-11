import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
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
  message: string;
  onRegisterNameChange: (value: string) => void;
  onRegisterConfirmPasswordChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmitLogin: () => void;
  onSubmitRegister: () => void;
  onForgotPassword: () => void;
  onResendVerification: () => void;
};

export function LoginScreen({
  locale,
  registerName,
  registerConfirmPassword,
  email,
  password,
  busy,
  error,
  message,
  onRegisterNameChange,
  onRegisterConfirmPasswordChange,
  onEmailChange,
  onPasswordChange,
  onSubmitLogin,
  onSubmitRegister,
  onForgotPassword,
  onResendVerification,
}: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [remember, setRemember] = useState(true);
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const cartTravel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cartTravel, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cartTravel, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cartTravel]);

  const cartTranslateX = cartTravel.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });
  const cartRotate = cartTravel.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-3deg", "0deg", "3deg"],
  });

  return (
    <View className="flex-1 items-center justify-center bg-orange-500 px-4 py-8">
      <View className={`w-full max-w-5xl overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl ${wide ? "flex-row" : ""}`}>
        <View className={`${wide ? "w-[45%]" : "w-full"} items-center justify-center bg-orange-600 px-6 py-10`}>
          <Text className="text-5xl font-black italic tracking-tight text-white">{tr(locale, "appName")}</Text>
          <Text className="mt-3 text-center text-xl text-orange-100">{tr(locale, "appTagline")}</Text>
          <Animated.View
            style={{
              marginTop: 22,
              transform: [{ translateX: cartTranslateX }, { rotate: cartRotate }],
            }}
          >
            <Ionicons
              name="cart-outline"
              size={88}
              color="#93c5fd"
              style={{
                transform: [{ scaleX: -1 }],
              }}
            />
          </Animated.View>
        </View>

        <View className={`${wide ? "w-[55%]" : "w-full"} bg-slate-50 p-7`}>
          <Text className="text-4xl font-black text-slate-900">{mode === "login" ? "Login" : "Create Account"}</Text>

          {mode === "register" ? (
            <View className="mt-4">
              <Text className="mb-1 text-xs font-bold text-slate-500">{tr(locale, "name")}</Text>
              <TextInput
                value={registerName}
                onChangeText={onRegisterNameChange}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                placeholder="Your Name"
                placeholderTextColor="#94a3b8"
              />
            </View>
          ) : null}

          <View className="mt-4">
            <Text className="mb-1 text-xs font-bold text-slate-500">{tr(locale, "email")}</Text>
            <TextInput
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={onEmailChange}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              placeholder="Email Address"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mt-3">
            <Text className="mb-1 text-xs font-bold text-slate-500">{tr(locale, "password")}</Text>
            <TextInput
              value={password}
              secureTextEntry
              onChangeText={onPasswordChange}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              placeholder="Password"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {mode === "register" ? (
            <View className="mt-3">
              <Text className="mb-1 text-xs font-bold text-slate-500">Confirm Password</Text>
              <TextInput
                value={registerConfirmPassword}
                secureTextEntry
                onChangeText={onRegisterConfirmPasswordChange}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                placeholder="Confirm Password"
                placeholderTextColor="#94a3b8"
              />
            </View>
          ) : (
            <View className="mt-3 flex-row items-center justify-between">
              <Pressable onPress={() => setRemember((current) => !current)} className="flex-row items-center gap-2">
                <View className={`h-5 w-5 items-center justify-center rounded border ${remember ? "border-orange-600 bg-orange-600" : "border-slate-400 bg-transparent"}`}>
                  {remember ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
                </View>
                <Text className="text-xs text-slate-600">မှတ်ထားမည်</Text>
              </Pressable>
              <Pressable onPress={onForgotPassword} disabled={busy}>
                <Text className="text-xs font-semibold text-orange-500">Forgot your password?</Text>
              </Pressable>
            </View>
          )}

          {error ? <Text className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</Text> : null}
          {message ? <Text className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{message}</Text> : null}

          <Pressable onPress={mode === "login" ? onSubmitLogin : onSubmitRegister} disabled={busy} className="mt-4 rounded-xl bg-orange-500 py-3">
            <Text className="text-center text-lg font-black uppercase text-white">{busy ? tr(locale, "signingIn") : mode === "login" ? "Log In" : "Create Account"}</Text>
          </Pressable>

          <View className="mt-3 flex-row items-center">
            <View className="h-px flex-1 bg-slate-300" />
            <Text className="mx-3 text-xs text-slate-400">OR</Text>
            <View className="h-px flex-1 bg-slate-300" />
          </View>

          {mode === "login" ? (
            <>
              <Pressable onPress={() => setMode("register")} className="mt-3 rounded-xl border border-slate-300 bg-white py-3">
                <Text className="text-center text-lg font-semibold text-slate-700">Create new account</Text>
              </Pressable>
              <Pressable onPress={onResendVerification} disabled={busy} className="mt-2 rounded-xl border border-slate-300 bg-white py-3">
                <Text className="text-center text-sm font-semibold text-slate-700">Resend verification email</Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => setMode("login")} className="mt-3 rounded-xl border border-slate-300 bg-white py-3">
              <Text className="text-center text-lg font-semibold text-slate-700">Create new account</Text>
            </Pressable>
          )}
          {mode === "register" ? (
            <Pressable onPress={() => setMode("login")} className="mt-2 rounded-xl border border-slate-300 bg-white py-3">
              <Text className="text-center text-lg font-semibold text-slate-700">Back to login</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
