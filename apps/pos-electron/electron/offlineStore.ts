import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type ProductPayload = {
  id: number;
  name: string;
  sku: string;
  active_variants?: Array<{
    id: number;
    product_id: number;
    sku: string;
    price: number;
    stock_level: number;
    is_active: boolean;
  }>;
};

type OrderPayload = {
  phone?: string | null;
  address?: string | null;
  shop_id?: number;
  items: Array<{ variant_id: number; quantity: number }>;
};

type CachedOrder = {
  id: number;
  status: string;
  total_amount: number;
  phone: string | null;
  address: string | null;
  created_at: string;
};

type SyncResult = {
  synced: number;
  failed: number;
  pending: number;
  lastSyncAt: string | null;
};

type OutboxRow = {
  id: number;
  event_type: string;
  payload_json: string;
  retries: number;
};

export class OfflineStore {
  private readonly dbPath: string;

  constructor(userDataPath: string) {
    fs.mkdirSync(userDataPath, { recursive: true });
    this.dbPath = path.join(userDataPath, "pos-offline.db");
    this.migrate();
  }

  cacheProducts(products: ProductPayload[]): void {
    const now = new Date().toISOString();
    const statements: string[] = ["BEGIN TRANSACTION"]; 

    for (const product of products) {
      statements.push(`
        INSERT INTO products_cache (product_id, name, sku, payload_json, updated_at)
        VALUES (${Number(product.id)}, ${this.q(product.name)}, ${this.q(product.sku)}, ${this.q(JSON.stringify(product))}, ${this.q(now)})
        ON CONFLICT(product_id) DO UPDATE SET
          name=excluded.name,
          sku=excluded.sku,
          payload_json=excluded.payload_json,
          updated_at=excluded.updated_at
      `);

      for (const variant of product.active_variants ?? []) {
        statements.push(`
          INSERT INTO variant_cache (variant_id, product_id, sku, price, stock_level, is_active, updated_at)
          VALUES (
            ${Number(variant.id)},
            ${Number(variant.product_id)},
            ${this.q(variant.sku)},
            ${Number(variant.price)},
            ${Number(variant.stock_level)},
            ${variant.is_active ? 1 : 0},
            ${this.q(now)}
          )
          ON CONFLICT(variant_id) DO UPDATE SET
            product_id=excluded.product_id,
            sku=excluded.sku,
            price=excluded.price,
            stock_level=excluded.stock_level,
            is_active=excluded.is_active,
            updated_at=excluded.updated_at
        `);
      }
    }

    statements.push("COMMIT");
    this.run(statements.join(";\n"));
  }

  getProducts(query: string): ProductPayload[] {
    const normalized = query.trim();
    const sql = normalized
      ? `
        SELECT payload_json
        FROM products_cache
        WHERE lower(name) LIKE '%' || lower(${this.q(normalized)}) || '%'
           OR lower(sku) LIKE '%' || lower(${this.q(normalized)}) || '%'
        ORDER BY product_id DESC
        LIMIT 100
      `
      : "SELECT payload_json FROM products_cache ORDER BY product_id DESC LIMIT 100";

    const rows = this.select<Array<{ payload_json: string }>>(sql) ?? [];
    return rows
      .map((row) => {
        try {
          return JSON.parse(row.payload_json) as ProductPayload;
        } catch {
          return null;
        }
      })
      .filter((value): value is ProductPayload => Boolean(value));
  }

  cacheOrders(orders: CachedOrder[]): void {
    const now = new Date().toISOString();
    const statements = ["BEGIN TRANSACTION"];

    for (const order of orders) {
      statements.push(`
        INSERT INTO orders_cache (order_id, payload_json, updated_at)
        VALUES (${Number(order.id)}, ${this.q(JSON.stringify(order))}, ${this.q(now)})
        ON CONFLICT(order_id) DO UPDATE SET
          payload_json=excluded.payload_json,
          updated_at=excluded.updated_at
      `);
    }

    statements.push("COMMIT");
    this.run(statements.join(";\n"));
  }

  getCachedOrders(): CachedOrder[] {
    const rows = this.select<Array<{ payload_json: string }>>(
      "SELECT payload_json FROM orders_cache ORDER BY order_id DESC LIMIT 300",
    ) ?? [];

    return rows
      .map((row) => {
        try {
          return JSON.parse(row.payload_json) as CachedOrder;
        } catch {
          return null;
        }
      })
      .filter((value): value is CachedOrder => Boolean(value));
  }

  queueOrder(payload: OrderPayload): CachedOrder {
    const now = new Date().toISOString();
    const clientRef = this.generateClientRef();
    const total = this.computeTotal(payload);

    const inserted = this.select<Array<{ id: number }>>(`
      INSERT INTO outbox (event_type, payload_json, status, retries, created_at, updated_at)
      VALUES (
        'order.create',
        ${this.q(JSON.stringify({ ...payload, client_ref: clientRef }))},
        'pending',
        0,
        ${this.q(now)},
        ${this.q(now)}
      );
      SELECT last_insert_rowid() AS id;
    `) ?? [{ id: 0 }];

    return {
      id: Number(inserted[0].id) * -1,
      status: "pending_sync",
      total_amount: total,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
      created_at: now,
    };
  }

