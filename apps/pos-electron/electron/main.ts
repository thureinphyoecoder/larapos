import { app, BrowserWindow, ipcMain, net } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OfflineStore } from "./offlineStore.js";

const isDev = !app.isPackaged;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let offlineStore: OfflineStore | null = null;

function createWindow(): void {
  const initialWidth = 1480;
  const initialHeight = 920;

  const preloadPath = isDev
    ? path.join(process.cwd(), "electron", "preload.cjs")
    : path.join(__dirname, "preload.cjs");

  const window = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    // Keep POS layout stable by preventing shrink below initial viewport.
    minWidth: initialWidth,
    minHeight: initialHeight,
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

ipcMain.handle("receipt:print", async (_event, payload: { text: string; silent?: boolean; simulate?: boolean }) => {
  const text = (payload?.text ?? "").trim();
  if (!text) {
    return { ok: false, message: "Receipt content is empty." };
  }

  if (payload?.simulate) {
    return { ok: true, message: "Simulated print completed." };
  }

  const printWindow = new BrowserWindow({
    width: 420,
    height: 640,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>LaraPOS Receipt</title>
    <style>
      body {
        margin: 0;
        padding: 14px;
        font-family: "DejaVu Sans Mono", "Noto Sans Mono", monospace;
        font-size: 12px;
        line-height: 1.45;
        color: #111;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    <pre>${escapeHtml(text)}</pre>
  </body>
</html>`;

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    try {
      await printWindow.webContents.getPrintersAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to enumerate printers";
      if (message.toLowerCase().includes("enumerate printers")) {
        return {
          ok: false,
          message: "Failed to enumerate printers. Enable Device Sim mode to test without printer hardware.",
        };
      }
      return { ok: false, message };
    }

    const result = await new Promise<{ ok: boolean; message?: string }>((resolve) => {
      printWindow.webContents.print(
        {
          silent: payload?.silent ?? false,
          printBackground: false,
        },
        (success, failureReason) => {
          if (success) {
            resolve({ ok: true });
            return;
          }

          resolve({
            ok: false,
            message: failureReason || "Print canceled or failed.",
          });
        },
      );
    });

    return result;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to print receipt.",
    };
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
