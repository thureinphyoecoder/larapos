import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Alert, BackHandler } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";

import { API_BASE_URL } from "../config/server";
import { type Locale, tr } from "../i18n/strings";
import { ApiError } from "../lib/http";
import { ensureNotificationPermission, registerForRemotePushAsync, scheduleLocalNotification } from "../lib/push";
import { clearStoredToken, getStoredLanguage, getStoredTheme, getStoredToken, setStoredLanguage, setStoredTheme, setStoredToken } from "../lib/storage";
import { authService } from "../services/authService";
import { orderService } from "../services/orderService";
import type { ApiUser, Order, SalaryPreview, StaffProfile } from "../types/domain";

type ThemeMode = "dark" | "light";
type InAppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  orderId: number | null;
  kind: "new_order" | "status_changed";
  isRead: boolean;
};

export function useDeliveryApp() {
  const [booting, setBooting] = useState(true);
  const apiBaseUrl = useMemo(() => normalizeApiBaseUrl(API_BASE_URL), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [locale, setLocale] = useState<Locale>("mm");

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [salaryPreview, setSalaryPreview] = useState<SalaryPreview | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const [bannerNotification, setBannerNotification] = useState<InAppNotification | null>(null);

  const lastBackPressedAtRef = useRef(0);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orderSnapshotRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    void requestRequiredPermissionsOnLaunch();
  }, []);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    void registerPushToken();
    const timer = setInterval(() => void loadOrders(), 8000);
    return () => clearInterval(timer);
  }, [token, user]);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selectedOrder) {
        setSelectedOrder(null);
        return true;
      }

      if (token && user) {
        const now = Date.now();
        if (now - lastBackPressedAtRef.current < 2000) {
          return false;
        }

        lastBackPressedAtRef.current = now;
        Alert.alert(tr(locale, "backExitTitle"), tr(locale, "backExitMessage"));
        return true;
      }

      return false;
    });

    return () => handler.remove();
  }, [locale, selectedOrder, token, user]);

  async function bootstrap() {
    try {
      setBooting(true);
      const [savedToken, savedTheme, savedLanguage] = await Promise.all([getStoredToken(), getStoredTheme(), getStoredLanguage()]);
      if (savedTheme) {
        setTheme(savedTheme);
      }
      if (savedLanguage) {
        setLocale(savedLanguage);
      }

      if (!savedToken) {
        return;
      }

      const me = await authService.me(apiBaseUrl, savedToken);
      setToken(savedToken);
      setUser(me.user);
      setProfile(me.profile ?? null);
      setSalaryPreview(me.salary_preview ?? null);
      await loadOrders(apiBaseUrl, savedToken);
    } catch {
      await clearStoredToken();
      clearSession();
    } finally {
      setBooting(false);
    }
  }

  async function signIn() {
    if (!email.trim() || !password.trim()) {
      setError(tr(locale, "loginFillRequired"));
      return;
    }

    try {
      setLoginBusy(true);
      setError("");

      const login = await authService.login(apiBaseUrl, email.trim(), password);
      const me = await authService.me(apiBaseUrl, login.token);
      const roleSet = new Set(me.user.roles);
      const canUse = roleSet.has("delivery") || roleSet.has("admin") || roleSet.has("manager");
      if (!canUse) {
        setError(tr(locale, "loginNoAccess"));
        return;
      }

      await setStoredToken(login.token);
      setToken(login.token);
      setUser(me.user);
      setProfile(me.profile ?? null);
      setSalaryPreview(me.salary_preview ?? null);
      setPassword("");
      await loadOrders(apiBaseUrl, login.token);
    } catch (err) {
      setError(mapLoginError(err, locale));
    } finally {
      setLoginBusy(false);
    }
  }

  async function logout() {
    if (token) {
      try {
        await authService.logout(apiBaseUrl, token);
      } catch {
        // ignore logout call failures
      }
    }

    await clearStoredToken();
    clearSession();
    setError("");
  }

  function clearSession() {
    setToken(null);
    setUser(null);
    setProfile(null);
    setSalaryPreview(null);
    setOrders([]);
    setSelectedOrder(null);
    setNotifications([]);
    setNotificationsUnreadCount(0);
    setBannerNotification(null);
    orderSnapshotRef.current.clear();
  }

  async function loadOrders(base: string = apiBaseUrl, sessionToken: string = token ?? "") {
    if (!sessionToken) return;

    const result = await orderService.list(base, sessionToken);
    const nextOrders = (result.data ?? []).map((row) => normalizeOrderUrls(base, row));
    setOrders(nextOrders);

    if (selectedOrder) {
      const refreshed = nextOrders.find((row) => row.id === selectedOrder.id) ?? null;
      setSelectedOrder(refreshed);
    }

    void emitOrderNotifications(nextOrders);
  }

  async function refreshOrders() {
    if (!token) return;
    try {
      setRefreshing(true);
      await loadOrders();
    } catch (err) {
      Alert.alert(tr(locale, "ordersLoadFailedTitle"), err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRefreshing(false);
    }
  }

  async function openOrder(order: Order) {
    if (!token) return;

    try {
      const result = await orderService.detail(apiBaseUrl, token, order.id);
      setSelectedOrder(normalizeOrderUrls(apiBaseUrl, result.data));
    } catch (err) {
      Alert.alert(tr(locale, "orderOpenFailedTitle"), err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function updateCurrentLocation() {
    if (!token || !selectedOrder) return;

    try {
      setActionBusy(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(tr(locale, "permissionRequiredTitle"), tr(locale, "locationPermissionMessage"));
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const payload = {
        delivery_lat: Number(current.coords.latitude.toFixed(7)),
        delivery_lng: Number(current.coords.longitude.toFixed(7)),
      };

      const result = await orderService.updateDeliveryLocation(apiBaseUrl, token, selectedOrder.id, payload);
      setSelectedOrder(normalizeOrderUrls(apiBaseUrl, result.data));
      await loadOrders();
      Alert.alert(tr(locale, "locationUpdatedTitle"), tr(locale, "locationUpdatedMessage"));
    } catch (err) {
      Alert.alert(tr(locale, "locationUpdateFailedTitle"), err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionBusy(false);
    }
  }

  async function uploadProofAndMarkShipped() {
    if (!token || !selectedOrder) return;

    try {
      setActionBusy(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(tr(locale, "permissionRequiredTitle"), tr(locale, "galleryPermissionMessage"));
        return;
      }

      const pickResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (pickResult.canceled || !pickResult.assets.length) {
        return;
      }

      const asset = pickResult.assets[0];
      if (!asset) {
        return;
      }

      const formData = new FormData();
      formData.append("delivery_proof", {
        uri: asset.uri,
        type: asset.mimeType ?? "image/jpeg",
        name: asset.fileName ?? `delivery-proof-${Date.now()}.jpg`,
      } as never);

      const result = await orderService.uploadShipmentProof(apiBaseUrl, token, selectedOrder.id, formData);
      setSelectedOrder(normalizeOrderUrls(apiBaseUrl, result.data));
      await loadOrders();
      Alert.alert(tr(locale, "locationUpdatedTitle"), tr(locale, "proofUploadedMessage"));
    } catch (err) {
      Alert.alert(tr(locale, "uploadFailedTitle"), err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionBusy(false);
    }
  }

  async function markDelivered() {
    if (!token || !selectedOrder) return;

    try {
      setActionBusy(true);
      const result = await orderService.markDelivered(apiBaseUrl, token, selectedOrder.id);
      setSelectedOrder(normalizeOrderUrls(apiBaseUrl, result.data));
      await loadOrders();
      Alert.alert(tr(locale, "locationUpdatedTitle"), tr(locale, "deliveredMessage"));
    } catch (err) {
      Alert.alert(tr(locale, "statusUpdateFailedTitle"), err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionBusy(false);
    }
  }

  async function requestRequiredPermissionsOnLaunch() {
    try {
      await ensureNotificationPermission();

      const locationPermission = await Location.getForegroundPermissionsAsync();
      if (locationPermission.status !== "granted") {
        await Location.requestForegroundPermissionsAsync();
      }

      const mediaPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (mediaPermission.status !== "granted") {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
    } catch {
      // never block startup on permissions
    }
  }

  async function registerPushToken() {
    const result = await registerForRemotePushAsync();
    if (result.error) {
      console.log("Push registration warning:", result.error);
    }

    if (result.token) {
      console.log("Expo push token:", result.token);
    }
  }

  async function emitOrderNotifications(nextOrders: Order[]) {
    const snapshot = orderSnapshotRef.current;
    if (!snapshot.size) {
      nextOrders.forEach((order) => snapshot.set(order.id, order.status));
      return;
    }

    for (const order of nextOrders) {
      const prevStatus = snapshot.get(order.id);
      if (!prevStatus) {
        addInAppNotification(
          tr(locale, "notifNewOrderTitle"),
          tr(locale, "notifNewOrderBody", { id: order.id }),
          order.id,
          "new_order",
        );
        await pushLocalNotification(
          tr(locale, "notifNewOrderTitle"),
          tr(locale, "notifNewOrderBody", { id: order.id }),
        );
      } else if (prevStatus !== order.status) {
        addInAppNotification(
          tr(locale, "notifStatusChangedTitle"),
          tr(locale, "notifStatusChangedBody", { id: order.id, status: order.status }),
          order.id,
          "status_changed",
        );
        await pushLocalNotification(
          tr(locale, "notifStatusChangedTitle"),
          tr(locale, "notifStatusChangedBody", { id: order.id, status: order.status }),
        );
      }

      snapshot.set(order.id, order.status);
    }
  }

  async function toggleTheme() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    await setStoredTheme(next);
  }

  async function pushLocalNotification(title: string, body: string) {
    try {
      await scheduleLocalNotification(title, body);
    } catch {
      // keep polling alive even when local notification fails
    }
  }

  function addInAppNotification(
    title: string,
    body: string,
    orderId: number | null,
    kind: "new_order" | "status_changed",
  ) {
    const createdAt = new Date().toISOString();
    const next: InAppNotification = {
      id: `${Date.now()}-${Math.random()}`,
      title,
      body,
      createdAt,
      orderId,
      kind,
      isRead: false,
    };

    setNotifications((prev) => [next, ...prev].slice(0, 60));
    setNotificationsUnreadCount((prev) => prev + 1);

    setBannerNotification(next);
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    bannerTimerRef.current = setTimeout(() => {
      setBannerNotification(null);
    }, 4500);
  }

  function markNotificationsRead() {
    setNotifications((prev) => prev.map((item) => (item.isRead ? item : { ...item, isRead: true })));
    setNotificationsUnreadCount(0);
    setBannerNotification(null);
  }

  async function openNotificationOrder(notification: InAppNotification) {
    if (!notification.isRead) {
      setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
      setNotificationsUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (!notification.orderId || !token) {
      return;
    }

    const fallbackOrder = orders.find((item) => item.id === notification.orderId) || null;
    if (fallbackOrder) {
      await openOrder(fallbackOrder);
    }
  }

  async function setLanguage(next: Locale) {
    setLocale(next);
    await setStoredLanguage(next);
  }

  return {
    booting,
    theme,
    locale,
    login: {
      email,
      password,
      busy: loginBusy,
      error,
      setEmail,
      setPassword,
      signIn,
    },
    session: {
      token,
      user,
      profile,
      salaryPreview,
    },
    orders: {
      list: orders,
      selected: selectedOrder,
      refreshing,
      actionBusy,
      refreshOrders,
      openOrder,
      closeOrder: () => setSelectedOrder(null),
      updateCurrentLocation,
      uploadProofAndMarkShipped,
      markDelivered,
    },
    actions: {
      logout,
      toggleTheme,
      setLanguage,
    },
    notifications: {
      list: notifications,
      unreadCount: notificationsUnreadCount,
      banner: bannerNotification,
      markRead: markNotificationsRead,
      openOrder: openNotificationOrder,
      closeBanner: () => setBannerNotification(null),
    },
  };
}

function mapLoginError(err: unknown, locale: Locale): string {
  if (err instanceof ApiError) {
    const msg = err.message.toLowerCase();
    if (err.status === 422 && msg.includes("invalid credentials")) {
      return tr(locale, "loginInvalid");
    }
    if (err.status === 0) {
      return tr(locale, "loginServerUnavailable");
    }

    return err.message;
  }

  return tr(locale, "loginFailed");
}

function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed.endsWith("/api/v1")) {
    return trimmed;
  }

  if (trimmed.endsWith("/api")) {
    return `${trimmed}/v1`;
  }

  return `${trimmed}/api/v1`;
}

function normalizeOrderUrls(baseUrl: string, order: Order): Order {
  return {
    ...order,
    payment_slip_url: toAbsolutePublicUrl(baseUrl, order.payment_slip_url),
    delivery_proof_url: toAbsolutePublicUrl(baseUrl, order.delivery_proof_url),
  };
}

function toAbsolutePublicUrl(baseUrl: string, path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return rehostLoopbackAbsoluteUrl(baseUrl, path);
  }

  const host = baseUrl.replace(/\/api\/v1$/, "").replace(/\/$/, "");
  return `${host}${path.startsWith("/") ? "" : "/"}${path}`;
}

function rehostLoopbackAbsoluteUrl(baseUrl: string, absoluteUrl: string): string {
  try {
    const input = new URL(absoluteUrl);
    if (!["localhost", "127.0.0.1", "::1"].includes(input.hostname)) {
      return absoluteUrl;
    }

    const apiHost = baseUrl.replace(/\/api\/v1$/, "").replace(/\/$/, "");
    const parsedApiHost = new URL(apiHost);
    input.protocol = parsedApiHost.protocol;
    input.host = parsedApiHost.host;
    return input.toString();
  } catch {
    return absoluteUrl;
  }
}
