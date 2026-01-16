import { db } from '@/lib/indexeddb/schema';
import { SYNC_CONFIG } from './constants';
import type {
  LocalNote,
  LocalFolder,
  LocalTag,
  LocalTodo,
  LocalNoteTag,
} from '@/lib/indexeddb/schema';

/**
 * Check if IndexedDB has been initialized for a user.
 */
export async function isInitialized(userId: string): Promise<boolean> {
  const meta = await db.syncMetadata
    .filter((m) => m.userId === userId)
    .first();

  return meta !== undefined && meta.syncVersion > 0;
}

/**
 * Get device ID or create one.
 */
function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let deviceId = localStorage.getItem(SYNC_CONFIG.DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SYNC_CONFIG.DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Initial data migration from server to IndexedDB.
 * Should be called once when user logs in for the first time on a device.
 */
export async function migrateFromServer(userId: string): Promise<void> {
  const alreadyInitialized = await isInitialized(userId);
  if (alreadyInitialized) {
    console.log('[Migration] Already initialized, skipping');
    return;
  }

  console.log('[Migration] Starting initial data sync...');

  try {
    // Fetch all data from server APIs
    const [notesRes, foldersRes, tagsRes, todosRes] = await Promise.all([
      fetch('/api/notes?limit=1000'),
      fetch('/api/folders'),
      fetch('/api/tags'),
      fetch('/api/todos?limit=1000'),
    ]);

    if (!notesRes.ok || !foldersRes.ok || !tagsRes.ok || !todosRes.ok) {
      throw new Error('Failed to fetch initial data from server');
    }

    const [notesData, foldersData, tagsData, todosData] = await Promise.all([
      notesRes.json(),
      foldersRes.json(),
      tagsRes.json(),
      todosRes.json(),
    ]);

    // Clear existing IndexedDB data for clean start
    await db.transaction(
      'rw',
      [db.notes, db.folders, db.tags, db.todos, db.noteTags, db.syncMetadata],
      async () => {
        await db.notes.clear();
        await db.folders.clear();
        await db.tags.clear();
        await db.todos.clear();
        await db.noteTags.clear();
        // Keep syncMetadata to track migration
      }
    );

    const now = Date.now();

    // Populate folders first (needed for note references)
    for (const folder of foldersData.folders || []) {
      const localFolder: LocalFolder = {
        id: folder.id,
        userId: folder.userId,
        name: folder.name,
        parentId: folder.parentId || undefined,
        color: folder.color || undefined,
        icon: folder.icon || undefined,
        position: folder.position || 0,
        createdAt: new Date(folder.createdAt).getTime(),
        updatedAt: new Date(folder.updatedAt).getTime(),
        deletedAt: folder.deletedAt ? new Date(folder.deletedAt).getTime() : undefined,
        version: folder.version || 1,
        syncStatus: 'synced',
        lastSyncedAt: now,
        localModifiedAt: new Date(folder.updatedAt).getTime(),
      };
      await db.folders.add(localFolder);
    }

    // Populate tags
    for (const tag of tagsData.tags || []) {
      const localTag: LocalTag = {
        id: tag.id,
        userId: tag.userId,
        name: tag.name,
        color: tag.color || undefined,
        createdAt: new Date(tag.createdAt).getTime(),
        updatedAt: tag.updatedAt ? new Date(tag.updatedAt).getTime() : new Date(tag.createdAt).getTime(),
        deletedAt: tag.deletedAt ? new Date(tag.deletedAt).getTime() : undefined,
        version: tag.version || 1,
        syncStatus: 'synced',
        lastSyncedAt: now,
        localModifiedAt: tag.updatedAt ? new Date(tag.updatedAt).getTime() : new Date(tag.createdAt).getTime(),
      };
      await db.tags.add(localTag);
    }

    // Populate notes with their tags
    for (const note of notesData.notes || []) {
      const localNote: LocalNote = {
        id: note.id,
        userId: note.userId,
        folderId: note.folderId || undefined,
        title: note.title,
        content: note.content || '',
        plainText: note.plainText || '',
        coverImage: note.coverImage || undefined,
        isPinned: note.isPinned || false,
        isFavorite: note.isFavorite || false,
        position: note.position || 0,
        createdAt: new Date(note.createdAt).getTime(),
        updatedAt: new Date(note.updatedAt).getTime(),
        deletedAt: note.deletedAt ? new Date(note.deletedAt).getTime() : undefined,
        version: note.version || 1,
        syncStatus: 'synced',
        lastSyncedAt: now,
        localModifiedAt: new Date(note.updatedAt).getTime(),
      };
      await db.notes.add(localNote);

      // Add note-tag relations
      if (note.tags && Array.isArray(note.tags)) {
        for (const tag of note.tags) {
          const noteTag: LocalNoteTag = {
            id: `${note.id}_${tag.id}`,
            noteId: note.id,
            tagId: tag.id,
            createdAt: now,
          };
          await db.noteTags.add(noteTag);
        }
      }
    }

    // Populate todos
    for (const todo of todosData.todos || []) {
      const localTodo: LocalTodo = {
        id: todo.id,
        userId: todo.userId,
        noteId: todo.noteId || undefined,
        parentId: todo.parentId || undefined,
        title: todo.title,
        description: todo.description || undefined,
        isCompleted: todo.isCompleted || false,
        priority: todo.priority || 'medium',
        position: todo.position || 0,
        dueDate: todo.dueDate ? new Date(todo.dueDate).getTime() : undefined,
        reminderAt: todo.reminderAt ? new Date(todo.reminderAt).getTime() : undefined,
        completedAt: todo.completedAt ? new Date(todo.completedAt).getTime() : undefined,
        createdAt: new Date(todo.createdAt).getTime(),
        updatedAt: new Date(todo.updatedAt).getTime(),
        deletedAt: todo.deletedAt ? new Date(todo.deletedAt).getTime() : undefined,
        version: todo.version || 1,
        syncStatus: 'synced',
        lastSyncedAt: now,
        localModifiedAt: new Date(todo.updatedAt).getTime(),
      };
      await db.todos.add(localTodo);
    }

    // Create sync metadata to mark initialization complete
    const deviceId = getDeviceId();
    await db.syncMetadata.add({
      id: `sync_${userId}_${deviceId}`,
      userId,
      deviceId,
      lastSyncAt: now,
      syncVersion: 1,
      pendingChanges: 0,
    });

    console.log('[Migration] Initial data sync complete');
    console.log(
      `[Migration] Synced: ${foldersData.folders?.length || 0} folders, ` +
      `${tagsData.tags?.length || 0} tags, ` +
      `${notesData.notes?.length || 0} notes, ` +
      `${todosData.todos?.length || 0} todos`
    );
  } catch (error) {
    console.error('[Migration] Failed:', error);
    throw error;
  }
}

/**
 * Clear all local data (used on logout).
 */
export async function clearLocalData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.notes, db.folders, db.tags, db.todos, db.noteTags, db.syncQueue, db.syncMetadata],
    async () => {
      await db.notes.clear();
      await db.folders.clear();
      await db.tags.clear();
      await db.todos.clear();
      await db.noteTags.clear();
      await db.syncQueue.clear();
      await db.syncMetadata.clear();
    }
  );
  console.log('[Migration] Local data cleared');
}

/**
 * Get migration status for debugging.
 */
export async function getMigrationStatus(): Promise<{
  isInitialized: boolean;
  notesCount: number;
  foldersCount: number;
  tagsCount: number;
  todosCount: number;
  pendingSync: number;
}> {
  const [notes, folders, tags, todos, syncQueue] = await Promise.all([
    db.notes.count(),
    db.folders.count(),
    db.tags.count(),
    db.todos.count(),
    db.syncQueue.count(),
  ]);

  const meta = await db.syncMetadata.toArray();
  const initialized = meta.length > 0 && meta[0].syncVersion > 0;

  return {
    isInitialized: initialized,
    notesCount: notes,
    foldersCount: folders,
    tagsCount: tags,
    todosCount: todos,
    pendingSync: syncQueue,
  };
}
