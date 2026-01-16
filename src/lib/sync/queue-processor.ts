import { db } from '@/lib/indexeddb/schema';
import { SYNC_CONFIG, ENTITY_SYNC_PRIORITY, ENTITY_API_ENDPOINTS } from './constants';
import type { SyncQueueItem, SyncEntityType, SyncOperation } from './types';

// Custom error for version conflicts
export class ConflictError extends Error {
  constructor(
    message: string,
    public serverData: unknown
  ) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Get Dexie table for entity type
function getTable(entityType: SyncEntityType) {
  const tables = {
    note: db.notes,
    folder: db.folders,
    tag: db.tags,
    todo: db.todos,
    noteTag: db.noteTags,
  };
  return tables[entityType];
}

// Get HTTP method for operation
function getMethod(operation: SyncOperation): string {
  switch (operation) {
    case 'create':
      return 'POST';
    case 'update':
      return 'PATCH';
    case 'delete':
      return 'DELETE';
    default:
      return 'POST';
  }
}

// Get API endpoint for entity and operation
function getEndpoint(
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncOperation
): string {
  const basePath = ENTITY_API_ENDPOINTS[entityType];

  if (operation === 'create') {
    return basePath;
  }
  return `${basePath}/${entityId}`;
}

export class QueueProcessor {
  /**
   * Process all queued operations in priority order.
   * Folders first, then tags, notes, noteTags, todos last.
   */
  async processAll(): Promise<{ processed: number; failed: number }> {
    const queueItems = await db.syncQueue.orderBy('timestamp').toArray();

    if (queueItems.length === 0) {
      return { processed: 0, failed: 0 };
    }

    // Sort by entity priority (higher priority first), then by timestamp
    queueItems.sort((a, b) => {
      const priorityA = ENTITY_SYNC_PRIORITY[a.entityType] ?? 0;
      const priorityB = ENTITY_SYNC_PRIORITY[b.entityType] ?? 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      return a.timestamp - b.timestamp;
    });

    let processed = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < queueItems.length; i += SYNC_CONFIG.QUEUE_BATCH_SIZE) {
      const batch = queueItems.slice(i, i + SYNC_CONFIG.QUEUE_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((item) => this.processItem(item))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          processed++;
        } else {
          failed++;
        }
      }
    }

