import { db } from '@/lib/indexeddb/schema';
import { SYNC_CONFIG } from './constants';
import { deltaSyncer } from './delta-sync';
import { queueProcessor } from './queue-processor';
import type {
  SyncState,
  SyncEvent,
  SyncEntityType,
  SyncOperation,
  SyncOptions,
  SyncEventListener,
  SyncQueueItem,
} from './types';

class SyncEngine {
  private static instance: SyncEngine | null = null;

  private state: SyncState = {
    status: 'idle',
    lastSyncAt: null,
    pendingChanges: 0,
  };

  private listeners: Set<SyncEventListener> = new Set();
  private periodicSyncTimer: ReturnType<typeof setInterval> | null = null;
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isOnline: boolean = true;
  private deviceId: string = '';
  private initialized: boolean = false;

  private constructor() {
    // Will be initialized when init() is called
  }

  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  /**
   * Initialize the sync engine.
   * Must be called after the app loads (client-side only).
   */
  async init(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    this.initializeDeviceId();
    this.setupEventListeners();
    await this.refreshPendingCount();
    this.initialized = true;

    console.log('[SyncEngine] Initialized with deviceId:', this.deviceId);
  }

  /**
   * Initialize or retrieve unique device ID.
   */
  private initializeDeviceId(): void {
    let deviceId = localStorage.getItem(SYNC_CONFIG.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(SYNC_CONFIG.DEVICE_ID_KEY, deviceId);
    }
    this.deviceId = deviceId;
  }

