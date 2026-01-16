// Re-export existing types from IndexedDB schema
export type {
  SyncStatus,
  SyncQueueItem,
  LocalSyncMetadata,
  LocalNote,
  LocalTodo,
  LocalFolder,
  LocalTag,
  LocalNoteTag,
} from '@/lib/indexeddb/schema';

// Entity types that can be synced
export type SyncEntityType = 'note' | 'folder' | 'tag' | 'todo' | 'noteTag';

// Sync operation types
export type SyncOperation = 'create' | 'update' | 'delete';

// Delta sync request to server
export interface DeltaSyncRequest {
  sinceTimestamp: number;
  deviceId: string;
  batchSize?: number;
}

// Deleted entity info from server
export interface DeletedEntityInfo {
  id: string;
  deletedAt: number;
}

// Delta sync response from server
export interface DeltaSyncResponse<T> {
  created: T[];
  updated: T[];
  deleted: DeletedEntityInfo[]; // IDs and timestamps of deleted entities
  serverTimestamp: number;
  hasMore: boolean;
}

// Conflict resolution result
export interface ConflictResolution<T> {
  winner: 'local' | 'server';
  resolvedEntity: T;
  localEntity: T;
  serverEntity: T;
}

// Entity with sync metadata (base interface)
export interface SyncableEntity {
  id: string;
  updatedAt: number;
  version: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  lastSyncedAt?: number;
  localModifiedAt: number;
  deletedAt?: number;
}

// Sync state for UI
export interface SyncState {
  status: 'idle' | 'syncing' | 'error' | 'offline';
  lastSyncAt: number | null;
  pendingChanges: number;
  currentOperation?: string;
  error?: string;
}

// Sync event types
export type SyncEventType =
  | 'sync:start'
  | 'sync:complete'
  | 'sync:error'
  | 'sync:conflict'
  | 'sync:progress'
  | 'queue:add'
  | 'queue:process'
  | 'queue:retry';

// Sync event payload
export interface SyncEvent {
  type: SyncEventType;
  entityType?: SyncEntityType;
  entityId?: string;
  data?: unknown;
  error?: string;
  timestamp: number;
}

// Sync options
export interface SyncOptions {
  immediate?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

// Server entity types (from API responses)
export interface ServerNote {
  id: string;
  userId: string;
  folderId?: string | null;
  title: string;
  content: string;
  plainText: string;
  coverImage?: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  position: number;
  version: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  tags?: ServerTag[];
}

export interface ServerFolder {
  id: string;
  userId: string;
  name: string;
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
  position: number;
  version: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface ServerTag {
  id: string;
  userId: string;
  name: string;
  color?: string | null;
  createdAt: number;
}

export interface ServerTodo {
  id: string;
  userId: string;
  noteId?: string | null;
  parentId?: string | null;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  position: number;
  dueDate?: number | null;
  reminderAt?: number | null;
  completedAt?: number | null;
  version: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

// Sync event listener type
export type SyncEventListener = (event: SyncEvent) => void;
