import { db } from '@/lib/indexeddb/schema';
import { SYNC_CONFIG, SYNC_API_ENDPOINTS } from './constants';
import type {
  SyncEntityType,
  DeltaSyncResponse,
  DeletedEntityInfo,
  LocalNote,
  LocalFolder,
  LocalTag,
  LocalTodo,
  LocalNoteTag,
  ServerNote,
  ServerFolder,
  ServerTag,
  ServerTodo,
} from './types';

type EntityTable = 'notes' | 'folders' | 'tags' | 'todos' | 'noteTags';

const ENTITY_TABLE_MAP: Record<SyncEntityType, EntityTable> = {
  note: 'notes',
  folder: 'folders',
  tag: 'tags',
  todo: 'todos',
  noteTag: 'noteTags',
};

type ServerEntity = ServerNote | ServerFolder | ServerTag | ServerTodo;
type LocalEntity = LocalNote | LocalFolder | LocalTag | LocalTodo | LocalNoteTag;

export class DeltaSyncer {
  /**
   * Get last sync timestamp for entity type.
   */
  private async getLastSyncTimestamp(deviceId: string): Promise<number> {
    const meta = await db.syncMetadata
      .where('deviceId')
      .equals(deviceId)
      .first();

    return meta?.lastSyncAt ?? 0;
  }

