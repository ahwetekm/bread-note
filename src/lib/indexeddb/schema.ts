import Dexie, { type EntityTable } from 'dexie';

// ============================================================================
// LOCAL TYPES (Mirror server schema with sync fields)
// ============================================================================

export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface LocalNote {
  id: string;
  userId: string;
  folderId?: string;
  title: string;
  content: string;
  plainText: string;
  coverImage?: string;
  isPinned: boolean;
  isFavorite: boolean;
  position: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  version: number;
  // Sync metadata
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  localModifiedAt: number;
}

export interface LocalTodo {
  id: string;
  userId: string;
  noteId?: string;
  parentId?: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  position: number;
  dueDate?: number;
  reminderAt?: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  version: number;
  // Sync metadata
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  localModifiedAt: number;
}

export interface LocalFolder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  position: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  version: number;
  // Sync metadata
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  localModifiedAt: number;
}

export interface LocalTag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface LocalNoteTag {
  id: string;
  noteId: string;
  tagId: string;
  createdAt: number;
}

export interface LocalNotification {
  id: string;
  userId: string;
  type: 'share' | 'reminder' | 'sync_error' | 'mention' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: number;
}

// ============================================================================
// SYNC QUEUE (Pending operations to sync to server)
// ============================================================================

export interface SyncQueueItem {
  id: string;
  entityType: 'note' | 'todo' | 'folder' | 'tag' | 'noteTag';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

// ============================================================================
// SYNC METADATA (Device-level sync tracking)
// ============================================================================

export interface LocalSyncMetadata {
  id: string;
  userId: string;
  deviceId: string;
  lastSyncAt: number;
  syncVersion: number;
  pendingChanges: number;
}

// ============================================================================
// DEXIE DATABASE CLASS
// ============================================================================

export class BreadNoteDB extends Dexie {
  notes!: EntityTable<LocalNote, 'id'>;
  todos!: EntityTable<LocalTodo, 'id'>;
  folders!: EntityTable<LocalFolder, 'id'>;
  tags!: EntityTable<LocalTag, 'id'>;
  noteTags!: EntityTable<LocalNoteTag, 'id'>;
  notifications!: EntityTable<LocalNotification, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  syncMetadata!: EntityTable<LocalSyncMetadata, 'id'>;

  constructor() {
    super('BreadNoteDB');

    // Version 1 schema
    this.version(1).stores({
      notes: 'id, userId, folderId, isPinned, isFavorite, updatedAt, syncStatus, *plainText',
      todos: 'id, userId, noteId, parentId, isCompleted, priority, syncStatus, dueDate',
      folders: 'id, userId, parentId, syncStatus',
      tags: 'id, userId, name',
      noteTags: 'id, noteId, tagId',
      notifications: 'id, userId, isRead, createdAt, type',
      syncQueue: 'id, entityType, entityId, timestamp',
      syncMetadata: 'id, userId, deviceId',
    });
  }
}

// ============================================================================
// DATABASE INSTANCE (Singleton)
// ============================================================================

let dbInstance: BreadNoteDB | null = null;

export function getDB(): BreadNoteDB {
  if (!dbInstance) {
    dbInstance = new BreadNoteDB();
  }
  return dbInstance;
}

// Default export
export const db = getDB();
