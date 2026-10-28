/**
 * Service worker kun i produksjon. Sol-alarmen bruker lokal Notification, ikke Web Push.
 */

interface ViteImportMeta extends ImportMeta {
  env?: {
    PROD?: boolean;
  };
}

function isProductionBuild(): boolean {
  return (import.meta as ViteImportMeta).env?.PROD === true;
}

export function registerServiceWorker(): void {
  if (!isProductionBuild()) return;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Appen skal virke uten worker.
    });
  });
}

export async function enableSolAlarmNotifications(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') {
    return 'denied';
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}
