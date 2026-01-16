'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { syncEngine, SyncEvent } from '@/lib/sync';
import { migrateFromServer, isInitialized } from '@/lib/sync/migration';

interface SyncContextValue {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

const SyncContext = createContext<SyncContextValue>({
  isReady: false,
  isLoading: true,
  error: null,
});

export function useSyncContext() {
  return useContext(SyncContext);
}

interface SyncProviderProps {
  children: React.ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invalidate all queries after sync completes to refresh UI
  const invalidateAllQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  }, [queryClient]);

  useEffect(() => {
    const initSync = async () => {
      // Wait for session to be determined
      if (status === 'loading') return;

      // If not authenticated, we're done (no sync needed)
      if (status === 'unauthenticated' || !session?.user?.id) {
        setIsLoading(false);
        setIsReady(false);
        return;
      }

      const userId = session.user.id;

      try {
        // Initialize sync engine
        await syncEngine.init();
        await syncEngine.setUserId(userId);

        // Check if we need initial migration
        const initialized = await isInitialized(userId);
        if (!initialized) {
          console.log('[SyncProvider] Running initial migration...');
          await migrateFromServer(userId);
          // Invalidate queries after migration to show fresh data
          invalidateAllQueries();
        }

        // Trigger initial sync to get latest data
        if (navigator.onLine) {
          await syncEngine.triggerSync();
        }

        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error('[SyncProvider] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Sync initialization failed');
        // Still mark as ready so the app can function (server-fallback mode)
        setIsReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    initSync();
  }, [session?.user?.id, status, invalidateAllQueries]);

  // Subscribe to sync events and invalidate queries when sync completes
  useEffect(() => {
    const handleSyncEvent = (event: SyncEvent) => {
      // When sync completes successfully, refresh all queries
      if (event.type === 'sync:complete') {
        console.log('[SyncProvider] Sync complete, refreshing data...');
        invalidateAllQueries();
      }
    };

    const unsubscribe = syncEngine.subscribe(handleSyncEvent);
    return unsubscribe;
  }, [invalidateAllQueries]);

  return (
    <SyncContext.Provider value={{ isReady, isLoading, error }}>
      {children}
    </SyncContext.Provider>
  );
}
