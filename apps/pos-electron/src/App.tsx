import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { HttpError } from "./core/api/httpClient";
import { authService } from "./features/auth/authService";
import { catalogService } from "./features/catalog/catalogService";
import { orderService } from "./features/orders/orderService";
import type { Order, Product, User, Variant } from "./core/types/contracts";
import { sessionStore } from "./state/sessionStore";
import { StatusBadge } from "./components/StatusBadge";

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

type DetectorResult = { rawValue?: string };
type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<DetectorResult[]>;
};
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

const DEFAULT_OFFLINE_STATUS: OfflineStatus = {
  online: true,
  pending: 0,
  lastSyncAt: null,
};
const LOW_STOCK_THRESHOLD_KEY = "larapos.pos.low_stock_threshold";
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [systemInfo, setSystemInfo] = useState<{ appName: string; appVersion: string; platform: string } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);

  const [authBusy, setAuthBusy] = useState(false);
  const [productsBusy, setProductsBusy] = useState(false);
  const [ordersBusy, setOrdersBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

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
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(DEFAULT_OFFLINE_STATUS);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    const raw = window.localStorage.getItem(LOW_STOCK_THRESHOLD_KEY);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LOW_STOCK_THRESHOLD;
    return Math.min(100, Math.round(parsed));
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const scanningLockRef = useRef(false);
  const lowStockNotifiedRef = useRef(false);

  const cartTotal = useMemo(() => cart.reduce((sum, line) => sum + line.price * line.qty, 0), [cart]);
  const lowStockItems = useMemo(() => {
    return products
      .flatMap((product) =>
        (product.active_variants ?? [])
          .filter((variant) => Number(variant.stock_level) <= lowStockThreshold)
          .map((variant) => ({
            productName: product.name,
            sku: variant.sku,
            stock: Number(variant.stock_level),
          })),
      )
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8);
  }, [products, lowStockThreshold]);

  const resolveStockForVariant = (variantId: number): number | null => {
    for (const product of products) {
      const variant = product.active_variants?.find((item) => item.id === variantId);
      if (variant) return Number(variant.stock_level);
    }

    const inCart = cart.find((line) => line.variantId === variantId);
    return inCart ? Number(inCart.maxStock) : null;
  };

  useEffect(() => {
    const detectorCtor = getBarcodeDetectorCtor();
    setCameraSupported(Boolean(detectorCtor) && Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  useEffect(() => {
    return () => {
      stopCameraScanner();
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
        await Promise.all([loadProducts("", { silentErrors: true }), loadOrders({ silentErrors: true })]);
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
      void loadOrders({ silentErrors: true });
    }, 15000);

    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    window.localStorage.setItem(LOW_STOCK_THRESHOLD_KEY, String(lowStockThreshold));
  }, [lowStockThreshold]);

  useEffect(() => {
    if (lowStockItems.length === 0) {
      lowStockNotifiedRef.current = false;
      return;
    }

    if (lowStockNotifiedRef.current) {
      return;
    }

    lowStockNotifiedRef.current = true;
    setNotice(`Low stock alert: ${lowStockItems.length} variants are at or below ${lowStockThreshold}.`);
  }, [lowStockItems, lowStockThreshold]);

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
    if (!token) return;

    try {
      setSyncBusy(true);
      setError("");
      const result = await orderService.syncQueuedOrders(token);
      setNotice(`Sync finished: ${result.synced} synced, ${result.pending} pending.`);
      await loadOrders({ silentErrors: true });
      await refreshOfflineStatus();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSyncBusy(false);
    }
  };

  const loadProducts = async (
    searchKeyword = keyword,
    options?: { silentErrors?: boolean },
  ): Promise<void> => {
    try {
      setProductsBusy(true);
      if (!options?.silentErrors) {
        setError("");
      }
      const response = await catalogService.listProducts(searchKeyword);
      setProducts(response.data);
    } catch (err) {
      if (!options?.silentErrors) {
        setError(parseApiError(err));
      }
    } finally {
      setProductsBusy(false);
      await refreshOfflineStatus();
    }
  };

  const loadOrders = async (options?: { silentErrors?: boolean }): Promise<void> => {
    try {
      setOrdersBusy(true);
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
      setOrdersBusy(false);
      await refreshOfflineStatus();
    }
  };

  const refreshDashboard = async (): Promise<void> => {
    await Promise.all([loadProducts(""), loadOrders()]);
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
    }
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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      startCameraLoop();
    } catch (err) {
      setError(parseApiError(err));
      stopCameraScanner();
    } finally {
      setCameraBusy(false);
    }
  };

  const startCameraLoop = () => {
    const detectorCtor = getBarcodeDetectorCtor();
    const video = videoRef.current;
    if (!detectorCtor || !video) return;

    const detector = new detectorCtor({
      formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"],
    });

    const loop = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !cameraOpen) {
        scanTimerRef.current = window.setTimeout(() => {
          void loop();
        }, 400);
        return;
      }

      try {
        const results = await detector.detect(videoRef.current);
        const code = results.find((item) => typeof item.rawValue === "string")?.rawValue?.trim();
        if (code) {
          await handleScannedCode(code);
          stopCameraScanner();
          return;
        }
      } catch {
        // ignore single detect errors and continue polling
      }

      scanTimerRef.current = window.setTimeout(() => {
        void loop();
      }, 400);
    };

    void loop();
  };

  const stopCameraScanner = () => {
    if (scanTimerRef.current) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  };

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
      if (result.data.status === "pending_sync") {
        setNotice("Order queued locally. It will sync automatically when internet is available.");
      } else {
        setNotice("Order created successfully.");
      }
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
          {error ? <p className="error">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="screen app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Operations</p>
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
          <button onClick={() => void runSync()} disabled={syncBusy || !offlineStatus.online}>
            {syncBusy ? "Syncing..." : "Sync Now"}
          </button>
          <button onClick={() => void refreshDashboard()} disabled={productsBusy || ordersBusy}>
            {productsBusy || ordersBusy ? "Refreshing..." : "Refresh Data"}
          </button>
          <button onClick={() => void handleLogout()} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="notice">{notice}</p> : null}

      <section className="grid">
        <article className="card panel-products">
          <div className="row between">
            <h2>Products</h2>
            <StatusBadge tone="neutral">{products.length} Items</StatusBadge>
          </div>
          <div className="row between">
            <p className="tiny muted">Low-stock threshold</p>
            <input
              type="number"
              min={1}
              max={100}
              value={lowStockThreshold}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                setLowStockThreshold(Math.min(100, Math.max(1, Math.round(next))));
              }}
              className="threshold-input"
            />
          </div>
          {lowStockItems.length > 0 ? (
            <p className="notice">
              Low stock: {lowStockItems.length} variants at or below {lowStockThreshold}.
            </p>
          ) : null}

          <div className="row">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search by product or SKU"
            />
            <button onClick={() => void loadProducts()} disabled={productsBusy}>
              {productsBusy ? "Loading..." : "Search"}
            </button>
          </div>

          <div className="scan-toolbar">
            <button onClick={() => void openCameraScanner()} disabled={cameraBusy || !cameraSupported}>
              {cameraBusy ? "Opening camera..." : "Scan via Camera"}
            </button>
            <p className="tiny muted">Barcode gun scan works globally outside input fields.</p>
          </div>

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
                  className="list-item"
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
          {lowStockItems.length > 0 ? (
            <div className="low-stock-list">
              {lowStockItems.map((item) => (
                <p key={`${item.sku}-${item.stock}`} className="tiny muted">
                  {item.productName} ({item.sku}) - stock {item.stock}
                </p>
              ))}
            </div>
          ) : null}
        </article>

        <article className="card panel-checkout">
          <h2>Checkout</h2>
          <p className="tiny muted">Walk-in checkout: customer details are optional.</p>
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
              <div key={line.variantId} className="list-item static">
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
        </article>

        <article className="card panel-orders">
          <div className="row between">
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
    </main>
  );
}

function parseApiError(error: unknown): string {
  if (error instanceof HttpError) {
    return `${error.message} (HTTP ${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" {
  if (["delivered", "confirmed"].includes(status)) return "success";
  if (["pending", "shipped", "pending_sync"].includes(status)) return "warning";
  if (["cancelled", "refunded", "returned"].includes(status)) return "danger";
  return "neutral";
}

function findProductByScanCode(
  products: Product[],
  code: string,
): { product: Product; variant?: Variant } | null {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;

  for (const product of products) {
    if (product.sku?.toLowerCase() === normalized) {
      const firstActive = product.active_variants?.find((item) => item.is_active);
      if (!firstActive) continue;
      return { product, variant: firstActive };
    }

    const variant = product.active_variants?.find((item) => item.sku.toLowerCase() === normalized);
    if (variant) return { product, variant };
  }

  return null;
}

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  const detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return detector ?? null;
}
