const { contextBridge, ipcRenderer } = require("electron");

// Expose an allow-listed bridge to renderer.
contextBridge.exposeInMainWorld("desktopBridge", {
  systemInfo: async () => ipcRenderer.invoke("system:info"),
  offlineStatus: async () => ipcRenderer.invoke("offline:status"),
  offlineCacheProducts: async (products) => ipcRenderer.invoke("offline:cache-products", products),
  offlineGetProducts: async (query) => ipcRenderer.invoke("offline:get-products", query),
  offlineCacheOrders: async (orders) => ipcRenderer.invoke("offline:cache-orders", orders),
  offlineGetOrders: async () => ipcRenderer.invoke("offline:get-orders"),
  offlineQueueOrder: async (payload) => ipcRenderer.invoke("offline:queue-order", payload),
  offlineSyncNow: async (payload) => ipcRenderer.invoke("offline:sync-now", payload),
});
