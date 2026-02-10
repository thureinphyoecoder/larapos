import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { authService } from "./features/auth/authService";
import { catalogService } from "./features/catalog/catalogService";
import { orderService } from "./features/orders/orderService";
import type { Order, Product, User } from "./core/types/contracts";
import { sessionStore } from "./state/sessionStore";
import { StatusBadge } from "./components/StatusBadge";
import { CameraBarcodeScanner, findProductByScanCode, isCameraScannerSupported } from "./features/scanner/barcodeScanner";
import { receiptService } from "./features/receipt/receiptService";
import { mapErrorToMessage } from "./core/errors/errorMapper";

type CartLine = {
  variantId: number;
  sku: string;
  productName: string;
  qty: number;
  price: number;
  maxStock: number;
};

type OfflineStatus = {
  online: boolean;
  pending: number;
  lastSyncAt: string | null;
};

type ToastItem = {
  id: number;
  tone: "error" | "notice";
  message: string;
  remainingMs: number;
};

const DEFAULT_OFFLINE_STATUS: OfflineStatus = {
  online: true,
  pending: 0,
  lastSyncAt: null,
};
const LAST_RECEIPT_KEY = "larapos.pos.last_receipt";
const DEVICE_SIM_MODE_KEY = "larapos.pos.device_sim_mode";
const NOTIFICATION_SOUND_KEY = "larapos.pos.notification_sound";
const SEARCH_DEBOUNCE_MS = 280;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [systemInfo, setSystemInfo] = useState<{ appName: string; appVersion: string; platform: string } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isRestoring, setIsRestoring] = useState(true);

  const [authBusy, setAuthBusy] = useState(false);
  const [productsBusy, setProductsBusy] = useState(false);
  const [ordersBusy, setOrdersBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncIndicatorVisible, setSyncIndicatorVisible] = useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [receiptPreviewText, setReceiptPreviewText] = useState<string>(
    () => window.sessionStorage.getItem(LAST_RECEIPT_KEY) ?? "",
  );
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(DEFAULT_OFFLINE_STATUS);
  const [deviceSimMode, setDeviceSimMode] = useState<boolean>(() => window.localStorage.getItem(DEVICE_SIM_MODE_KEY) === "1");
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState<boolean>(
    () => window.localStorage.getItem(NOTIFICATION_SOUND_KEY) === "1",
  );
  const [simulatedScanCode, setSimulatedScanCode] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraScannerRef = useRef<CameraBarcodeScanner | null>(null);
  const scanningLockRef = useRef(false);
  const searchDebounceRef = useRef<number | null>(null);
  const productLoadSeqRef = useRef(0);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef(new Map<number, number>());
  const toastMetaRef = useRef(new Map<number, { startAt: number; remainingMs: number }>());
  const audioCtxRef = useRef<AudioContext | null>(null);

  const cartTotal = useMemo(() => cart.reduce((sum, line) => sum + line.price * line.qty, 0), [cart]);

  const resolveStockForVariant = (variantId: number): number | null => {
    for (const product of products) {
      const variant = product.active_variants?.find((item) => item.id === variantId);
      if (variant) return Number(variant.stock_level);
    }

    const inCart = cart.find((line) => line.variantId === variantId);
    return inCart ? Number(inCart.maxStock) : null;
  };

  useEffect(() => {
    cameraScannerRef.current = new CameraBarcodeScanner();
    setCameraSupported(isCameraScannerSupported());
  }, []);

  useEffect(() => {
    return () => {
      stopCameraScanner();
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
      for (const timerId of toastTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }
      toastTimersRef.current.clear();
      toastMetaRef.current.clear();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    sessionStore.bootstrap();
    window.desktopBridge.systemInfo().then(setSystemInfo).catch(() => undefined);
    void refreshOfflineStatus();

    const token = sessionStore.getToken();
    const cachedUser = sessionStore.getUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    if (!token) {
      setIsRestoring(false);
      return () => {
        active = false;
      };
    }

    authService
      .me()
      .then(async (profile) => {
        if (!active) return;
        sessionStore.setUser(profile);
        setUser(profile);
        await Promise.all([
          loadProducts("", { silentErrors: true, trackBusy: false }),
          loadOrders({ silentErrors: true, trackBusy: false }),
        ]);
      })
      .catch(() => {
        if (!active) return;
        sessionStore.clearSession();
        setUser(null);
      })
      .finally(() => {
        if (active) {
          setIsRestoring(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshOfflineStatus();
    }, 20000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => {
      void loadOrders({ silentErrors: true, trackBusy: false });
    }, 15000);

    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    window.localStorage.setItem(DEVICE_SIM_MODE_KEY, deviceSimMode ? "1" : "0");
  }, [deviceSimMode]);

  useEffect(() => {
    window.localStorage.setItem(NOTIFICATION_SOUND_KEY, notificationSoundEnabled ? "1" : "0");
  }, [notificationSoundEnabled]);

  useEffect(() => {
    if (!error) return;
    enqueueToast("error", error);
    setError("");
  }, [error]);

  useEffect(() => {
    if (!notice) return;
    enqueueToast("notice", notice);
    setNotice("");
  }, [notice]);

  useEffect(() => {
    if (!user) return;

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = window.setTimeout(() => {
      void loadProducts(keyword, { silentErrors: true, reason: "search", trackBusy: false });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [keyword, user]);

  useEffect(() => {
    if (!user) return;

    let buffer = "";
    let lastKeyAt = 0;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        target?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyAt > 140) {
        buffer = "";
      }
      lastKeyAt = now;

      if (event.key === "Enter") {
        if (buffer.length >= 4) {
          void handleScannedCode(buffer);
        }
        buffer = "";
        return;
      }

      if (event.key.length === 1) {
        buffer += event.key;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [user, products]);

  const refreshOfflineStatus = async (): Promise<void> => {
    try {
      const status = await window.desktopBridge.offlineStatus();
      setOfflineStatus(status);
    } catch {
      // Keep UI usable if bridge call fails.
    }
  };

  const runSync = async (): Promise<void> => {
    const token = sessionStore.getToken();
    if (!token) {
      setError("Session token missing. Please log in again.");
      return;
    }

    const startedAt = Date.now();
    try {
      setSyncBusy(true);
      setError("");
      const result = await orderService.syncQueuedOrders(token);
      if (result.failed > 0) {
        setError(
          `Sync completed with issues: ${result.synced} synced, ${result.failed} failed, ${result.pending} pending.`,
        );
      } else {
        setNotice(`Sync finished: ${result.synced} synced, ${result.pending} pending.`);
      }

      await refreshDashboard({ trackBusy: false });
      await refreshOfflineStatus();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      const elapsed = Date.now() - startedAt;
      const minVisibleMs = 700;
      if (elapsed < minVisibleMs) {
        await new Promise((resolve) => window.setTimeout(resolve, minVisibleMs - elapsed));
      }
      setSyncBusy(false);
    }
  };

  const loadProducts = async (
    searchKeyword = keyword,
    options?: { silentErrors?: boolean; reason?: "search" | "refresh" | "init"; trackBusy?: boolean },
  ): Promise<void> => {
    const requestSeq = ++productLoadSeqRef.current;
    const trackBusy = options?.trackBusy ?? true;
    try {
      if (trackBusy) {
        setProductsBusy(true);
      }
      if (!options?.silentErrors) {
        setError("");
      }
      const normalizedKeyword = searchKeyword.trim();
      const response = await catalogService.listProducts(normalizedKeyword);
      let filtered = filterProductsByKeyword(response.data, normalizedKeyword);

      if (normalizedKeyword !== "" && filtered.length === 0) {
        const fallback = await catalogService.listProducts("");
        filtered = filterProductsByKeyword(fallback.data, normalizedKeyword);
      }

      if (requestSeq !== productLoadSeqRef.current) return;
      setProducts(filtered);
    } catch (err) {
      if (requestSeq !== productLoadSeqRef.current) return;
      if (!options?.silentErrors) {
        setError(parseApiError(err));
      }
    } finally {
      if (trackBusy) {
        setProductsBusy(false);
      }
      await refreshOfflineStatus();
    }
  };

  const loadOrders = async (options?: { silentErrors?: boolean; trackBusy?: boolean }): Promise<void> => {
    const trackBusy = options?.trackBusy ?? true;
    try {
      if (trackBusy) {
        setOrdersBusy(true);
      }
      if (!options?.silentErrors) {
        setError("");
      }
      const response = await orderService.listOrders();
      setOrders(response.data);
    } catch (err) {
      if (!options?.silentErrors) {
        setError(parseApiError(err));
      }
    } finally {
      if (trackBusy) {
        setOrdersBusy(false);
      }
      await refreshOfflineStatus();
    }
  };

  const refreshDashboard = async (options?: { trackBusy?: boolean }): Promise<void> => {
    const trackBusy = options?.trackBusy ?? true;
    await Promise.all([loadProducts("", { trackBusy }), loadOrders({ trackBusy })]);
  };

  const runProductSearch = async (): Promise<void> => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    await loadProducts(keyword, { trackBusy: true });
  };

  const enqueueToast = (tone: "error" | "notice", message: string): void => {
    const id = ++toastIdRef.current;
    const remainingMs = 4200;
    setToasts((current) => [...current, { id, tone, message, remainingMs }]);
    startToastTimer(id, remainingMs);
    if (tone === "error") {
      playNotificationTone();
    }
  };

  const playNotificationTone = (): void => {
    if (!notificationSoundEnabled) return;
    if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return;

    try {
      const audioCtx = audioCtxRef.current ?? new window.AudioContext();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") {
        void audioCtx.resume();
      }

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 660;
      gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.055, audioCtx.currentTime + 0.018);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.16);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.18);
    } catch {
      // Avoid blocking UX when audio playback is unavailable.
    }
  };

  const startToastTimer = (id: number, durationMs: number): void => {
    toastMetaRef.current.set(id, { startAt: Date.now(), remainingMs: durationMs });
    const timerId = window.setTimeout(() => {
      removeToast(id);
    }, durationMs);
    toastTimersRef.current.set(id, timerId);
  };

  const removeToast = (id: number): void => {
    const timerId = toastTimersRef.current.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
      toastTimersRef.current.delete(id);
    }
    toastMetaRef.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const pauseToast = (id: number): void => {
    const meta = toastMetaRef.current.get(id);
    if (meta) {
      const elapsed = Date.now() - meta.startAt;
      const nextRemaining = Math.max(200, meta.remainingMs - elapsed);
      toastMetaRef.current.set(id, { startAt: Date.now(), remainingMs: nextRemaining });
      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, remainingMs: nextRemaining } : toast)),
      );
    }

    const timerId = toastTimersRef.current.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
      toastTimersRef.current.delete(id);
    }
  };

  const resumeToast = (id: number, remainingMs: number): void => {
    startToastTimer(id, remainingMs);
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      setAuthBusy(true);
      const response = await authService.login(email.trim(), password);
      sessionStore.setSession(response.token, response.user);
      setUser(response.user);
      await refreshDashboard();
      await runSync();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("Logout လုပ်မှာသေချာပါသလား?");
    if (!confirmed) return;

    try {
      await authService.logout();
    } catch {
      // Token may already be invalid; clear client session anyway.
    } finally {
      stopCameraScanner();
      sessionStore.clearSession();
      setUser(null);
      setProducts([]);
      setOrders([]);
      setCart([]);
      setPhone("");
      setAddress("");
      setNotice("");
      setReceiptPreviewText("");
      window.sessionStorage.removeItem(LAST_RECEIPT_KEY);
    }
  };

  const printLastReceipt = async (): Promise<void> => {
    const text = receiptPreviewText || window.sessionStorage.getItem(LAST_RECEIPT_KEY);
    if (!text) {
      setError("ပြေစာမရှိသေးပါ။ အရင်ဆုံး အော်ဒါတင်ပေးပါ။");
      return;
    }

    setError("");
    const result = await receiptService.printText(text, { simulate: deviceSimMode });
    if (!result.ok) {
      setError(result.message ?? "ပြေစာထုတ်ရာတွင် မအောင်မြင်ပါ။");
      return;
    }

    setNotice(deviceSimMode ? "ပြေစာ စမ်းသပ်ထုတ်ခြင်း အောင်မြင်ပါသည်။" : "ပြေစာကို ပရင်တာသို့ ပို့ပြီးပါပြီ။");
  };

  const simulateScan = async (): Promise<void> => {
    const code = simulatedScanCode.trim();
    if (!code) {
      setError("Enter a SKU/barcode for simulation.");
      return;
    }

    setError("");
    await handleScannedCode(code);
  };

  const addVariantToCart = (product: Product, variantId?: number) => {
    const variant = variantId
      ? product.active_variants?.find((item) => item.id === variantId)
      : product.active_variants?.[0];
    if (!variant || Number(variant.stock_level) <= 0) return;

    setCart((current) => {
      const existing = current.find((line) => line.variantId === variant.id);
      if (existing) {
        if (existing.qty >= Number(variant.stock_level)) {
          setNotice(`Stock limit reached for ${variant.sku}.`);
          return current;
        }

        return current.map((line) =>
          line.variantId === variant.id
            ? { ...line, qty: line.qty + 1, maxStock: Number(variant.stock_level) }
            : line,
        );
      }

      return [
        ...current,
        {
          variantId: variant.id,
          sku: variant.sku,
          productName: product.name,
          qty: 1,
          price: variant.price,
          maxStock: Number(variant.stock_level),
        },
      ];
    });
  };

  const addToCartFromScan = async (rawCode: string): Promise<void> => {
    const code = rawCode.trim();
    if (!code) return;

    setKeyword(code);
    const response = await catalogService.listProducts(code);
    setProducts(response.data);
    const found = findProductByScanCode(response.data, code);

    if (!found) {
      setNotice(`Scanned: ${code} (no matching product)`);
      return;
    }

    addVariantToCart(found.product, found.variant?.id);
    setNotice(`Scanned and added: ${found.variant?.sku ?? found.product.sku ?? code}`);
  };

  const handleScannedCode = async (code: string): Promise<void> => {
    if (scanningLockRef.current) return;
    scanningLockRef.current = true;

    try {
      setError("");
      await addToCartFromScan(code);
    } finally {
      window.setTimeout(() => {
        scanningLockRef.current = false;
      }, 250);
    }
  };

  const openCameraScanner = async (): Promise<void> => {
    if (!cameraSupported) {
      setError("Camera barcode/QR scan is not supported on this device.");
      return;
    }

    try {
      setCameraBusy(true);
      setError("");

      const video = videoRef.current;
      if (!video) {
        setError("Camera preview is not available.");
        return;
      }

      if (!cameraScannerRef.current) {
        cameraScannerRef.current = new CameraBarcodeScanner();
      }

      await cameraScannerRef.current.open(video);
      setCameraOpen(true);
      cameraScannerRef.current.start(video, async (code) => {
        await handleScannedCode(code);
        stopCameraScanner();
      });
    } catch (err) {
      setError(parseApiError(err));
      stopCameraScanner();
    } finally {
      setCameraBusy(false);
    }
  };

  const stopCameraScanner = () => {
    cameraScannerRef.current?.stop(videoRef.current);
    setCameraOpen(false);
  };

  useEffect(() => {
    let timerId: number | null = null;

    if (syncBusy) {
      setSyncIndicatorVisible(true);
    } else if (syncIndicatorVisible) {
      timerId = window.setTimeout(() => {
        setSyncIndicatorVisible(false);
      }, 350);
    }

    return () => {
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [syncBusy, syncIndicatorVisible]);

  const updateCartQty = (variantId: number, qty: number) => {
    if (!Number.isFinite(qty)) return;
    const requested = Math.max(1, Math.round(qty));
    const available = resolveStockForVariant(variantId);
    const cappedQty = available === null ? requested : Math.min(requested, available);

    if (available !== null && requested > available) {
      setNotice(`Requested qty exceeds stock. Max available: ${available}.`);
    }

    setCart((current) =>
      current
        .map((line) => (line.variantId === variantId ? { ...line, qty: cappedQty } : line))
        .filter((line) => line.qty > 0),
    );
  };

  const removeCartItem = (variantId: number) => {
    setCart((current) => current.filter((line) => line.variantId !== variantId));
  };

  const submitOrder = async () => {
    if (!cart.length) {
      setError("Cart is empty.");
      return;
    }

    const normalizedPhone = phone.trim();
    const normalizedAddress = address.trim();

    if (normalizedPhone.length > 0 && normalizedPhone.length < 7) {
      setError("Customer phone must be at least 7 characters or left blank for walk-in.");
      return;
    }

    for (const line of cart) {
      const stock = resolveStockForVariant(line.variantId);
      if (stock !== null && line.qty > stock) {
        setError(`Insufficient stock for ${line.sku}. Available: ${stock}.`);
        return;
      }
    }

    try {
      setCheckoutBusy(true);
      setError("");
      setNotice("");
      const result = await orderService.createOrder({
        phone: normalizedPhone !== "" ? normalizedPhone : null,
        address: normalizedAddress !== "" ? normalizedAddress : null,
        items: cart.map((line) => ({ variant_id: line.variantId, quantity: line.qty })),
      });
      const receiptText = receiptService.buildText({
        order: result.data,
        cashierName: user.name,
        lines: cart.map((line) => ({
          sku: line.sku,
          productName: line.productName,
          qty: line.qty,
          price: line.price,
        })),
      });
      window.sessionStorage.setItem(LAST_RECEIPT_KEY, receiptText);
      setReceiptPreviewText(receiptText);
      const printResult = await receiptService.printText(receiptText, { simulate: deviceSimMode });
      const orderMessage =
        result.data.status === "pending_sync"
          ? "Order queued locally. It will sync automatically when internet is available."
          : "Order created successfully.";
      const printMessage = printResult.ok
        ? "ပြေစာကို ပရင်တာသို့ ပို့ပြီးပါပြီ။"
        : `ပြေစာထုတ်ရန် မပြီးသေးပါ (${printResult.message ?? "printer မအသင့်မဖြစ်သေးပါ"})။ အပေါ်ဘက်က 'ပြေစာထုတ်ရန်' ကို နှိပ်ပြီး ထပ်စမ်းပါ။`;
      setNotice(`${orderMessage} ${printMessage}`);
      setCart([]);
      await loadOrders({ silentErrors: true });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setCheckoutBusy(false);
    }
  };

  if (isRestoring) {
    return (
      <main className="screen screen-center">
        <section className="card auth-card">
          <h1>LaraPee POS</h1>
          <p className="muted">Restoring secure session...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="screen screen-center auth-screen">
        <section className="card auth-card">
          <p className="eyebrow">Enterprise Console</p>
          <h1>LaraPee POS Desktop</h1>
          <p className="muted">Staff authentication and synchronized checkout operations.</p>
          {systemInfo ? (
            <p className="tiny muted">
              {systemInfo.appName} v{systemInfo.appVersion} ({systemInfo.platform})
            </p>
          ) : null}
          <form onSubmit={handleLogin} className="stack">
            <label>
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" disabled={authBusy}>
              {authBusy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="screen app-shell">
      <div className="shell-wrap">
        <div
          className={`sync-corner ${syncBusy ? "active" : "idle"} ${syncIndicatorVisible ? "visible" : "hidden"}`}
          role="status"
          aria-live="polite"
          aria-label={syncBusy ? "Syncing" : "Sync idle"}
          title={syncBusy ? "Sync in progress" : "Sync idle"}
        >
          <span className="sync-spinner" />
        </div>
        <header className="topbar">
          <div>
            <h1>POS Control Center</h1>
            <p className="muted">Signed in as {user.name}</p>
          </div>
          <div className="topbar-actions">
            <StatusBadge tone={offlineStatus.online ? "success" : "warning"}>
              {offlineStatus.online ? "Online" : "Offline"}
            </StatusBadge>
            <StatusBadge tone={offlineStatus.pending > 0 ? "warning" : "neutral"}>
              Queue {offlineStatus.pending}
            </StatusBadge>
            <div className="topbar-actions-main">
              <button onClick={() => void runSync()} disabled={syncBusy || !offlineStatus.online}>
                Sync Now
              </button>
              <button onClick={() => void refreshDashboard()} disabled={productsBusy || ordersBusy}>
                Refresh Data
              </button>
              <button onClick={() => setDeviceSimMode((current) => !current)} className="btn-secondary">
                {deviceSimMode ? "Device Sim: On" : "Device Sim: Off"}
              </button>
              <button onClick={() => setNotificationSoundEnabled((current) => !current)} className="btn-secondary">
                {notificationSoundEnabled ? "Sound: On" : "Sound: Off"}
              </button>
              <button onClick={() => void printLastReceipt()} className="btn-secondary">
                ပြေစာထုတ်ရန်
              </button>
            </div>
            <div className="topbar-actions-danger">
              <button onClick={() => void handleLogout()} className="btn-danger">
                Logout
              </button>
            </div>
          </div>
        </header>
        <div className="toast-stack">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast-item ${toast.tone === "error" ? "error" : "notice"}`}
              onMouseEnter={() => pauseToast(toast.id)}
              onMouseLeave={() => resumeToast(toast.id, toast.remainingMs)}
            >
              <p>{toast.message}</p>
              <button
                type="button"
                className="toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
              >
                x
              </button>
            </div>
          ))}
        </div>

        <section className="grid">
          <article className="card panel-products">
            <div className="row between section-head">
              <h2>Products</h2>
              <StatusBadge tone="neutral">{products.length} Items</StatusBadge>
            </div>

            <div className="row row-search">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search by product or SKU"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void runProductSearch();
                  }
                }}
              />
              <button onClick={() => void runProductSearch()} disabled={productsBusy}>
                {productsBusy ? "Loading..." : "Search"}
              </button>
            </div>
            <div className="row between">
              <p className="tiny muted">Auto search runs while typing.</p>
            </div>

            <div className="scan-toolbar">
              <button onClick={() => void openCameraScanner()} disabled={cameraBusy || !cameraSupported}>
                {cameraBusy ? "Opening camera..." : "Scan via Camera"}
              </button>
              <p className="tiny muted">Barcode gun scan works globally outside input fields.</p>
            </div>
            {deviceSimMode ? (
              <div className="row row-search">
                <input
                  value={simulatedScanCode}
                  onChange={(event) => setSimulatedScanCode(event.target.value)}
                  placeholder="Simulated barcode/SKU"
                />
                <button onClick={() => void simulateScan()}>Simulate Scan</button>
              </div>
            ) : null}

            {cameraOpen ? (
              <div className="camera-shell">
                <video ref={videoRef} className="camera-view" muted playsInline autoPlay />
                <button className="btn-secondary" onClick={() => stopCameraScanner()}>
                  Stop Scanner
                </button>
              </div>
            ) : null}

            <div className="list">
              {products.length === 0 ? <p className="muted">No products available.</p> : null}
              {products.map((product) => {
                const variant = product.active_variants?.[0];
                const isOutOfStock = !variant || variant.stock_level <= 0;

                return (
                  <button
                    key={product.id}
                    className="list-item product-item"
                    onClick={() => addVariantToCart(product)}
                    disabled={isOutOfStock}
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <p className="tiny muted">{variant?.sku ?? "No active variant"}</p>
                    </div>
                    <StatusBadge tone={isOutOfStock ? "warning" : "success"}>
                      {variant ? `${variant.price.toLocaleString()} MMK` : "Unavailable"}
                    </StatusBadge>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="card panel-checkout">
            <div className="section-head">
              <h2>Checkout</h2>
              <p className="tiny muted">Walk-in checkout: customer details are optional.</p>
            </div>
            <label>
              Customer Phone (optional)
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="09xxxxxxxxx (leave empty for walk-in)"
              />
            </label>
            <label>
              Delivery Address (optional)
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="No. 00, Township, City"
              />
            </label>

            <div className="list cart-list">
              {cart.length === 0 ? <p className="muted">Your cart is empty.</p> : null}
              {cart.map((line) => (
                <div key={line.variantId} className="list-item static cart-item">
                  <div>
                    <strong>{line.productName}</strong>
                    <p className="tiny muted">{line.sku}</p>
                  </div>
                  <div className="row right">
                    <input
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(event) => updateCartQty(line.variantId, Number(event.target.value))}
                    />
                    <strong>{(line.qty * line.price).toLocaleString()} MMK</strong>
                    <button
                      className="btn-ghost"
                      onClick={() => removeCartItem(line.variantId)}
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="row between total-row">
              <strong>Total</strong>
              <strong>{cartTotal.toLocaleString()} MMK</strong>
            </div>

            <button onClick={() => void submitOrder()} disabled={checkoutBusy || cart.length === 0}>
              {checkoutBusy ? "Processing..." : "Create Order"}
            </button>

            <div className="receipt-preview">
              <strong>ပြေစာ နမူနာ</strong>
              {receiptPreviewText ? (
                <pre className="receipt-paper">{receiptPreviewText}</pre>
              ) : (
                <p className="tiny muted">ပြေစာ နမူနာမရှိသေးပါ။ အော်ဒါတင်လိုက်တာနဲ့ ဒီနေရာမှာ ပြပါလိမ့်မယ်။</p>
              )}
            </div>
          </article>

          <article className="card panel-orders">
            <div className="row between section-head">
              <h2>Recent Orders</h2>
              <button onClick={() => void loadOrders()} disabled={ordersBusy} className="btn-secondary">
                {ordersBusy ? "Loading..." : "Reload"}
              </button>
            </div>

            <div className="list">
              {orders.length === 0 ? <p className="muted">No recent orders.</p> : null}
              {orders.map((order) => (
                <div key={order.id} className="list-item static">
                  <div>
                    <strong>#{order.id > 0 ? order.id : `Q${Math.abs(order.id)}`}</strong>
                    <p className="tiny muted">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="right-text">
                    <StatusBadge tone={statusTone(order.status)}>{order.status}</StatusBadge>
                    <p className="tiny">{order.total_amount.toLocaleString()} MMK</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
        </div>
    </main>
  );
}

function parseApiError(error: unknown): string {
  return mapErrorToMessage(error);
}

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" {
  if (["delivered", "confirmed"].includes(status)) return "success";
  if (["pending", "shipped", "pending_sync"].includes(status)) return "warning";
  if (["cancelled", "refunded", "returned"].includes(status)) return "danger";
  return "neutral";
}

function filterProductsByKeyword(products: Product[], rawKeyword: string): Product[] {
  const keyword = rawKeyword.trim().toLowerCase();
  if (!keyword) return products;

  return products.filter((product) => {
    if (product.name.toLowerCase().includes(keyword)) return true;
    if (product.sku?.toLowerCase().includes(keyword)) return true;

    return (product.active_variants ?? []).some((variant) => variant.sku.toLowerCase().includes(keyword));
  });
}