  /**
   * Fetch delta from server for a specific entity type.
   */
  private async fetchDelta<T>(
    entityType: SyncEntityType,
    sinceTimestamp: number,
    deviceId: string
  ): Promise<DeltaSyncResponse<T>> {
    const endpoint = SYNC_API_ENDPOINTS[entityType];

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      SYNC_CONFIG.API_TIMEOUT
    );

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sinceTimestamp,
          deviceId,
          batchSize: SYNC_CONFIG.DELTA_SYNC_BATCH_SIZE,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - session expired');
        }
        throw new Error(`Delta sync failed for ${entityType}: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Sync a single entity type from server.
   * Returns the number of changes processed.
   */
  async syncEntity(
    entityType: SyncEntityType,
    deviceId: string
  ): Promise<number> {
    const sinceTimestamp = await this.getLastSyncTimestamp(deviceId);
    const tableName = ENTITY_TABLE_MAP[entityType];

    let totalChanges = 0;
    let hasMore = true;
    let currentTimestamp = sinceTimestamp;

    while (hasMore) {
      const delta = await this.fetchDelta<ServerEntity>(
        entityType,
        currentTimestamp,
        deviceId
      );

      // Process created entities
      for (const entity of delta.created) {
        await this.handleCreated(tableName, entityType, entity);
        totalChanges++;
      }

      // Process updated entities
      for (const entity of delta.updated) {
        await this.handleUpdated(tableName, entityType, entity);
        totalChanges++;
      }

      // Process deleted entities
      for (const deletedInfo of delta.deleted) {
        await this.handleDeleted(tableName, deletedInfo);
        totalChanges++;
      }

      hasMore = delta.hasMore;
      currentTimestamp = delta.serverTimestamp;
    }

    return totalChanges;
  }

  /**
   * Handle new entity from server.
   */
  private async handleCreated(
    tableName: EntityTable,
    entityType: SyncEntityType,
    serverEntity: ServerEntity
  ): Promise<void> {
    const table = db[tableName];
    const existing = await table.get(serverEntity.id);

    if (!existing) {
      // New entity - add it
      const localEntity = this.serverToLocal(entityType, serverEntity);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await table.add(localEntity as any);
    } else {
      // Entity exists locally - treat as update (shouldn't happen for 'created')
      await this.handleUpdated(tableName, entityType, serverEntity);
    }
  }

  /**
   * Handle updated entity from server.
   * Applies LWW conflict resolution if local has pending changes.
   */
  private async handleUpdated(
    tableName: EntityTable,
    entityType: SyncEntityType,
    serverEntity: ServerEntity
  ): Promise<void> {
    const table = db[tableName];
    const localEntity = (await table.get(serverEntity.id)) as LocalEntity | undefined;

    if (!localEntity) {
      // Entity doesn't exist locally - add it
      const newLocalEntity = this.serverToLocal(entityType, serverEntity);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await table.add(newLocalEntity as any);
      return;
    }

    // Check if local has pending changes
    if ('syncStatus' in localEntity && localEntity.syncStatus === 'pending') {
      // Conflict! Apply LWW resolution
      // Compare localModifiedAt (client) vs updatedAt (server)
      const localTime = 'localModifiedAt' in localEntity ? (localEntity.localModifiedAt as number) : 0;
      const serverTime = 'updatedAt' in serverEntity ? serverEntity.updatedAt : 0;

      // Server wins on tie (>=) to ensure consistency across devices
      const serverWins = serverTime >= localTime;

      if (serverWins) {
        // Server wins - overwrite local
        const updatedLocal = this.serverToLocal(entityType, serverEntity);
        await table.update(serverEntity.id, updatedLocal);
      } else {
        // Local wins - keep local but update version from server for next sync
        await table.update(serverEntity.id, {
          version: 'version' in serverEntity ? serverEntity.version : 1,
          syncStatus: 'pending', // Re-queue for sync
        });
      }
    } else {
      // No conflict - update with server data
      const updatedLocal = this.serverToLocal(entityType, serverEntity);
      await table.update(serverEntity.id, updatedLocal);
    }
  }

  /**
   * Handle deleted entity from server.
   * Uses actual deletedAt timestamp from server for accurate LWW resolution.
   */
  private async handleDeleted(
    tableName: EntityTable,
    deletedInfo: DeletedEntityInfo
  ): Promise<void> {
    const { id: entityId, deletedAt: serverDeleteTime } = deletedInfo;
    const table = db[tableName];
    const localEntity = await table.get(entityId);

    if (!localEntity) {
      // Already deleted locally - nothing to do
      return;
    }

    // Check if local has pending changes
    if ('syncStatus' in localEntity && localEntity.syncStatus === 'pending') {
      // Local has unsaved changes but server deleted
      // For LWW, check if local changes are newer than server delete time
      if ('localModifiedAt' in localEntity) {
        if (localEntity.localModifiedAt > serverDeleteTime) {
          // Local changes are newer - keep local and let it sync back to server
          return;
        }
      }
    }

    // Delete locally (soft delete for entities that support it)
    if ('deletedAt' in localEntity) {
      await table.update(entityId, {
        deletedAt: serverDeleteTime,
        syncStatus: 'synced',
        lastSyncedAt: Date.now(),
      });
    } else {
      // Hard delete for entities without soft delete
      await table.delete(entityId);
    }
  }

  /**
   * Convert server entity to local entity format.
   * Handles null -> undefined conversion for optional fields.
   */
  private serverToLocal(
    entityType: SyncEntityType,
    serverEntity: ServerEntity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    const now = Date.now();

    // Convert null values to undefined for IndexedDB compatibility
    const sanitized = Object.fromEntries(
      Object.entries(serverEntity).map(([key, value]) => [
        key,
        value === null ? undefined : value,
      ])
    );

    const base = {
      ...sanitized,
      syncStatus: 'synced' as const,
      lastSyncedAt: now,
    };

    // Add localModifiedAt for entities that track it
    if ('updatedAt' in serverEntity && serverEntity.updatedAt !== null) {
      return {
        ...base,
        localModifiedAt: serverEntity.updatedAt,
      };
    }

    // For all entities, use createdAt as fallback
    if ('createdAt' in serverEntity && serverEntity.createdAt !== null) {
      return {
        ...base,
        localModifiedAt: serverEntity.createdAt,
      };
    }

    return base;
  }

  /**
   * Sync all entity types from server.
   * Returns total number of changes processed.
   */
  async syncAll(deviceId: string): Promise<number> {
    let totalChanges = 0;

    // Sync in priority order: folders → tags → notes → noteTags → todos
    const entityTypes: SyncEntityType[] = ['folder', 'tag', 'note', 'noteTag', 'todo'];

    for (const entityType of entityTypes) {
      try {
        const changes = await this.syncEntity(entityType, deviceId);
        totalChanges += changes;
      } catch (error) {
        console.error(`[DeltaSync] Failed to sync ${entityType}:`, error);
        // Continue with other entity types even if one fails
      }
    }

    return totalChanges;
  }
}

// Export singleton instance
export const deltaSyncer = new DeltaSyncer();
