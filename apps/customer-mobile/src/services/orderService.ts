import { requestJson } from "../lib/http";
import { fallbackOrders } from "../mocks/data";
import type { ApiListResponse, CustomerOrder } from "../types/domain";

export async function fetchOrders(baseUrl: string, token: string): Promise<CustomerOrder[]> {
  try {
    const payload = await requestJson<ApiListResponse<CustomerOrder>>({
      baseUrl,
      path: "/orders",
      method: "GET",
      token,
    });

    return payload.data ?? [];
  } catch {
    return fallbackOrders;
  }
}

export async function placeOrderFromCart(baseUrl: string, token: string): Promise<void> {
  await requestJson({
    baseUrl,
    path: "/orders",
    method: "POST",
    token,
    body: {},
  });
}

export async function fetchOrderDetail(baseUrl: string, token: string, orderId: number): Promise<CustomerOrder> {
  const payload = await requestJson<{ data: CustomerOrder }>({
    baseUrl,
    path: `/orders/${orderId}`,
    method: "GET",
    token,
  });

  return payload.data;
}

export async function cancelOrder(baseUrl: string, token: string, orderId: number, reason: string): Promise<CustomerOrder> {
  const payload = await requestJson<{ data: CustomerOrder }>({
    baseUrl,
    path: `/orders/${orderId}/cancel`,
    method: "POST",
    token,
    body: { cancel_reason: reason },
  });

  return payload.data;
}

export async function requestRefund(baseUrl: string, token: string, orderId: number): Promise<CustomerOrder> {
  const payload = await requestJson<{ data: CustomerOrder }>({
    baseUrl,
    path: `/orders/${orderId}/refund`,
    method: "POST",
    token,
    body: {},
  });

  return payload.data;
}

export async function requestReturn(baseUrl: string, token: string, orderId: number, reason: string): Promise<CustomerOrder> {
  const payload = await requestJson<{ data: CustomerOrder }>({
    baseUrl,
    path: `/orders/${orderId}/return`,
    method: "POST",
    token,
    body: { return_reason: reason },
  });

  return payload.data;
}
