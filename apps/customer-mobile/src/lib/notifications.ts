// Customer app fallback mode:
// System notifications are disabled to avoid expo-notifications compatibility issues.
// In-app notification center and banners remain active via app state.

export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function showLocalNotification(_title: string, _body: string): Promise<void> {
  // no-op
}
