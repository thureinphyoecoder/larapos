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
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("admin@larapos.com");
  const [password, setPassword] = useState("password");

  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [phone, setPhone] = useState("09123456789");
  const [address, setAddress] = useState("Yangon, Sample POS Address");

  useEffect(() => {
    sessionStore.bootstrap();
    window.desktopBridge?.systemInfo?.().then(setSystemInfo).catch(() => undefined);

    const token = sessionStore.getToken();
    if (!token) return;

    authService
      .me()
      .then((profile) => {
        sessionStore.setUser(profile);
        setUser(profile);
      })
      .catch(() => {
        sessionStore.clearSession();
      });
  }, []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.qty, 0),
    [cart],
  );

  const loadProducts = async () => {
    try {
      setBusy(true);
      const response = await catalogService.listProducts(keyword);
      setProducts(response.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await orderService.listOrders();
      setOrders(response.data);
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      setBusy(true);
      const response = await authService.login(email, password);
      sessionStore.setSession(response.token, response.user);
      setUser(response.user);
      await Promise.all([loadProducts(), loadOrders()]);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setBusy(false);
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
    }
  };

  const addToCart = (product: Product) => {
    const variant = product.active_variants?.[0];
    if (!variant) return;

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
    setCart((current) =>
      current
        .map((line) => (line.variantId === variantId ? { ...line, qty: Math.max(1, qty) } : line))
        .filter((line) => line.qty > 0),
    );
  };

  const submitOrder = async () => {
    if (!cart.length) {
      setError("Cart is empty.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      await orderService.createOrder({
        phone,
        address,
        items: cart.map((line) => ({ variant_id: line.variantId, quantity: line.qty })),
      });
      setCart([]);
      await loadOrders();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <main className="screen screen-center">
        <section className="card auth-card">
          <h1>LaraPOS Desktop</h1>
          <p className="muted">Enterprise POS client with secured API session.</p>
          {systemInfo ? (
            <p className="tiny muted">
              {systemInfo.appName} v{systemInfo.appVersion} ({systemInfo.platform})
            </p>
          ) : null}
          <form onSubmit={handleLogin} className="stack">
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>
            <label>
              Password
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
          {error ? <p className="error">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="screen">
      <header className="topbar">
        <div>
          <h1>Enterprise POS</h1>
          <p className="muted">Signed in as {user.name}</p>
        </div>
        <div className="topbar-actions">
          <button onClick={() => void loadProducts()} disabled={busy}>Refresh Products</button>
          <button onClick={() => void loadOrders()} disabled={busy}>Refresh Orders</button>
          <button onClick={() => void handleLogout()}>Logout</button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="grid">
        <article className="card">
          <h2>Products</h2>
          <div className="row">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search product or SKU"
            />
            <button onClick={() => void loadProducts()} disabled={busy}>Search</button>
          </div>

          <div className="list">
            {products.map((product) => {
              const variant = product.active_variants?.[0];
              return (
                <button key={product.id} className="list-item" onClick={() => addToCart(product)}>
                  <div>
                    <strong>{product.name}</strong>
                    <p className="tiny muted">{variant?.sku ?? "No active variant"}</p>
                  </div>
                  <StatusBadge tone={variant && variant.stock_level > 0 ? "success" : "warning"}>
                    {variant ? `${variant.price.toLocaleString()} MMK` : "Unavailable"}
                  </StatusBadge>
                </button>
              );
            })}
          </div>
        </article>

        <article className="card">
          <h2>Checkout</h2>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Address
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>

          <div className="list">
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
                    onChange={(e) => updateCartQty(line.variantId, Number(e.target.value))}
                  />
                  <strong>{(line.qty * line.price).toLocaleString()} MMK</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="row between">
            <strong>Total</strong>
            <strong>{cartTotal.toLocaleString()} MMK</strong>
          </div>

          <button onClick={() => void submitOrder()} disabled={busy || cart.length === 0}>
            {busy ? "Processing..." : "Create Order"}
          </button>
        </article>

        <article className="card">
          <h2>Recent Orders</h2>
          <div className="list">
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
