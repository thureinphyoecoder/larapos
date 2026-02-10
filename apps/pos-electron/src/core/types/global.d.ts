export {};
import type { Order, OrderItemInput, Product } from "./contracts";

declare global {
  interface Window {
    desktopBridge: {
      systemInfo: () => Promise<{
        appName: string;
        appVersion: string;
        platform: string;
      }>;
      offlineStatus: () => Promise<{ online: boolean; pending: number; lastSyncAt: string | null }>;
      offlineCacheProducts: (products: Product[]) => Promise<void>;
      offlineGetProducts: (query: string) => Promise<Product[]>;
      offlineCacheOrders: (orders: Order[]) => Promise<void>;
      offlineGetOrders: () => Promise<Order[]>;
      offlineQueueOrder: (payload: {
        phone?: string | null;
        address?: string | null;
        shop_id?: number;
        items: OrderItemInput[];
      }) => Promise<Order>;
      offlineSyncNow: (payload: { apiBaseUrl: string; token: string | null }) => Promise<{
        synced: number;
        failed: number;
        pending: number;
        lastSyncAt: string | null;
      }>;
      receiptPrint: (payload: { text: string; silent?: boolean; simulate?: boolean }) => Promise<{
        ok: boolean;
        message?: string;
      }>;
    };
  }
}
