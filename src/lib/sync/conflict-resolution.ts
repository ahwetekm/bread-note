import type { ConflictResolution, SyncableEntity } from './types';

/**
 * Last-Write-Wins (LWW) conflict resolution algorithm.
 * Compares localModifiedAt (client timestamp) with updatedAt (server timestamp).
 * The entity with the more recent timestamp wins.
 * In case of a tie, server wins as a tiebreaker to ensure consistency across devices.
 */
export function resolveConflict<T extends SyncableEntity>(
  localEntity: T,
  serverEntity: T
): ConflictResolution<T> {
  const localTime = localEntity.localModifiedAt;
  const serverTime = serverEntity.updatedAt;

  if (localTime > serverTime) {
    return {
      winner: 'local',
      resolvedEntity: localEntity,
      localEntity,
      serverEntity,
    };
  }

  if (serverTime > localTime) {
    return {
      winner: 'server',
      resolvedEntity: serverEntity,
      localEntity,
      serverEntity,
    };
  }

  // Same timestamp - server wins as tiebreaker
  // This ensures consistency across all devices
  return {
    winner: 'server',
    resolvedEntity: serverEntity,
    localEntity,
    serverEntity,
  };
}

/**
 * Check if local entity should be kept over server version.
 * Quick helper for common use case.
 */
export function shouldKeepLocal<T extends SyncableEntity>(
  localEntity: T,
  serverEntity: T
): boolean {
  return resolveConflict(localEntity, serverEntity).winner === 'local';
}

/**
 * Merge strategy for field-level conflict resolution.
 * Can be used for more sophisticated merging in the future.
 * Currently defaults to winner-takes-all based on timestamp.
 */
export function mergeEntities<T extends Record<string, unknown>>(
  localEntity: T,
  serverEntity: T,
  fieldPriorities: Partial<Record<keyof T, 'local' | 'server'>> = {}
): T {
  const merged = { ...serverEntity };

  for (const [field, priority] of Object.entries(fieldPriorities)) {
    if (priority === 'local') {
      merged[field as keyof T] = localEntity[field as keyof T];
    }
    // 'server' is default - already set from spread
  }

  return merged;
}
