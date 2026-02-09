const { contextBridge, ipcRenderer } = require("electron");

// Expose an allow-listed bridge to renderer.
contextBridge.exposeInMainWorld("desktopBridge", {
  systemInfo: async () => ipcRenderer.invoke("system:info"),
});