    return { processed, failed };
  }

  /**
   * Process a single queue item.
   * Returns true if successful, false if failed.
   */
  private async processItem(item: SyncQueueItem): Promise<boolean> {
    try {
      await this.executeOperation(item);

      // Success - remove from queue
      await db.syncQueue.delete(item.id);

      // Update local entity sync status
      await this.markEntitySynced(item.entityType, item.entityId);

      return true;
    } catch (error) {
      await this.handleError(item, error);
      return false;
    }
  }

  /**
   * Execute the sync operation against server API.
   */
  private async executeOperation(item: SyncQueueItem): Promise<void> {
    const { entityType, entityId, operation, payload } = item;
    const endpoint = getEndpoint(entityType, entityId, operation);
    const method = getMethod(operation);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      SYNC_CONFIG.API_TIMEOUT
    );

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'DELETE' ? JSON.stringify(payload) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 409) {
          // Version conflict - will be resolved by delta sync
          const serverData = await response.json();
          throw new ConflictError('Version conflict', serverData);
        }

        if (response.status === 404 && operation !== 'create') {
          // Entity doesn't exist on server - might have been deleted
          if (operation === 'update') {
            await this.handleServerNotFound(entityType, entityId);
            return; // Don't retry
          }
        }

        if (response.status === 401) {
          throw new Error('Unauthorized - session expired');
        }

        throw new Error(`API error: ${response.status}`);
      }

      // Update local entity with server response
      if (operation !== 'delete') {
        const serverEntity = await response.json();
        await this.updateLocalWithServer(entityType, entityId, serverEntity);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Handle errors with retry logic and exponential backoff.
   */
  private async handleError(
    item: SyncQueueItem,
    error: unknown
  ): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Check if we should retry
    if (item.retryCount >= SYNC_CONFIG.MAX_RETRIES) {
      // Max retries reached - mark entity as conflict
      await this.markEntityConflict(item.entityType, item.entityId, errorMessage);
      await db.syncQueue.delete(item.id);
      console.error(
        `[Sync] Max retries reached for ${item.entityType}/${item.entityId}: ${errorMessage}`
      );
      return;
    }

    // Update retry count and error
    await db.syncQueue.update(item.id, {
      retryCount: item.retryCount + 1,
      lastError: errorMessage,
    });

    // Calculate backoff delay (for logging purposes)
    const delay = Math.min(
      SYNC_CONFIG.INITIAL_RETRY_DELAY *
        Math.pow(SYNC_CONFIG.BACKOFF_MULTIPLIER, item.retryCount),
      SYNC_CONFIG.MAX_RETRY_DELAY
    );

    console.warn(
      `[Sync] Retry ${item.retryCount + 1}/${SYNC_CONFIG.MAX_RETRIES} ` +
        `for ${item.entityType}/${item.entityId} scheduled (delay: ${delay}ms): ${errorMessage}`
    );
  }

  /**
   * Mark entity as synced in IndexedDB.
   */
  private async markEntitySynced(
    entityType: SyncEntityType,
    entityId: string
  ): Promise<void> {
    const table = getTable(entityType);
    if (!table) return;

    const entity = await table.get(entityId);
    if (entity) {
      await table.update(entityId, {
        syncStatus: 'synced',
        lastSyncedAt: Date.now(),
      });
    }
  }

  /**
   * Mark entity as having a conflict.
   */
  private async markEntityConflict(
    entityType: SyncEntityType,
    entityId: string,
    error: string
  ): Promise<void> {
    const table = getTable(entityType);
    if (!table) return;

    const entity = await table.get(entityId);
    if (entity) {
      await table.update(entityId, {
        syncStatus: 'conflict',
      });
    }

    console.error(
      `[Sync] Entity ${entityType}/${entityId} marked as conflict: ${error}`
    );
  }

  /**
   * Update local entity with server response data.
   */
  private async updateLocalWithServer(
    entityType: SyncEntityType,
    entityId: string,
    serverEntity: Record<string, unknown>
  ): Promise<void> {
    const table = getTable(entityType);
    if (!table) return;

    await table.update(entityId, {
      ...serverEntity,
      syncStatus: 'synced',
      lastSyncedAt: Date.now(),
      localModifiedAt: serverEntity.updatedAt as number,
      version: serverEntity.version as number,
    });
  }

  /**
   * Handle case where server returns 404 (entity doesn't exist).
   */
  private async handleServerNotFound(
    entityType: SyncEntityType,
    entityId: string
  ): Promise<void> {
    const table = getTable(entityType);
    if (!table) return;

    // Mark as deleted locally since it doesn't exist on server
    await table.update(entityId, {
      deletedAt: Date.now(),
      syncStatus: 'synced',
    });

    console.warn(
      `[Sync] Entity ${entityType}/${entityId} not found on server, marked as deleted locally`
    );
  }

  /**
   * Get count of pending items in queue.
   */
  async getPendingCount(): Promise<number> {
    return await db.syncQueue.count();
  }

  /**
   * Clear all items from the queue.
   */
  async clearQueue(): Promise<void> {
    await db.syncQueue.clear();
  }

  /**
   * Get items that have exceeded max retries.
   */
  async getFailedItems(): Promise<SyncQueueItem[]> {
    const items = await db.syncQueue.toArray();
    return items.filter((item) => item.retryCount >= SYNC_CONFIG.MAX_RETRIES);
  }
}

// Export singleton instance
export const queueProcessor = new QueueProcessor();
