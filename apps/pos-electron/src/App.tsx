import { FormEvent, useEffect, useMemo, useState } from "react";
import { authService } from "./features/auth/authService";
import { catalogService } from "./features/catalog/catalogService";
import { orderService } from "./features/orders/orderService";
import { sessionStore } from "./state/sessionStore";
import type { Order, Product, User } from "./core/types/contracts";
import { HttpError } from "./core/api/httpClient";
import { StatusBadge } from "./components/StatusBadge";

type CartLine = {
  variantId: number;
  sku: string;
  productName: string;
  qty: number;
  price: number;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [systemInfo, setSystemInfo] = useState<{ appName: string; appVersion: string; platform: string } | null>(null);
  const [error, setError] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);

  const [authBusy, setAuthBusy] = useState(false);
  const [productsBusy, setProductsBusy] = useState(false);
  const [ordersBusy, setOrdersBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    let active = true;

    sessionStore.bootstrap();
    window.desktopBridge?.systemInfo?.().then(setSystemInfo).catch(() => undefined);

    const token = sessionStore.getToken();
    const cachedUser = sessionStore.getUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    if (!token) {
      setIsRestoring(false);
      return;
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

  const cartTotal = useMemo(() => cart.reduce((sum, line) => sum + line.price * line.qty, 0), [cart]);

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
      sessionStore.clearSession();
      setUser(null);
      setProducts([]);
      setOrders([]);
      setCart([]);
      setPhone("");
      setAddress("");
    }
  };

  const addToCart = (product: Product) => {
    const variant = product.active_variants?.[0];
    if (!variant || variant.stock_level <= 0) return;

    setCart((current) => {
      const existing = current.find((line) => line.variantId === variant.id);
      if (existing) {
        return current.map((line) =>
          line.variantId === variant.id ? { ...line, qty: line.qty + 1 } : line,
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
        },
      ];
    });
  };

  const updateCartQty = (variantId: number, qty: number) => {
    if (!Number.isFinite(qty)) return;

    setCart((current) =>
      current
        .map((line) => (line.variantId === variantId ? { ...line, qty: Math.max(1, Math.round(qty)) } : line))
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

    if (phone.trim().length < 7) {
      setError("Valid customer phone is required.");
      return;
    }

    if (address.trim().length < 5) {
      setError("Valid delivery address is required.");
      return;
    }

    try {
      setCheckoutBusy(true);
      setError("");
      await orderService.createOrder({
        phone: phone.trim(),
        address: address.trim(),
        items: cart.map((line) => ({ variant_id: line.variantId, quantity: line.qty })),
      });
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
          <button onClick={() => void refreshDashboard()} disabled={productsBusy || ordersBusy}>
            {productsBusy || ordersBusy ? "Refreshing..." : "Refresh Data"}
          </button>
          <button onClick={() => void handleLogout()} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="grid">
        <article className="card panel-products">
          <div className="row between">
            <h2>Products</h2>
            <StatusBadge tone="neutral">{products.length} Items</StatusBadge>
          </div>

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

          <div className="list">
            {products.length === 0 ? <p className="muted">No products available.</p> : null}
            {products.map((product) => {
              const variant = product.active_variants?.[0];
              const isOutOfStock = !variant || variant.stock_level <= 0;

              return (
                <button
                  key={product.id}
                  className="list-item"
                  onClick={() => addToCart(product)}
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
          <h2>Checkout</h2>
          <label>
            Customer Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="09xxxxxxxxx"
            />
          </label>
          <label>
            Delivery Address
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
                  <strong>#{order.id}</strong>
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
  if (["pending", "shipped"].includes(status)) return "warning";
  if (["cancelled", "refunded", "returned"].includes(status)) return "danger";
  return "neutral";
}
