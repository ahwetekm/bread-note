'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncEngine, SyncState, SyncEvent } from '@/lib/sync';

/**
 * Hook for accessing sync state and controls.
 * Provides full access to sync engine state and actions.
 */
export function useSync() {
  const [state, setState] = useState<SyncState>(syncEngine.getState());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Note: syncEngine.init() is called by SyncProvider, no need to call here
    // This prevents double initialization when both provider and hook are used

    // Subscribe to sync events
    const unsubscribe = syncEngine.subscribe((_event: SyncEvent) => {
      setState(syncEngine.getState());
      setIsOnline(syncEngine.getIsOnline());
    });

    // Get initial state
    setState(syncEngine.getState());
    setIsOnline(syncEngine.getIsOnline());

    return unsubscribe;
  }, []);

  const triggerSync = useCallback(async () => {
    await syncEngine.triggerSync();
  }, []);

  const forceFullSync = useCallback(async () => {
    await syncEngine.forceFullSync();
  }, []);

  return {
    ...state,
    isOnline,
    triggerSync,
    forceFullSync,
  };
}

/**
 * Simplified hook for sync status indicator UI.
 * Returns formatted status text, colors, and counts.
 */
export function useSyncStatus() {
  const { status, pendingChanges, lastSyncAt, error, isOnline } = useSync();

  const statusText = (() => {
    if (!isOnline) return 'Offline';
    if (status === 'syncing') return 'Syncing...';
    if (status === 'error') return 'Sync error';
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    return 'Synced';
  })();

  const statusColor = (() => {
    if (!isOnline) return 'yellow' as const;
    if (status === 'error') return 'red' as const;
    if (pendingChanges > 0) return 'blue' as const;
    return 'green' as const;
  })();

  const lastSyncFormatted = lastSyncAt
    ? new Date(lastSyncAt).toLocaleTimeString()
    : null;

  return {
    statusText,
    statusColor,
    pendingChanges,
    lastSyncAt,
    lastSyncFormatted,
    error,
    isOnline,
    isSyncing: status === 'syncing',
    hasError: status === 'error',
    isIdle: status === 'idle',
  };
}

/**
 * Hook for initializing sync on app load.
 * Call this once in your app's root layout or provider.
 */
export function useSyncInit(userId?: string) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await syncEngine.init();
      if (userId) {
        await syncEngine.setUserId(userId);
      }
      setIsInitialized(true);
    };

    init();
  }, [userId]);

  return { isInitialized };
}