  getPendingOrders(): CachedOrder[] {
    const rows = this.select<Array<{ id: number; payload_json: string; created_at: string }>>(`
      SELECT id, payload_json, created_at
      FROM outbox
      WHERE status = 'pending' AND event_type = 'order.create'
      ORDER BY id DESC
    `) ?? [];

    return rows.map((row) => {
      const payload = JSON.parse(row.payload_json) as OrderPayload;
      return {
        id: Number(row.id) * -1,
        status: "pending_sync",
        total_amount: this.computeTotal(payload),
        phone: payload.phone ?? null,
        address: payload.address ?? null,
        created_at: row.created_at,
      };
    });
  }

  getStatus(online: boolean): { online: boolean; pending: number; lastSyncAt: string | null } {
    const row = this.select<Array<{ pending: number }>>(
      "SELECT COUNT(*) AS pending FROM outbox WHERE status = 'pending'",
    ) ?? [{ pending: 0 }];

    return {
      online,
      pending: Number(row[0].pending),
      lastSyncAt: this.getSyncState("last_sync_at"),
    };
  }

  async sync(apiBaseUrl: string, token: string | null): Promise<SyncResult> {
    const queue = this.select<OutboxRow[]>(`
      SELECT id, event_type, payload_json, retries
      FROM outbox
      WHERE status = 'pending'
      ORDER BY id ASC
      LIMIT 100
    `) ?? [];

    let synced = 0;
    let failed = 0;

    for (const row of queue) {
      try {
        if (row.event_type !== "order.create") {
          this.markFailed(Number(row.id), "Unsupported outbox event");
          failed += 1;
          continue;
        }

        const payload = JSON.parse(row.payload_json) as OrderPayload & { client_ref?: string };
        const response = await fetch(`${apiBaseUrl}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(payload.client_ref ? { "X-Idempotency-Key": payload.client_ref } : {}),
          },
          body: JSON.stringify({
            phone: payload.phone ?? null,
            address: payload.address ?? null,
            shop_id: payload.shop_id,
            items: payload.items,
          }),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "sync failed");
          this.markFailed(Number(row.id), `HTTP ${response.status}: ${text.slice(0, 240)}`);
          failed += 1;
          continue;
        }

        const data = (await response.json().catch(() => null)) as { data?: CachedOrder } | null;
        if (data?.data) {
          this.cacheOrders([data.data]);
        }

        this.run(`DELETE FROM outbox WHERE id = ${Number(row.id)}`);
        synced += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown sync error";
        this.markFailed(Number(row.id), message);
        failed += 1;
      }
    }

    const pendingRow = this.select<Array<{ pending: number }>>(
      "SELECT COUNT(*) AS pending FROM outbox WHERE status = 'pending'",
    ) ?? [{ pending: 0 }];

    if (synced > 0) {
      this.setSyncState("last_sync_at", new Date().toISOString());
    }

    return {
      synced,
      failed,
      pending: Number(pendingRow[0].pending),
      lastSyncAt: this.getSyncState("last_sync_at"),
    };
  }

  private migrate(): void {
    this.run(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS products_cache (
        product_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS variant_cache (
        variant_id INTEGER PRIMARY KEY,
        product_id INTEGER NOT NULL,
        sku TEXT NOT NULL,
        price REAL NOT NULL,
        stock_level INTEGER NOT NULL,
        is_active INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS orders_cache (
        order_id INTEGER PRIMARY KEY,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        retries INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_outbox_status_created_at ON outbox(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_products_cache_name ON products_cache(name);
    `);
  }

  private markFailed(id: number, error: string): void {
    const now = new Date().toISOString();
    this.run(`
      UPDATE outbox
      SET retries = retries + 1,
          last_error = ${this.q(error)},
          updated_at = ${this.q(now)},
          status = CASE WHEN retries + 1 >= 10 THEN 'dead' ELSE 'pending' END
      WHERE id = ${id}
    `);
  }

  private setSyncState(key: string, value: string): void {
    const now = new Date().toISOString();
    this.run(`
      INSERT INTO sync_state (key, value, updated_at)
      VALUES (${this.q(key)}, ${this.q(value)}, ${this.q(now)})
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
    `);
  }

  private getSyncState(key: string): string | null {
    const row = this.select<Array<{ value: string }>>(
      `SELECT value FROM sync_state WHERE key = ${this.q(key)} LIMIT 1`,
    ) ?? [];

    return row[0]?.value ?? null;
  }

  private computeTotal(payload: OrderPayload): number {
    if (payload.items.length === 0) return 0;

    const variantIds = payload.items.map((item) => Number(item.variant_id));
    const sql = `SELECT variant_id, price FROM variant_cache WHERE variant_id IN (${variantIds.join(",")})`;
    const rows = this.select<Array<{ variant_id: number; price: number }>>(sql) ?? [];
    const prices = new Map(rows.map((row) => [Number(row.variant_id), Number(row.price)]));

    return payload.items.reduce((sum, item) => sum + (prices.get(Number(item.variant_id)) ?? 0) * Number(item.quantity), 0);
  }

  private q(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  }

  private run(sql: string): void {
    execFileSync("sqlite3", [this.dbPath, sql], {
      stdio: "pipe",
      encoding: "utf-8",
    });
  }

  private select<T>(sql: string): T | null {
    const output = execFileSync("sqlite3", ["-json", this.dbPath, sql], {
      stdio: "pipe",
      encoding: "utf-8",
    }).trim();

    if (!output) return null;
    return JSON.parse(output) as T;
  }

  private generateClientRef(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `offline-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
