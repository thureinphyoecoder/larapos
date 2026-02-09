import { httpClient } from "../../core/api/httpClient";
import type { Order, OrderItemInput } from "../../core/types/contracts";

type OrderResponse = {
  data: Order;
  message?: string;
};

export const orderService = {
  createOrder: (payload: {
    phone: string;
    address: string;
    shop_id?: number;
    items: OrderItemInput[];
  }) => httpClient.post<OrderResponse>("/orders", payload),

  listOrders: () => httpClient.get<{ data: Order[]; meta: Record<string, number> }>("/orders?per_page=30"),
};