  /**
   * Setup browser event listeners for online/offline and visibility.
   */
  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Tab visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        this.triggerSync({ immediate: false });
      }
    });

    // Initialize online state
    this.isOnline = navigator.onLine;

    // Start periodic sync if online
    if (this.isOnline) {
      this.startPeriodicSync();
    }
  }

  /**
   * Handle coming online - process queue and pull from server.
   */
  private async handleOnline(): Promise<void> {
    console.log('[SyncEngine] Coming online');
    this.isOnline = true;
    this.updateState({ status: 'idle' });

    // Trigger full sync
    await this.triggerSync();

    // Start periodic sync
    this.startPeriodicSync();
  }

  /**
   * Handle going offline - stop periodic sync.
   */
  private handleOffline(): void {
    console.log('[SyncEngine] Going offline');
    this.isOnline = false;
    this.stopPeriodicSync();
    this.updateState({ status: 'offline' });
  }

  /**
   * Start periodic sync timer.
   */
  private startPeriodicSync(): void {
    if (this.periodicSyncTimer) return;

    this.periodicSyncTimer = setInterval(
      () => this.triggerSync(),
      SYNC_CONFIG.PERIODIC_SYNC_INTERVAL
    );
  }

  /**
   * Stop periodic sync timer.
   */
  private stopPeriodicSync(): void {
    if (this.periodicSyncTimer) {
      clearInterval(this.periodicSyncTimer);
      this.periodicSyncTimer = null;
    }
  }

  /**
   * Main sync trigger - push local changes, then pull from server.
   */
  async triggerSync(options: SyncOptions = {}): Promise<void> {
    if (!this.isOnline || this.state.status === 'syncing') {
      return;
    }

    this.updateState({ status: 'syncing', currentOperation: 'Starting sync...' });
    this.emit({ type: 'sync:start', timestamp: Date.now() });

    try {
      // Step 1: Push local changes to server (process queue)
      this.updateState({ currentOperation: 'Pushing changes...' });
      const queueResult = await queueProcessor.processAll();
      console.log(
        `[SyncEngine] Queue processed: ${queueResult.processed} success, ${queueResult.failed} failed`
      );

      // Step 2: Pull server changes (delta sync)
      this.updateState({ currentOperation: 'Pulling changes...' });
      const deltaChanges = await deltaSyncer.syncAll(this.deviceId);
      console.log(`[SyncEngine] Delta sync: ${deltaChanges} changes`);

      // Step 3: Update sync metadata
      const now = Date.now();
      await this.updateSyncMetadata(now);

      this.updateState({
        status: 'idle',
        lastSyncAt: now,
        pendingChanges: await this.getPendingCount(),
        currentOperation: undefined,
        error: undefined,
      });

      this.emit({ type: 'sync:complete', timestamp: now });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sync failed';
      console.error('[SyncEngine] Sync error:', errorMessage);

      this.updateState({
        status: 'error',
        error: errorMessage,
        currentOperation: undefined,
      });
      this.emit({
        type: 'sync:error',
        error: errorMessage,
        timestamp: Date.now(),
      });

      // Schedule retry with backoff if requested
      if (options.retryOnError !== false) {
        setTimeout(
          () => this.triggerSync({ retryOnError: false }),
          SYNC_CONFIG.INITIAL_RETRY_DELAY
        );
      }
    }
  }

  /**
   * Add an operation to the sync queue.
   * Called by hooks when mutations happen.
   */
  async queueOperation(
    entityType: SyncEntityType,
    entityId: string,
    operation: SyncOperation,
    payload: Record<string, unknown>
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: `${entityType}_${entityId}_${Date.now()}`,
      entityType,
      entityId,
      operation,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await db.syncQueue.add(queueItem);
    await this.refreshPendingCount();

    this.emit({
      type: 'queue:add',
      entityType,
      entityId,
      timestamp: Date.now(),
    });

    // Trigger debounced sync if online
    if (this.isOnline) {
      this.debouncedSync();
    }
  }

  /**
   * Debounced sync trigger to batch rapid mutations.
   */
  private debouncedSync(): void {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    this.syncDebounceTimer = setTimeout(
      () => this.triggerSync(),
      SYNC_CONFIG.DEBOUNCE_DELAY
    );
  }

  /**
   * Get count of pending changes in queue.
   */
  private async getPendingCount(): Promise<number> {
    return await queueProcessor.getPendingCount();
  }

  /**
   * Refresh pending count in state.
   */
  private async refreshPendingCount(): Promise<void> {
    const count = await this.getPendingCount();
    this.updateState({ pendingChanges: count });
  }

  /**
   * Update sync metadata in IndexedDB.
   */
  private async updateSyncMetadata(timestamp: number): Promise<void> {
    const existing = await db.syncMetadata
      .where('deviceId')
      .equals(this.deviceId)
      .first();

    const pendingCount = await this.getPendingCount();

    if (existing) {
      await db.syncMetadata.update(existing.id, {
        lastSyncAt: timestamp,
        pendingChanges: pendingCount,
      });
    } else {
      await db.syncMetadata.add({
        id: `sync_${this.deviceId}`,
        userId: '', // Will be set from session when available
        deviceId: this.deviceId,
        lastSyncAt: timestamp,
        syncVersion: 1,
        pendingChanges: pendingCount,
      });
    }
  }

  /**
   * Update internal state and notify listeners.
   */
  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    // Emit a progress event to update UI
    this.emit({
      type: 'sync:progress',
      data: this.state,
      timestamp: Date.now(),
    });
  }

  /**
   * Emit sync event to all listeners.
   */
  private emit(event: SyncEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[SyncEngine] Listener error:', error);
      }
    });
  }

  /**
   * Subscribe to sync events.
   * Returns unsubscribe function.
   */
  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current sync state.
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Get online status.
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get device ID.
   */
  getDeviceId(): string {
    return this.deviceId;
  }

  /**
   * Force a full sync by resetting last sync timestamp.
   */
  async forceFullSync(): Promise<void> {
    const meta = await db.syncMetadata
      .where('deviceId')
      .equals(this.deviceId)
      .first();

    if (meta) {
      await db.syncMetadata.update(meta.id, { lastSyncAt: 0 });
    }

    await this.triggerSync();
  }

  /**
   * Cleanup on logout - clear all local data and stop sync.
   */
  async cleanup(): Promise<void> {
    this.stopPeriodicSync();

    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }

    // Clear all IndexedDB data
    await db.syncQueue.clear();
    await db.syncMetadata.clear();
    await db.notes.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.todos.clear();
    await db.noteTags.clear();

    this.updateState({
      status: 'idle',
      lastSyncAt: null,
      pendingChanges: 0,
      error: undefined,
    });

    console.log('[SyncEngine] Cleanup complete');
  }

  /**
   * Set user ID in sync metadata.
   */
  async setUserId(userId: string): Promise<void> {
    const meta = await db.syncMetadata
      .where('deviceId')
      .equals(this.deviceId)
      .first();

    if (meta) {
      await db.syncMetadata.update(meta.id, { userId });
    }
  }
}

// Export singleton instance
export const syncEngine = SyncEngine.getInstance();
export { SyncEngine };
