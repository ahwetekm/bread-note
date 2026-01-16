// Main sync engine
export { syncEngine, SyncEngine } from './engine';

// Queue processor
export { queueProcessor, QueueProcessor, ConflictError } from './queue-processor';

// Delta sync
export { deltaSyncer, DeltaSyncer } from './delta-sync';

// Conflict resolution
export { resolveConflict, shouldKeepLocal, mergeEntities } from './conflict-resolution';

// Constants
export { SYNC_CONFIG, ENTITY_SYNC_PRIORITY, ENTITY_API_ENDPOINTS, SYNC_API_ENDPOINTS } from './constants';

// Types
export type {
  SyncStatus,
  SyncEntityType,
  SyncOperation,
  SyncQueueItem,
  LocalSyncMetadata,
  LocalNote,
  LocalTodo,
  LocalFolder,
  LocalTag,
  LocalNoteTag,
  DeltaSyncRequest,
  DeltaSyncResponse,
  ConflictResolution,
  SyncableEntity,
  SyncState,
  SyncEventType,
  SyncEvent,
  SyncOptions,
  SyncEventListener,
  ServerNote,
  ServerFolder,
  ServerTag,
  ServerTodo,
} from './types';
