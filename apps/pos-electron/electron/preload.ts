import { contextBridge, ipcRenderer } from "electron";

// Expose an allow-listed bridge to renderer.
contextBridge.exposeInMainWorld("desktopBridge", {
  systemInfo: async () => ipcRenderer.invoke("system:info") as Promise<{
    appName: string;
    appVersion: string;
    platform: string;
  }>,
});
