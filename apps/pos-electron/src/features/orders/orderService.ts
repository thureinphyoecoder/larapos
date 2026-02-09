import { HttpError, httpClient } from "../../core/api/httpClient";
import { POS_CONFIG } from "../../core/env/config";
import type { Order, OrderItemInput } from "../../core/types/contracts";

type OrderResponse = {
  data: Order;
  message?: string;
};

export const orderService = {
  createOrder: async (payload: {
    phone: string;
    address: string;
    shop_id?: number;
    items: OrderItemInput[];
  }) => {
    try {
      const response = await httpClient.post<OrderResponse>("/orders", payload);
      await window.desktopBridge.offlineCacheOrders([response.data]);
      return response;
    } catch (error) {
      if (!(error instanceof HttpError) || ![0, 408].includes(error.status)) {
        throw error;
      }

      const queued = await window.desktopBridge.offlineQueueOrder(payload);
      return {
        data: queued,
        message: "Order queued for sync (offline mode).",
      };
    }
  },

  listOrders: async () => {
    try {
      const response = await httpClient.get<{ data: Order[]; meta: Record<string, number> }>("/orders?per_page=30");
      await window.desktopBridge.offlineCacheOrders(response.data);
      const queued = await window.desktopBridge.offlineGetOrders();
      return {
        data: mergeOrders(response.data, queued),
        meta: response.meta,
      };
    } catch (error) {
      if (!(error instanceof HttpError) || ![0, 408].includes(error.status)) {
        throw error;
      }

      const offline = await window.desktopBridge.offlineGetOrders();
      return {
        data: offline,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: offline.length,
          total: offline.length,
        },
      };
    }
  },

  syncQueuedOrders: (token: string | null) =>
    window.desktopBridge.offlineSyncNow({
      apiBaseUrl: POS_CONFIG.apiBaseUrl,
      token,
    }),
};

function mergeOrders(remote: Order[], local: Order[]): Order[] {
  const map = new Map<number, Order>();
  for (const order of remote) {
    map.set(order.id, order);
  }
  for (const order of local) {
    if (!map.has(order.id)) {
      map.set(order.id, order);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
