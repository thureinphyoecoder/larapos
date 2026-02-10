import { HttpError, httpClient } from "../../core/api/httpClient";
import { POS_CONFIG } from "../../core/env/config";
import type { Order, OrderItemInput } from "../../core/types/contracts";
import { sanitizeOrder, sanitizeOrders } from "../../core/validation/guards";

type OrderResponse = {
  data: Order;
  message?: string;
};

export const orderService = {
  createOrder: async (payload: {
    phone?: string | null;
    address?: string | null;
    shop_id?: number;
    items: OrderItemInput[];
  }) => {
    try {
      const response = await httpClient.post<OrderResponse>("/orders", payload);
      const order = sanitizeOrder(response.data);
      if (!order) {
        throw new Error("Invalid order response.");
      }

      await window.desktopBridge.offlineCacheOrders([order]);
      return {
        ...response,
        data: order,
      };
    } catch (error) {
      if (!(error instanceof HttpError) || ![0, 408].includes(error.status)) {
        throw error;
      }

      const queued = sanitizeOrder(await window.desktopBridge.offlineQueueOrder(payload));
      if (!queued) {
        throw new Error("Invalid queued order response.");
      }
      return {
        data: queued,
        message: "Order queued for sync (offline mode).",
      };
    }
  },

  listOrders: async () => {
    try {
      const response = await httpClient.get<{ data: Order[]; meta: Record<string, number> }>("/orders?per_page=30");
      const remote = sanitizeOrders(response.data);
      await window.desktopBridge.offlineCacheOrders(remote);
      const queued = sanitizeOrders(await window.desktopBridge.offlineGetOrders());
      return {
        data: mergeOrders(remote, queued),
        meta: response.meta,
      };
    } catch (error) {
      if (!(error instanceof HttpError) || ![0, 408].includes(error.status)) {
        throw error;
      }

      const offline = sanitizeOrders(await window.desktopBridge.offlineGetOrders());
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
