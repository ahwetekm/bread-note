'use client';

import { useEffect } from 'react';
import { useServiceWorker, useOnlineStatus } from '@/lib/hooks';
import { SyncProvider } from '@/components/sync/sync-provider';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();
  const isOnline = useOnlineStatus();

  // Show update notification when available
  useEffect(() => {
    if (isUpdateAvailable) {
      // You can use a toast here instead of confirm
      const shouldUpdate = window.confirm(
        'A new version of Bread Note is available. Would you like to update?'
      );
      if (shouldUpdate) {
        updateServiceWorker();
      }
    }
  }, [isUpdateAvailable, updateServiceWorker]);

  // Show offline indicator (optional: you can customize this)
  useEffect(() => {
    if (!isOnline) {
      console.log('[PWA] App is offline');
    }
  }, [isOnline]);

  return (
    <SyncProvider>
      {children}
    </SyncProvider>
  );
}
