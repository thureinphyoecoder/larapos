import type { Order, Product, User, Variant } from "../types/contracts";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseVariant(raw: unknown): Variant | null {
  if (!isObject(raw)) return null;
  const id = toNumber(raw.id);
  const productId = toNumber(raw.product_id);
  const sku = toString(raw.sku);
  const price = toNumber(raw.price);
  const stockLevel = toNumber(raw.stock_level);
  if (id === null || productId === null || !sku || price === null || stockLevel === null) return null;

  return {
    id,
    product_id: productId,
    sku,
    price,
    stock_level: stockLevel,
    is_active: Boolean(raw.is_active),
  };
}

function parseProduct(raw: unknown): Product | null {
  if (!isObject(raw)) return null;
  const id = toNumber(raw.id);
  const name = toString(raw.name);
  const sku = toString(raw.sku);
  const price = toNumber(raw.price);
  const stockLevel = toNumber(raw.stock_level);
  if (id === null || !name || !sku || price === null || stockLevel === null) return null;

  const variants = Array.isArray(raw.active_variants)
    ? raw.active_variants.map(parseVariant).filter((value): value is Variant => Boolean(value))
    : [];

  return {
    id,
    name,
    sku,
    price,
    stock_level: stockLevel,
    description: toNullableString(raw.description),
    active_variants: variants,
  };
}

function parseOrder(raw: unknown): Order | null {
  if (!isObject(raw)) return null;
  const id = toNumber(raw.id);
  const status = toString(raw.status);
  const totalAmount = toNumber(raw.total_amount);
  const createdAt = toString(raw.created_at);
  if (id === null || !status || totalAmount === null || !createdAt) return null;

  return {
    id,
    status,
    total_amount: totalAmount,
    phone: toNullableString(raw.phone),
    address: toNullableString(raw.address),
    created_at: createdAt,
  };
}

function parseUser(raw: unknown): User | null {
  if (!isObject(raw)) return null;
  const id = toNumber(raw.id);
  const name = toString(raw.name);
  const email = toString(raw.email);
  if (id === null || !name || !email) return null;

  const roles = Array.isArray(raw.roles) ? raw.roles.filter((role): role is string => typeof role === "string") : [];
  const rawShopId = raw.shop_id;
  const shopId =
    rawShopId === null
      ? null
      : typeof rawShopId === "number" && Number.isFinite(rawShopId)
        ? rawShopId
        : null;

  return {
    id,
    name,
    email,
    roles,
    shop_id: shopId,
  };
}

export function sanitizeProducts(value: unknown): Product[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseProduct).filter((item): item is Product => Boolean(item));
}

export function sanitizeOrders(value: unknown): Order[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseOrder).filter((item): item is Order => Boolean(item));
}

export function sanitizeUser(value: unknown): User | null {
  return parseUser(value);
}

export function sanitizeOrder(value: unknown): Order | null {
  return parseOrder(value);
}
