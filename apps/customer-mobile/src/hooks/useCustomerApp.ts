import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import { API_BASE_URL } from "../config/server";
import { tr } from "../i18n/strings";
import { ApiError } from "../lib/http";
import { ensureNotificationPermission, registerForRemotePushToken, showLocalNotification } from "../lib/notifications";
import { clearSession, loadLocale, loadSession, loadTheme, saveLocale, saveSession, saveTheme } from "../lib/storage";
import { addCartItem, fetchCart, removeCartItem } from "../services/cartService";
import { fetchCategories, fetchProductDetail, fetchProducts, submitProductReview } from "../services/catalogService";
import {
  fetchMe,
  logout as logoutService,
  registerPushToken as registerPushTokenService,
  register as registerService,
  requestPasswordReset,
  resendEmailVerificationByEmail,
  resendEmailVerification,
  signIn,
  unregisterPushToken as unregisterPushTokenService,
  updateMe,
  updateMePhoto,
} from "../services/authService";
import { cancelOrder, fetchOrderDetail, fetchOrders, placeOrderFromCart, requestRefund, requestReturn } from "../services/orderService";
import { deleteSupportMessage, fetchSupportMessages, sendSupportMessage, updateSupportMessage } from "../services/supportService";
import type { AppNotification, CartItem, Category, CustomerOrder, CustomerTab, Locale, MePayload, Product, SupportMessage, ThemeMode } from "../types/domain";

type DetailView = "none" | "product" | "order" | "checkout";

