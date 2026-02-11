import { requestJson } from "../lib/http";
import type { CartItem } from "../types/domain";

type CartResponse = {
  data: CartItem[];
  meta?: {
    total_amount: number;
    items_count: number;
  };
};

export async function fetchCart(baseUrl: string, token: string): Promise<CartItem[]> {
  const payload = await requestJson<CartResponse>({
    baseUrl,
    path: "/cart",
    method: "GET",
    token,
  });

  return payload.data ?? [];
}

export async function addCartItem(baseUrl: string, token: string, variantId: number, quantity = 1): Promise<void> {
  await requestJson({
    baseUrl,
    path: "/cart/items",
    method: "POST",
    token,
    body: {
      variant_id: variantId,
      quantity,
    },
  });
}

export async function clearCart(baseUrl: string, token: string): Promise<void> {
  await requestJson({
    baseUrl,
    path: "/cart/clear",
    method: "DELETE",
    token,
  });
}

export async function removeCartItem(baseUrl: string, token: string, cartItemId: number): Promise<void> {
  await requestJson({
    baseUrl,
    path: `/cart/items/${cartItemId}`,
    method: "DELETE",
    token,
  });
}
