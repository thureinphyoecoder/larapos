import { requestJson } from "../lib/http";
import type { ApiListResponse, Order } from "../types/domain";

export const orderService = {
  list(baseUrl: string, token: string): Promise<ApiListResponse<Order>> {
    return requestJson<ApiListResponse<Order>>({
      baseUrl,
      path: "/orders?per_page=50",
      method: "GET",
      token,
    });
  },

  detail(baseUrl: string, token: string, orderId: number): Promise<{ data: Order }> {
    return requestJson<{ data: Order }>({
      baseUrl,
      path: `/orders/${orderId}`,
      method: "GET",
      token,
    });
  },

  updateDeliveryLocation(
    baseUrl: string,
    token: string,
    orderId: number,
    payload: { delivery_lat: number; delivery_lng: number },
  ): Promise<{ data: Order }> {
    return requestJson<{ data: Order }>({
      baseUrl,
      path: `/orders/${orderId}/delivery-location`,
      method: "PATCH",
      token,
      body: payload,
    });
  },

  uploadShipmentProof(baseUrl: string, token: string, orderId: number, formData: FormData): Promise<{ data: Order }> {
    return requestJson<{ data: Order }>({
      baseUrl,
      path: `/orders/${orderId}/shipment-proof`,
      method: "POST",
      token,
      body: formData,
      isFormData: true,
      timeoutMs: 25000,
    });
  },

  markDelivered(baseUrl: string, token: string, orderId: number): Promise<{ data: Order }> {
    return requestJson<{ data: Order }>({
      baseUrl,
      path: `/orders/${orderId}/status`,
      method: "PATCH",
      token,
      body: { status: "delivered" },
    });
  },
};