export function useCustomerApp() {
  const [booting, setBooting] = useState(true);
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<ThemeMode>("light");

  const [session, setSession] = useState<Awaited<ReturnType<typeof loadSession>>>(null);
  const [activeTab, setActiveTab] = useState<CustomerTab>("home");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [refreshing, setRefreshing] = useState(false);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [removingCartItemId, setRemovingCartItemId] = useState<number | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutSlipUri, setCheckoutSlipUri] = useState<string | null>(null);
  const [checkoutQrData, setCheckoutQrData] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportAssignedStaffName, setSupportAssignedStaffName] = useState<string | null>(null);
  const [supportDraft, setSupportDraft] = useState("");
  const [supportImageUri, setSupportImageUri] = useState<string | null>(null);
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportLoadingMore, setSupportLoadingMore] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState("");
  const [supportCurrentPage, setSupportCurrentPage] = useState(1);
  const [supportHasMore, setSupportHasMore] = useState(false);
  const [supportEditingMessageId, setSupportEditingMessageId] = useState<number | null>(null);

  const [detailView, setDetailView] = useState<DetailView>("none");
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailActionBusy, setDetailActionBusy] = useState(false);
  const [detailActionMessage, setDetailActionMessage] = useState("");
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOrder, setDetailOrder] = useState<CustomerOrder | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileNrc, setProfileNrc] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileState, setProfileState] = useState("");
  const [profilePostalCode, setProfilePostalCode] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profilePhotoBusy, setProfilePhotoBusy] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationBanner, setNotificationBanner] = useState<AppNotification | null>(null);
  const orderSnapshotRef = useRef<Map<number, string>>(new Map());
  const flashSaleSnapshotRef = useRef("");
  const supportLatestIdRef = useRef(0);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncedPushTokenRef = useRef<string | null>(null);
  const syncedSessionTokenRef = useRef<string | null>(null);

  const dark = theme === "dark";

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  const addNotification = useCallback(
    (channel: "order" | "support" | "flash", title: string, message: string, orderId?: number | null) => {
      const item: AppNotification = {
        id: `${Date.now()}-${Math.random()}`,
        title,
        message,
        createdAt: new Date().toISOString(),
        isRead: false,
        channel,
        orderId: orderId ?? null,
      };

      setNotifications((prev) => [item, ...prev].slice(0, 80));
      if (channel === "support") {
        setSupportUnreadCount((current) => current + 1);
      } else {
        setNotificationsUnreadCount((current) => current + 1);
      }

      setNotificationBanner(item);
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      notificationTimerRef.current = setTimeout(() => {
        setNotificationBanner(null);
      }, 4500);
    },
    [],
  );

  const markOrderNotificationsRead = useCallback(() => {
    setNotificationsUnreadCount(0);
    setNotifications((prev) =>
      prev.map((item) =>
        item.channel === "order" || item.channel === "flash"
          ? { ...item, isRead: true }
          : item,
      ),
    );
  }, []);

  const markSupportNotificationsRead = useCallback(() => {
    setSupportUnreadCount(0);
    setNotifications((prev) =>
      prev.map((item) => (item.channel === "support" ? { ...item, isRead: true } : item)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotificationsUnreadCount(0);
    setSupportUnreadCount(0);
    setNotifications((prev) => prev.map((item) => (item.isRead ? item : { ...item, isRead: true })));
    setNotificationBanner(null);
  }, []);

  const hydratePublicCatalog = useCallback(
    async (search = "", categoryId: number | null = null) => {
      const [nextCategories, nextProducts] = await Promise.all([
        fetchCategories(API_BASE_URL),
        fetchProducts(API_BASE_URL, search, categoryId),
      ]);

      setCategories(nextCategories);
      setProducts(nextProducts);

      const activeFlashIds = nextProducts
        .filter((product) => {
          const variants = product.active_variants?.length ? product.active_variants : product.variants || [];
          const hasFlashSale = variants.some((variant) => variant.promotion?.type === "flash_sale");
          const hasDiscount = Number(product.base_price ?? product.price ?? 0) > Number(product.price ?? 0);
          return hasFlashSale && hasDiscount;
        })
        .map((product) => product.id)
        .sort((a, b) => a - b);

      const snapshot = activeFlashIds.join(",");
      const previousSnapshot = flashSaleSnapshotRef.current;
      flashSaleSnapshotRef.current = snapshot;

      if (session?.token && previousSnapshot && snapshot && previousSnapshot !== snapshot) {
        const message = `${activeFlashIds.length} flash sale deal(s) are live now.`;
        addNotification("flash", "Flash Sale", message);
        void showLocalNotification("Flash Sale", message);
      }
    },
    [addNotification, session?.token],
  );

  const hydratePrivateData = useCallback(async (token: string) => {
    const [nextOrders, nextCart] = await Promise.all([fetchOrders(API_BASE_URL, token), fetchCart(API_BASE_URL, token)]);

    const snapshot = orderSnapshotRef.current;
    if (snapshot.size === 0) {
      nextOrders.forEach((order) => {
        snapshot.set(order.id, String(order.status || ""));
      });
    } else {
      const seenIds = new Set<number>();
      const changed = nextOrders.filter((order) => {
        seenIds.add(order.id);
        const nextStatus = String(order.status || "");
        const previous = snapshot.get(order.id);
        snapshot.set(order.id, nextStatus);
        return Boolean(previous && previous !== nextStatus);
      });

      for (const orderId of Array.from(snapshot.keys())) {
        if (!seenIds.has(orderId)) {
          snapshot.delete(orderId);
        }
      }

      if (changed.length > 0) {
        changed.forEach((order) => {
          const text = `${tr(locale, "notificationMsg")} (#${order.id}: ${String(order.status || "").toUpperCase()})`;
          addNotification("order", tr(locale, "notificationTitle"), text, order.id);
          void showLocalNotification(tr(locale, "notificationTitle"), text);
        });
      }
    }

    setOrders(nextOrders);
    setCartItems(nextCart);
    setDetailOrder((current) => {
      if (!current) return current;
      const matched = nextOrders.find((item) => item.id === current.id);
      return matched ? { ...current, ...matched } : current;
    });
  }, [addNotification, locale]);

  const loadSupport = useCallback(
    async (token: string, options?: { page?: number; mode?: "replace" | "append" | "merge_latest"; markSeen?: boolean }) => {
      const page = options?.page ?? 1;
      const mode = options?.mode ?? "replace";
      const markSeen = options?.markSeen ?? false;

      if (mode === "append") {
        setSupportLoadingMore(true);
      } else {
        setSupportBusy(true);
      }
      setSupportError("");

      try {
        const payload = await fetchSupportMessages(API_BASE_URL, token, page, markSeen);
        const nextMessages = payload.messages || [];
        const pageMeta = payload.messagePagination;
        const latestId = nextMessages.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0);
        const previousLatestId = supportLatestIdRef.current;

        if (latestId > previousLatestId) {
          if (previousLatestId > 0 && mode !== "append") {
            const incoming = nextMessages.filter(
              (item) => Number(item.id) > previousLatestId && Number(item.sender_id) !== Number(session?.user?.id || 0),
            );

            if (incoming.length > 0 && activeTab !== "support") {
              const latestIncoming = incoming[incoming.length - 1];
              const senderName = latestIncoming.sender?.name || tr(locale, "supportAgent");
              const preview = String(latestIncoming.message || "").trim() || "Sent an image";

              addNotification("support", `${senderName} • ${tr(locale, "supportTitle")}`, preview);
              void showLocalNotification(`${senderName} • ${tr(locale, "supportTitle")}`, preview);
            }
          }

          supportLatestIdRef.current = latestId;
        }

        setSupportAssignedStaffName(payload.assigned_staff?.name || null);
        setSupportCurrentPage(pageMeta?.current_page ?? page);
        setSupportHasMore(Boolean(pageMeta?.has_more_pages ?? ((pageMeta?.current_page ?? page) < (pageMeta?.last_page ?? page))));

        if (mode === "append") {
          setSupportMessages((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            const older = nextMessages.filter((item) => !seen.has(item.id));
            return [...older, ...prev];
          });
          return;
        }

        if (mode === "merge_latest") {
          setSupportMessages((prev) => {
            const latestIds = new Set(nextMessages.map((item) => item.id));
            const older = prev.filter((item) => !latestIds.has(item.id));
            const mergedLatest = nextMessages.map((item) => {
              const existing = prev.find((prevItem) => prevItem.id === item.id);
              return existing ? { ...existing, ...item } : item;
            });
            return [...older, ...mergedLatest];
          });
          return;
        }

        setSupportMessages(nextMessages);
      } catch (error) {
        if (error instanceof ApiError) {
          setSupportError(error.message || tr(locale, "unknownError"));
        } else {
          setSupportError(tr(locale, "unknownError"));
        }
      } finally {
        if (mode === "append") {
          setSupportLoadingMore(false);
        } else {
          setSupportBusy(false);
        }
      }
    },
    [activeTab, addNotification, locale, session?.user?.id],
  );

  const applyMePayload = useCallback(async (token: string, payload: MePayload) => {
    const nextSession = {
      token,
      user: payload.user,
    };

    setSession(nextSession);
    await saveSession(nextSession);

    setProfileName(payload.user.name || "");
    setProfileEmail(payload.user.email || "");
    setProfilePhone(payload.profile?.phone_number || "");
    setProfileNrc(payload.profile?.nrc_number || "");
    const normalizedAddress = payload.profile?.address_line_1 || payload.profile?.address || "";
    setProfileAddress(normalizedAddress);
    setProfileCity(payload.profile?.city || "");
    setProfileState(payload.profile?.state || "");
    setProfilePostalCode(payload.profile?.postal_code || "");
    setProfilePhotoUrl(normalizeMediaUrl(API_BASE_URL, payload.profile?.photo_url || null));
    setCheckoutPhone(payload.profile?.phone_number || "");
    setCheckoutAddress(normalizedAddress);
  }, []);

  const syncMe = useCallback(
    async (token: string) => {
      try {
        const payload = await fetchMe(API_BASE_URL, token);
        await applyMePayload(token, payload);
      } catch {
        // Keep existing session data when profile sync fails.
      }
    },
    [applyMePayload],
  );

  const bootstrap = useCallback(async () => {
    setBooting(true);

    try {
      const [savedLocale, savedTheme, savedSession] = await Promise.all([loadLocale(), loadTheme(), loadSession()]);

      setLocale(savedLocale);
      setTheme(savedTheme);
      setSession(savedSession);
      setProfileName(savedSession?.user?.name || "");
      setProfileEmail(savedSession?.user?.email || "");
      setCheckoutPhone("");
      setCheckoutAddress("");
      setBooting(false);

      void hydratePublicCatalog("", null).catch(() => {
        // Ignore bootstrap catalog failures; fallback data is handled in service layer.
      });

      if (savedSession?.token) {
        void ensureNotificationPermission().catch(() => {
          // Ignore permission setup errors.
        });
        void Promise.all([hydratePrivateData(savedSession.token), syncMe(savedSession.token), loadSupport(savedSession.token)]).catch(() => {
          // Keep app usable even when private bootstrap calls fail/time out.
        });
      }
    } finally {
      setBooting(false);
    }
  }, [hydratePrivateData, hydratePublicCatalog, loadSupport, syncMe]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const syncRemotePush = useCallback(async (authToken: string) => {
    const pushResult = await registerForRemotePushToken();
    if (!pushResult.token) {
      if (pushResult.error) {
        console.log("Customer push token warning:", pushResult.error);
      }
      return;
    }

    const needsSync = syncedPushTokenRef.current !== pushResult.token || syncedSessionTokenRef.current !== authToken;
    if (!needsSync) {
      return;
    }

    try {
      await registerPushTokenService(API_BASE_URL, authToken, {
        push_token: pushResult.token,
        platform: Platform.OS,
        app: "customer-mobile",
      });
      syncedPushTokenRef.current = pushResult.token;
      syncedSessionTokenRef.current = authToken;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown push token sync error";
      console.log("Customer push sync warning:", message);
    }
  }, []);

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    void syncRemotePush(session.token);
  }, [session?.token, syncRemotePush]);

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    const timer = setTimeout(() => {
      void hydratePublicCatalog(query, activeCategoryId);
    }, 280);

    return () => clearTimeout(timer);
  }, [session?.token, query, activeCategoryId, hydratePublicCatalog]);

  useEffect(() => {
    if (!session?.token || appState !== "active") {
      return;
    }

    void loadSupport(session.token, { page: 1, mode: "merge_latest", markSeen: activeTab === "support" });
    const timer = setInterval(() => {
      void loadSupport(session.token, { page: 1, mode: "merge_latest", markSeen: activeTab === "support" });
    }, 5000);

    return () => clearInterval(timer);
  }, [activeTab, appState, loadSupport, session?.token]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setAppState(nextState);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!session?.token || appState !== "active") {
      return;
    }

    const timer = setInterval(() => {
      void hydratePrivateData(session.token);
    }, 2500);

    return () => clearInterval(timer);
  }, [appState, hydratePrivateData, session?.token]);

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    const shouldPollOrders = activeTab === "orders" || detailView === "order";
    if (!shouldPollOrders) {
      return;
    }

    const timer = setInterval(() => {
      void hydratePrivateData(session.token);
    }, 8000);

    return () => clearInterval(timer);
  }, [activeTab, detailView, hydratePrivateData, session?.token]);

  useEffect(() => {
    if (activeTab === "orders") {
      markOrderNotificationsRead();
    }
  }, [activeTab, markOrderNotificationsRead]);

  useEffect(() => {
    if (activeTab === "support") {
      markSupportNotificationsRead();
    }
  }, [activeTab, markSupportNotificationsRead]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);

    try {
      await hydratePublicCatalog(query, activeCategoryId);

      if (session?.token) {
        await Promise.all([
          hydratePrivateData(session.token),
          syncMe(session.token),
          loadSupport(session.token, { page: 1, mode: "merge_latest", markSeen: activeTab === "support" }),
        ]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeCategoryId, activeTab, hydratePrivateData, hydratePublicCatalog, loadSupport, query, session?.token, syncMe]);

  const handleSignIn = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError(tr(locale, "invalidCredentials"));
      return;
    }

    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const nextSession = await signIn(API_BASE_URL, email.trim(), password);
      await saveSession(nextSession);
      setSession(nextSession);
      setProfileName(nextSession.user.name || "");
      setProfileEmail(nextSession.user.email || "");
      setActiveTab("home");
      void syncRemotePush(nextSession.token);
      await Promise.all([
        hydratePrivateData(nextSession.token),
        syncMe(nextSession.token),
        loadSupport(nextSession.token, { page: 1, mode: "merge_latest", markSeen: false }),
      ]);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 0) {
          setAuthError(tr(locale, "networkError"));
        } else if (/invalid credentials/i.test(error.message)) {
          setAuthError(tr(locale, "invalidCredentials"));
        } else {
          setAuthError(error.message || tr(locale, "unknownError"));
        }
      } else {
        setAuthError(tr(locale, "unknownError"));
      }
    } finally {
      setAuthBusy(false);
    }
  }, [email, password, locale, hydratePrivateData, loadSupport, syncMe]);

  const handleRegister = useCallback(async () => {
    if (!registerName.trim() || !email.trim() || !password.trim() || !registerConfirmPassword.trim()) {
      setAuthError(tr(locale, "nameEmailRequired"));
      return;
    }

    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }

    if (password !== registerConfirmPassword) {
      setAuthError("Password confirmation does not match.");
      return;
    }

    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const nextSession = await registerService(API_BASE_URL, {
        name: registerName.trim(),
        email: email.trim(),
        password,
        password_confirmation: registerConfirmPassword,
      });
      await saveSession(nextSession);
      setSession(nextSession);
      setProfileName(nextSession.user.name || "");
      setProfileEmail(nextSession.user.email || "");
      setActiveTab("home");
      void syncRemotePush(nextSession.token);
      await Promise.all([
        hydratePrivateData(nextSession.token),
        syncMe(nextSession.token),
        loadSupport(nextSession.token, { page: 1, mode: "merge_latest", markSeen: false }),
      ]);
      setAuthMessage("Account created. Verification email has been sent.");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 0) {
          setAuthError(tr(locale, "networkError"));
        } else {
          setAuthError(error.message || tr(locale, "unknownError"));
        }
      } else {
        setAuthError(tr(locale, "unknownError"));
      }
    } finally {
      setAuthBusy(false);
    }
  }, [
    email,
    hydratePrivateData,
    loadSupport,
    locale,
    password,
    registerConfirmPassword,
    registerName,
    syncRemotePush,
    syncMe,
  ]);

  const handleForgotPassword = useCallback(async () => {
    if (!email.trim()) {
      setAuthError(tr(locale, "invalidCredentials"));
      return;
    }

    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const response = await requestPasswordReset(API_BASE_URL, email.trim());
      setAuthMessage(response.message || "Password reset link sent.");
    } catch (error) {
      if (error instanceof ApiError) {
        setAuthError(error.message || tr(locale, "unknownError"));
      } else {
        setAuthError(tr(locale, "unknownError"));
      }
    } finally {
      setAuthBusy(false);
    }
  }, [email, locale]);

  const handleResendVerification = useCallback(async () => {
    if (!session?.token && !email.trim()) {
      setAuthError("Please enter your email first.");
      return;
    }

    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");

    try {
      if (session?.token) {
        const response = await resendEmailVerification(API_BASE_URL, session.token);
        setAuthMessage(response.message || "Verification email sent.");
        await syncMe(session.token);
      } else {
        const response = await resendEmailVerificationByEmail(API_BASE_URL, email.trim());
        setAuthMessage(response.message || "Verification email sent.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setAuthError(error.message || tr(locale, "unknownError"));
      } else {
        setAuthError(tr(locale, "unknownError"));
      }
    } finally {
      setAuthBusy(false);
    }
  }, [email, locale, session?.token, syncMe]);

  const handleAddToCart = useCallback(
    async (product: Product, variantId?: number, quantity = 1) => {
      if (!session?.token) {
        return;
      }

      const resolvedVariantId = variantId ?? product.active_variants?.[0]?.id ?? product.variants?.[0]?.id;
      if (!resolvedVariantId) {
        return;
      }

      setAddingProductId(product.id);

      try {
        await addCartItem(API_BASE_URL, session.token, resolvedVariantId, Math.max(1, quantity));
        const nextCart = await fetchCart(API_BASE_URL, session.token);
        setCartItems(nextCart);
      } catch {
        // Keep UX stable and let pull-to-refresh recover.
      } finally {
        setAddingProductId(null);
      }
    },
    [session?.token],
  );

  const openCheckout = useCallback(() => {
    if (!cartItems.length) {
      return;
    }

    setCheckoutError("");
    setCheckoutPhone((current) => current || profilePhone || "");
    setCheckoutAddress((current) => current || profileAddress || "");
    setDetailView("checkout");
  }, [cartItems.length, profileAddress, profilePhone]);

  const handleCheckout = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    if (!checkoutPhone.trim() || checkoutPhone.trim().length < 7) {
      setCheckoutError(tr(locale, "phoneRequired"));
      return;
    }

    if (!checkoutAddress.trim() || checkoutAddress.trim().length < 5) {
      setCheckoutError(tr(locale, "addressRequired"));
      return;
    }

    if (!checkoutSlipUri) {
      setCheckoutError(tr(locale, "paymentSlipRequired"));
      return;
    }

    setCheckoutBusy(true);
    setCheckoutError("");

    try {
      const createdOrder = await placeOrderFromCart(API_BASE_URL, session.token, {
        phone: checkoutPhone.trim(),
        address: checkoutAddress.trim(),
        paymentSlipUri: checkoutSlipUri,
      });
      await hydratePrivateData(session.token);
      if (createdOrder?.id) {
        try {
          const fullOrder = await fetchOrderDetail(API_BASE_URL, session.token, createdOrder.id);
          setDetailOrder(fullOrder);
          setDetailView("order");
        } catch {
          setDetailOrder(createdOrder);
          setDetailView("order");
        }
      } else {
        setDetailView("none");
      }
      setCheckoutSlipUri(null);
      setCheckoutQrData("");
      setCheckoutError("");
      setActiveTab("orders");
    } catch (error) {
      if (error instanceof ApiError) {
        setCheckoutError(error.message || tr(locale, "unknownError"));
      } else {
        setCheckoutError(tr(locale, "unknownError"));
      }
    } finally {
      setCheckoutBusy(false);
    }
  }, [checkoutAddress, checkoutPhone, checkoutSlipUri, hydratePrivateData, locale, session?.token]);

  const handleRemoveCartItem = useCallback(
    async (cartItemId: number) => {
      if (!session?.token) {
        return;
      }

      setRemovingCartItemId(cartItemId);

      try {
        await removeCartItem(API_BASE_URL, session.token, cartItemId);
        const nextCart = await fetchCart(API_BASE_URL, session.token);
        setCartItems(nextCart);
      } finally {
        setRemovingCartItemId(null);
      }
    },
    [session?.token],
  );

  const openProductDetail = useCallback(
    async (product: Product) => {
      setDetailView("product");
      setDetailProduct(product);
      setDetailError("");
      setReviewError("");
      setReviewMessage("");
      setDetailBusy(true);

      try {
        const fullProduct = await fetchProductDetail(API_BASE_URL, product.id);
        setDetailProduct(fullProduct);
      } catch (error) {
        if (error instanceof ApiError) {
          setDetailError(error.message || tr(locale, "unknownError"));
        } else {
          setDetailError(tr(locale, "unknownError"));
        }
      } finally {
        setDetailBusy(false);
      }
    },
    [locale],
  );

  const openProductDetailById = useCallback(
    async (productId: number) => {
      const snapshot =
        products.find((item) => item.id === productId) ||
        cartItems.find((item) => Number(item.product_id) === Number(productId))?.product ||
        null;

      setDetailView("product");
      setDetailProduct(snapshot as Product | null);
      setDetailError("");
      setReviewError("");
      setReviewMessage("");
      setDetailBusy(true);

      try {
        const fullProduct = await fetchProductDetail(API_BASE_URL, productId);
        setDetailProduct(fullProduct);
      } catch (error) {
        if (error instanceof ApiError) {
          setDetailError(error.message || tr(locale, "unknownError"));
        } else {
          setDetailError(tr(locale, "unknownError"));
        }
      } finally {
        setDetailBusy(false);
      }
    },
    [cartItems, locale, products],
  );

  const handleSubmitReview = useCallback(
    async (rating: number | null, comment: string) => {
      if (!session?.token || !detailProduct?.id) {
        return;
      }

      setReviewBusy(true);
      setReviewError("");
      setReviewMessage("");

      try {
        await submitProductReview(API_BASE_URL, session.token, detailProduct.id, { rating, comment });
        const fullProduct = await fetchProductDetail(API_BASE_URL, detailProduct.id);
        setDetailProduct(fullProduct);
        setReviewMessage(tr(locale, "reviewSubmitted"));
      } catch (error) {
        if (error instanceof ApiError) {
          setReviewError(error.message || tr(locale, "unknownError"));
        } else {
          setReviewError(tr(locale, "unknownError"));
        }
      } finally {
        setReviewBusy(false);
      }
    },
    [detailProduct?.id, locale, session?.token],
  );

  const openOrderDetail = useCallback(
    async (orderId: number) => {
      if (!session?.token) {
        return;
      }

      const snapshot = orders.find((order) => order.id === orderId) || null;
      setDetailView("order");
      setDetailOrder(snapshot);
      setDetailError("");
      setDetailBusy(true);

      try {
        const fullOrder = await fetchOrderDetail(API_BASE_URL, session.token, orderId);
        setDetailOrder(fullOrder);
      } catch (error) {
        if (error instanceof ApiError) {
          setDetailError(error.message || tr(locale, "unknownError"));
        } else {
          setDetailError(tr(locale, "unknownError"));
        }
      } finally {
        setDetailBusy(false);
      }
    },
    [locale, orders, session?.token],
  );

  const closeDetail = useCallback(() => {
    setDetailView("none");
    setDetailBusy(false);
    setDetailError("");
    setDetailActionBusy(false);
    setDetailActionMessage("");
    setCheckoutError("");
    setCheckoutQrData("");
    setReviewBusy(false);
    setReviewError("");
    setReviewMessage("");
  }, []);

  const handleCancelOrder = useCallback(
    async (reason: string) => {
      if (!session?.token || !detailOrder) {
        return;
      }

      setDetailActionBusy(true);
      setDetailError("");
      setDetailActionMessage("");

      try {
        const updated = await cancelOrder(API_BASE_URL, session.token, detailOrder.id, reason);
        setDetailOrder(updated);
        setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
        setDetailActionMessage(tr(locale, "orderCancelledSuccess"));
      } catch (error) {
        if (error instanceof ApiError) {
          setDetailError(error.message || tr(locale, "unknownError"));
        } else {
          setDetailError(tr(locale, "unknownError"));
        }
      } finally {
        setDetailActionBusy(false);
      }
    },
    [detailOrder, locale, session?.token],
  );

  const handleRequestRefund = useCallback(async () => {
    if (!session?.token || !detailOrder) {
      return;
    }

    setDetailActionBusy(true);
    setDetailError("");
    setDetailActionMessage("");

    try {
      const updated = await requestRefund(API_BASE_URL, session.token, detailOrder.id);
      setDetailOrder(updated);
      setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
      setDetailActionMessage(tr(locale, "refundRequestedSuccess"));
    } catch (error) {
      if (error instanceof ApiError) {
        setDetailError(error.message || tr(locale, "unknownError"));
      } else {
        setDetailError(tr(locale, "unknownError"));
      }
    } finally {
      setDetailActionBusy(false);
    }
  }, [detailOrder, locale, session?.token]);

  const handleRequestReturn = useCallback(
    async (reason: string) => {
      if (!session?.token || !detailOrder) {
        return;
      }

      setDetailActionBusy(true);
      setDetailError("");
      setDetailActionMessage("");

      try {
        const updated = await requestReturn(API_BASE_URL, session.token, detailOrder.id, reason);
        setDetailOrder(updated);
        setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
        setDetailActionMessage(tr(locale, "returnRequestedSuccess"));
      } catch (error) {
        if (error instanceof ApiError) {
          setDetailError(error.message || tr(locale, "unknownError"));
        } else {
          setDetailError(tr(locale, "unknownError"));
        }
      } finally {
        setDetailActionBusy(false);
      }
    },
    [detailOrder, locale, session?.token],
  );

  const handleSendSupport = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    const text = supportDraft.trim();
    if (!text && !supportImageUri && !supportEditingMessageId) {
      return;
    }

    setSupportSending(true);
    setSupportError("");

    try {
      if (supportEditingMessageId) {
        await updateSupportMessage(API_BASE_URL, session.token, supportEditingMessageId, text);
        setSupportMessages((prev) => prev.map((item) => (item.id === supportEditingMessageId ? { ...item, message: text } : item)));
      } else {
        await sendSupportMessage(API_BASE_URL, session.token, text, supportImageUri);
      }
      setSupportDraft("");
      setSupportImageUri(null);
      setSupportEditingMessageId(null);
      await loadSupport(session.token, { page: 1, mode: "merge_latest", markSeen: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setSupportError(error.message || tr(locale, "unknownError"));
      } else {
        setSupportError(tr(locale, "unknownError"));
      }
    } finally {
      setSupportSending(false);
    }
  }, [loadSupport, locale, session?.token, supportDraft, supportEditingMessageId, supportImageUri]);

  const handleLoadMoreSupport = useCallback(async () => {
    if (!session?.token || supportLoadingMore || !supportHasMore) {
      return;
    }

    await loadSupport(session.token, { page: supportCurrentPage + 1, mode: "append", markSeen: activeTab === "support" });
  }, [activeTab, loadSupport, session?.token, supportCurrentPage, supportHasMore, supportLoadingMore]);

  const handleStartEditSupport = useCallback((messageId: number) => {
    const target = supportMessages.find((item) => item.id === messageId);
    if (!target) return;
    setSupportEditingMessageId(messageId);
    setSupportDraft(target.message || "");
    setSupportImageUri(null);
  }, [supportMessages]);

  const handleCancelEditSupport = useCallback(() => {
    setSupportEditingMessageId(null);
    setSupportDraft("");
  }, []);

  const handleDeleteSupport = useCallback(async (messageId: number) => {
    if (!session?.token) return;

    try {
      await deleteSupportMessage(API_BASE_URL, session.token, messageId);
      setSupportMessages((prev) => prev.filter((item) => item.id !== messageId));
      if (supportEditingMessageId === messageId) {
        setSupportEditingMessageId(null);
        setSupportDraft("");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setSupportError(error.message || tr(locale, "unknownError"));
      } else {
        setSupportError(tr(locale, "unknownError"));
      }
    }
  }, [locale, session?.token, supportEditingMessageId]);

  const handleSaveProfile = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileError(tr(locale, "nameEmailRequired"));
      setProfileMessage("");
      return;
    }

    setProfileBusy(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const payload = await updateMe(API_BASE_URL, session.token, {
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone_number: profilePhone.trim(),
        nrc_number: profileNrc.trim(),
        address_line_1: profileAddress.trim(),
        city: profileCity.trim(),
        state: profileState.trim(),
        postal_code: profilePostalCode.trim(),
      });

      await applyMePayload(session.token, payload);
      setProfileMessage(payload.message || tr(locale, "profileUpdated"));
    } catch (error) {
      if (error instanceof ApiError) {
        setProfileError(error.message || tr(locale, "profileUpdateFailed"));
      } else {
        setProfileError(tr(locale, "profileUpdateFailed"));
      }
    } finally {
      setProfileBusy(false);
    }
  }, [
    session?.token,
    profileName,
    profileEmail,
    profilePhone,
    profileNrc,
    profileAddress,
    profileCity,
    profileState,
    profilePostalCode,
    applyMePayload,
    locale,
  ]);

  const handleUploadProfilePhoto = useCallback(async (photoUri: string) => {
    if (!session?.token || !photoUri) {
      return;
    }

    setProfilePhotoBusy(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const payload = await updateMePhoto(API_BASE_URL, session.token, photoUri);
      await applyMePayload(session.token, payload);
      setProfileMessage(payload.message || tr(locale, "profileUpdated"));
    } catch (error) {
      if (error instanceof ApiError) {
        setProfileError(error.message || tr(locale, "profileUpdateFailed"));
      } else {
        setProfileError(tr(locale, "profileUpdateFailed"));
      }
    } finally {
      setProfilePhotoBusy(false);
    }
  }, [applyMePayload, locale, session?.token]);

  const handleLogout = useCallback(async () => {
    if (session?.token) {
      try {
        if (syncedPushTokenRef.current) {
          await unregisterPushTokenService(API_BASE_URL, session.token, syncedPushTokenRef.current);
        }
        await logoutService(API_BASE_URL, session.token);
      } catch {
        // Ignore logout network errors and clear local session anyway.
      }
    }

    await clearSession();
    setSession(null);
    setOrders([]);
    setCartItems([]);
    setDetailView("none");
    setDetailProduct(null);
    setDetailOrder(null);
    setProfileName("");
    setProfileEmail("");
    setProfilePhone("");
    setProfileNrc("");
    setProfileAddress("");
    setProfileCity("");
    setProfileState("");
    setProfilePostalCode("");
    setProfilePhotoUrl(null);
    setProfileError("");
    setProfileMessage("");
    setSupportMessages([]);
    setSupportAssignedStaffName(null);
    setSupportDraft("");
    setSupportImageUri(null);
    setSupportError("");
    setSupportCurrentPage(1);
    setSupportHasMore(false);
    setSupportLoadingMore(false);
    setSupportEditingMessageId(null);
    setCheckoutPhone("");
    setCheckoutAddress("");
    setCheckoutError("");
    setCheckoutSlipUri(null);
    setCheckoutQrData("");
    setNotificationsUnreadCount(0);
    setSupportUnreadCount(0);
    setNotifications([]);
    setNotificationBanner(null);
    orderSnapshotRef.current.clear();
    flashSaleSnapshotRef.current = "";
    supportLatestIdRef.current = 0;
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    syncedPushTokenRef.current = null;
    syncedSessionTokenRef.current = null;
  }, [session?.token]);

  const toggleLocale = useCallback(async () => {
    const nextLocale: Locale = locale === "en" ? "mm" : "en";
    setLocale(nextLocale);
    await saveLocale(nextLocale);
  }, [locale]);

  const toggleTheme = useCallback(async () => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    await saveTheme(nextTheme);
  }, [theme]);

  const tabItems = useMemo(
    () => [
      { key: "home" as const, label: tr(locale, "tabsHome") },
      { key: "orders" as const, label: tr(locale, "tabsOrders") },
      { key: "cart" as const, label: tr(locale, "tabsCart") },
      { key: "support" as const, label: tr(locale, "tabsSupport") },
      { key: "account" as const, label: tr(locale, "tabsAccount") },
    ],
    [locale],
  );

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems],
  );
  const totalNotificationCount = notificationsUnreadCount + supportUnreadCount;

  const openNotification = useCallback(
    async (notification: AppNotification) => {
      if (!notification.isRead) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
        );
        if (notification.channel === "support") {
          setSupportUnreadCount((current) => Math.max(0, current - 1));
        } else {
          setNotificationsUnreadCount((current) => Math.max(0, current - 1));
        }
      }

      setNotificationBanner(null);
      if (notification.orderId) {
        await openOrderDetail(notification.orderId);
      }
    },
    [openOrderDetail],
  );

  return {
    booting,
    dark,
    locale,
    theme,
    session,
    activeTab,
    tabItems,
    cartCount,
    notificationsUnreadCount,
    supportUnreadCount,
    allNotificationsCount: totalNotificationCount,
    notifications: {
      list: notifications,
      banner: notificationBanner,
      markAllRead: markAllNotificationsRead,
      open: openNotification,
      closeBanner: () => setNotificationBanner(null),
    },
    setActiveTab,
    login: {
      registerName,
      registerConfirmPassword,
      email,
      password,
      busy: authBusy,
      error: authError,
      message: authMessage,
      setRegisterName,
      setRegisterConfirmPassword,
      setEmail,
      setPassword,
      submit: handleSignIn,
      submitRegister: handleRegister,
      forgotPassword: handleForgotPassword,
      resendVerification: handleResendVerification,
    },
    catalog: {
      query,
      categories,
      activeCategoryId,
      products,
      addingProductId,
      setQuery,
      setActiveCategoryId,
      addToCart: handleAddToCart,
      openProductDetail,
      openProductDetailById,
    },
    orders,
    cart: {
      items: cartItems,
      removingItemId: removingCartItemId,
      checkoutBusy,
      openCheckout,
      confirmCheckout: handleCheckout,
      checkoutPhone,
      checkoutAddress,
      checkoutSlipUri,
      checkoutQrData,
      checkoutError,
      setCheckoutPhone,
      setCheckoutAddress,
      setCheckoutSlipUri,
      setCheckoutQrData,
      removeItem: handleRemoveCartItem,
    },
    detail: {
      view: detailView,
      busy: detailBusy,
      error: detailError,
      actionBusy: detailActionBusy,
      actionMessage: detailActionMessage,
      product: detailProduct,
      order: detailOrder,
      reviewBusy,
      reviewError,
      reviewMessage,
      close: closeDetail,
      openOrderDetail,
      submitReview: handleSubmitReview,
      cancelOrder: handleCancelOrder,
      requestRefund: handleRequestRefund,
      requestReturn: handleRequestReturn,
    },
    refreshing,
    refreshAll,
    account: {
      toggleLocale,
      toggleTheme,
      logout: handleLogout,
      saveProfile: handleSaveProfile,
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
      profilePhotoUrl,
      profilePhotoBusy,
      setProfileName,
      setProfileEmail,
      setProfilePhone,
      setProfileNrc,
      setProfileAddress,
      setProfileCity,
      setProfileState,
      setProfilePostalCode,
      uploadProfilePhoto: handleUploadProfilePhoto,
    },
    support: {
      messages: supportMessages,
      assignedStaffName: supportAssignedStaffName,
      draft: supportDraft,
      imageUri: supportImageUri,
      busy: supportBusy,
      loadingMore: supportLoadingMore,
      hasMore: supportHasMore,
      sending: supportSending,
      error: supportError,
      editingMessageId: supportEditingMessageId,
      setDraft: setSupportDraft,
      setImageUri: setSupportImageUri,
      send: handleSendSupport,
      refresh: () => (session?.token ? loadSupport(session.token, { page: 1, mode: "replace", markSeen: true }) : Promise.resolve()),
      loadMore: handleLoadMoreSupport,
      startEdit: handleStartEditSupport,
      cancelEdit: handleCancelEditSupport,
      deleteMessage: handleDeleteSupport,
    },
  };
}

function normalizeMediaUrl(baseUrl: string, value?: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        const origin = stripApiPath(baseUrl);
        return `${origin}${parsed.pathname}`;
      }
      return value;
    } catch {
      return value;
    }
  }
  const origin = stripApiPath(baseUrl);
  return `${origin}${value.startsWith("/") ? value : `/${value}`}`;
}

function stripApiPath(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, "");
  const index = normalized.indexOf("/api/");
  return index >= 0 ? normalized.slice(0, index) : normalized;
}
