import type { SyncEntityType } from './types';

export const SYNC_CONFIG = {
  // Sync intervals
  PERIODIC_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  DEBOUNCE_DELAY: 1000, // 1 second debounce for mutations

  // Retry configuration
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000, // 1 second
  MAX_RETRY_DELAY: 30000, // 30 seconds
  BACKOFF_MULTIPLIER: 2,

  // Batch sizes
  DELTA_SYNC_BATCH_SIZE: 100,
  QUEUE_BATCH_SIZE: 10,

  // Timeouts
  API_TIMEOUT: 30000, // 30 seconds

  // Storage keys
  DEVICE_ID_KEY: 'bread-note-device-id',
  LAST_SYNC_KEY: 'bread-note-last-sync',
} as const;

// Entity priority for sync order (higher = sync first)
// Folders first (needed for references), then tags, notes, noteTags, todos last
export const ENTITY_SYNC_PRIORITY: Record<SyncEntityType, number> = {
  folder: 4,
  tag: 3,
  note: 2,
  noteTag: 1,
  todo: 0,
};

// API endpoint mapping for each entity type
export const ENTITY_API_ENDPOINTS: Record<SyncEntityType, string> = {
  note: '/api/notes',
  folder: '/api/folders',
  tag: '/api/tags',
  todo: '/api/todos',
  noteTag: '/api/note-tags',
};

// Sync API endpoint mapping
export const SYNC_API_ENDPOINTS: Record<SyncEntityType, string> = {
  note: '/api/sync/notes',
  folder: '/api/sync/folders',
  tag: '/api/sync/tags',
  todo: '/api/sync/todos',
  noteTag: '/api/sync/note-tags',
};
