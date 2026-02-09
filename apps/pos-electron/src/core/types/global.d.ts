export {};

declare global {
  interface Window {
    desktopBridge: {
      systemInfo: () => Promise<{
        appName: string;
        appVersion: string;
        platform: string;
      }>;
    };
  }
}
