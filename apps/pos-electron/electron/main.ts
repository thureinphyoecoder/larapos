import { app, BrowserWindow, ipcMain, net } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OfflineStore } from "./offlineStore.js";

const isDev = !app.isPackaged;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let offlineStore: OfflineStore | null = null;

function createWindow(): void {
  const preloadPath = isDev
    ? path.join(process.cwd(), "electron", "preload.cjs")
    : path.join(__dirname, "preload.cjs");

  const window = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    title: "LaraPOS Enterprise Desktop",
    webPreferences: {
      // Security baseline: isolate renderer from Node runtime.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: preloadPath,
    },
  });

  if (isDev) {
    window.loadURL("http://localhost:5174");
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  window.loadFile(path.join(process.cwd(), "dist-renderer/index.html"));
}

app.whenReady().then(() => {
  offlineStore = new OfflineStore(app.getPath("userData"));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Health endpoint for simple diagnostics from renderer.
ipcMain.handle("system:info", async () => {
  return {
    appName: app.getName(),
    appVersion: app.getVersion(),
    platform: process.platform,
  };
});

ipcMain.handle("offline:status", async () => {
  return offlineStore?.getStatus(net.isOnline()) ?? { online: net.isOnline(), pending: 0, lastSyncAt: null };
});

ipcMain.handle("offline:cache-products", async (_event, products: unknown[]) => {
  offlineStore?.cacheProducts((products ?? []) as Parameters<OfflineStore["cacheProducts"]>[0]);
});

ipcMain.handle("offline:get-products", async (_event, query: string) => {
  return offlineStore?.getProducts(query ?? "") ?? [];
});

ipcMain.handle("offline:cache-orders", async (_event, orders: unknown[]) => {
  offlineStore?.cacheOrders((orders ?? []) as Parameters<OfflineStore["cacheOrders"]>[0]);
});

ipcMain.handle("offline:get-orders", async () => {
  const cached = offlineStore?.getCachedOrders() ?? [];
  const pending = offlineStore?.getPendingOrders() ?? [];
  return [...pending, ...cached];
});

ipcMain.handle("offline:queue-order", async (_event, payload: unknown) => {
  return offlineStore?.queueOrder(payload as Parameters<OfflineStore["queueOrder"]>[0]) ?? null;
});

ipcMain.handle("offline:sync-now", async (_event, payload: { apiBaseUrl: string; token: string | null }) => {
  if (!offlineStore) return { synced: 0, failed: 0, pending: 0, lastSyncAt: null };
  return offlineStore.sync(payload.apiBaseUrl, payload.token);
});
