import { contextBridge, ipcRenderer } from "electron";

// Expose an allow-listed bridge to renderer.
contextBridge.exposeInMainWorld("desktopBridge", {
  systemInfo: async () => ipcRenderer.invoke("system:info") as Promise<{
    appName: string;
    appVersion: string;
    platform: string;
  }>,
  offlineStatus: async () =>
    ipcRenderer.invoke("offline:status") as Promise<{ online: boolean; pending: number; lastSyncAt: string | null }>,
  offlineCacheProducts: async (products: unknown[]) => ipcRenderer.invoke("offline:cache-products", products),
  offlineGetProducts: async (query: string) => ipcRenderer.invoke("offline:get-products", query) as Promise<unknown[]>,
  offlineCacheOrders: async (orders: unknown[]) => ipcRenderer.invoke("offline:cache-orders", orders),
  offlineGetOrders: async () => ipcRenderer.invoke("offline:get-orders") as Promise<unknown[]>,
  offlineQueueOrder: async (payload: unknown) => ipcRenderer.invoke("offline:queue-order", payload),
  offlineSyncNow: async (payload: { apiBaseUrl: string; token: string | null }) =>
    ipcRenderer.invoke("offline:sync-now", payload) as Promise<{
      synced: number;
      failed: number;
      pending: number;
      lastSyncAt: string | null;
    }>,
  receiptPrint: async (payload: { text: string; silent?: boolean; simulate?: boolean }) =>
    ipcRenderer.invoke("receipt:print", payload) as Promise<{ ok: boolean; message?: string }>,
});
