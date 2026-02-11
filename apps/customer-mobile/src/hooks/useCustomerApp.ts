import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/server";
import { tr } from "../i18n/strings";
import { ApiError } from "../lib/http";
import { clearSession, loadLocale, loadSession, loadTheme, saveLocale, saveSession, saveTheme } from "../lib/storage";
import { addCartItem, fetchCart, removeCartItem } from "../services/cartService";
import { fetchCategories, fetchProductDetail, fetchProducts, submitProductReview } from "../services/catalogService";
import { fetchMe, logout as logoutService, signIn, updateMe, updateMePhoto } from "../services/authService";
import { cancelOrder, fetchOrderDetail, fetchOrders, placeOrderFromCart, requestRefund, requestReturn } from "../services/orderService";
import { fetchSupportMessages, sendSupportMessage } from "../services/supportService";
import type { CartItem, Category, CustomerOrder, CustomerTab, Locale, MePayload, Product, SupportMessage, ThemeMode } from "../types/domain";

type DetailView = "none" | "product" | "order" | "checkout";

export function useCustomerApp() {
  const [booting, setBooting] = useState(true);
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<ThemeMode>("light");

  const [session, setSession] = useState<Awaited<ReturnType<typeof loadSession>>>(null);
  const [activeTab, setActiveTab] = useState<CustomerTab>("home");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

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
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState("");

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

  const dark = theme === "dark";

  const hydratePublicCatalog = useCallback(
    async (search = query, categoryId = activeCategoryId) => {
      const [nextCategories, nextProducts] = await Promise.all([
        fetchCategories(API_BASE_URL),
        fetchProducts(API_BASE_URL, search, categoryId),
      ]);

      setCategories(nextCategories);
      setProducts(nextProducts);
    },
    [query, activeCategoryId],
  );

  const hydratePrivateData = useCallback(async (token: string) => {
    const [nextOrders, nextCart] = await Promise.all([fetchOrders(API_BASE_URL, token), fetchCart(API_BASE_URL, token)]);

    setOrders(nextOrders);
    setCartItems(nextCart);
  }, []);

  const loadSupport = useCallback(
    async (token: string) => {
      setSupportBusy(true);
      setSupportError("");

      try {
        const payload = await fetchSupportMessages(API_BASE_URL, token, 1);
        setSupportMessages(payload.messages || []);
        setSupportAssignedStaffName(payload.assigned_staff?.name || null);
      } catch (error) {
        if (error instanceof ApiError) {
          setSupportError(error.message || tr(locale, "unknownError"));
        } else {
          setSupportError(tr(locale, "unknownError"));
        }
      } finally {
        setSupportBusy(false);
      }
    },
    [locale],
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

      await hydratePublicCatalog("", null);

      if (savedSession?.token) {
        await Promise.all([hydratePrivateData(savedSession.token), syncMe(savedSession.token), loadSupport(savedSession.token)]);
      }
    } finally {
      setBooting(false);
    }
  }, [hydratePrivateData, hydratePublicCatalog, loadSupport, syncMe]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

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
    if (!session?.token || activeTab !== "support") {
      return;
    }

    const timer = setInterval(() => {
      void loadSupport(session.token);
    }, 10000);

    return () => clearInterval(timer);
  }, [activeTab, loadSupport, session?.token]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);

    try {
      await hydratePublicCatalog(query, activeCategoryId);

      if (session?.token) {
        await Promise.all([hydratePrivateData(session.token), syncMe(session.token), loadSupport(session.token)]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeCategoryId, hydratePrivateData, hydratePublicCatalog, loadSupport, query, session?.token, syncMe]);

  const handleSignIn = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError(tr(locale, "invalidCredentials"));
      return;
    }

    setAuthBusy(true);
    setAuthError("");

    try {
      const nextSession = await signIn(API_BASE_URL, email.trim(), password);
      await saveSession(nextSession);
      setSession(nextSession);
      setProfileName(nextSession.user.name || "");
      setProfileEmail(nextSession.user.email || "");
      setActiveTab("home");
      await Promise.all([hydratePrivateData(nextSession.token), syncMe(nextSession.token), loadSupport(nextSession.token)]);
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
      await placeOrderFromCart(API_BASE_URL, session.token, {
        phone: checkoutPhone.trim(),
        address: checkoutAddress.trim(),
        paymentSlipUri: checkoutSlipUri,
      });
      await hydratePrivateData(session.token);
      setCheckoutSlipUri(null);
      setCheckoutQrData("");
      setCheckoutError("");
      setDetailView("none");
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
    if (!text && !supportImageUri) {
      return;
    }

    setSupportSending(true);
    setSupportError("");

    try {
      await sendSupportMessage(API_BASE_URL, session.token, text, supportImageUri);
      setSupportDraft("");
      setSupportImageUri(null);
      await loadSupport(session.token);
    } catch (error) {
      if (error instanceof ApiError) {
        setSupportError(error.message || tr(locale, "unknownError"));
      } else {
        setSupportError(tr(locale, "unknownError"));
      }
    } finally {
      setSupportSending(false);
    }
  }, [loadSupport, locale, session?.token, supportDraft, supportImageUri]);

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
    setCheckoutPhone("");
    setCheckoutAddress("");
    setCheckoutError("");
    setCheckoutSlipUri(null);
    setCheckoutQrData("");
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

  return {
    booting,
    dark,
    locale,
    theme,
    session,
    activeTab,
    tabItems,
    cartCount,
    setActiveTab,
    login: {
      email,
      password,
      busy: authBusy,
      error: authError,
      setEmail,
      setPassword,
      submit: handleSignIn,
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
      sending: supportSending,
      error: supportError,
      setDraft: setSupportDraft,
      setImageUri: setSupportImageUri,
      send: handleSendSupport,
      refresh: () => (session?.token ? loadSupport(session.token) : Promise.resolve()),
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
