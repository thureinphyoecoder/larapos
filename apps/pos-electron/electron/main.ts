import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isDev = !app.isPackaged;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
