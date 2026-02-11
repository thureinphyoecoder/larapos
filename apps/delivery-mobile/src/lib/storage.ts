import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "larapos.delivery.token";
const THEME_KEY = "larapos.delivery.theme";
const LANGUAGE_KEY = "larapos.delivery.language";

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getStoredTheme(): Promise<"dark" | "light" | null> {
  const theme = await AsyncStorage.getItem(THEME_KEY);
  if (theme === "dark" || theme === "light") {
    return theme;
  }

  return null;
}

export async function setStoredTheme(theme: "dark" | "light"): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function getStoredLanguage(): Promise<"en" | "mm" | null> {
  const language = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (language === "en" || language === "mm") {
    return language;
  }

  return null;
}

export async function setStoredLanguage(language: "en" | "mm"): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}
