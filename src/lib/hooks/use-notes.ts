'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/indexeddb/schema';
import { syncEngine } from '@/lib/sync';
import { nanoid } from 'nanoid';
import type { Note, Tag } from '@/lib/db/schema';
import type { LocalNote, LocalNoteTag } from '@/lib/indexeddb/schema';

// Types
export interface NoteWithTags extends Note {
  tags: Tag[];
}

export interface NotesResponse {
  notes: NoteWithTags[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NoteFilters {
  page?: number;
  limit?: number;
  folderId?: string;
  favorites?: boolean;
}

export interface CreateNoteData {
  title?: string;
  content?: string;
  plainText?: string;
  folderId?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  tagIds?: string[];
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  plainText?: string;
  folderId?: string | null;
  isPinned?: boolean;
  isFavorite?: boolean;
  tagIds?: string[];
  version?: number;
}

// Query keys
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters?: NoteFilters) => [...noteKeys.lists(), filters] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
};

// Fetch notes from API (server fallback)
async function fetchNotesFromAPI(filters?: NoteFilters): Promise<NotesResponse> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.folderId) params.set('folderId', filters.folderId);
  if (filters?.favorites) params.set('favorites', 'true');

  const response = await fetch(`/api/notes?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch notes from server');
  }
  return response.json();
}

// Fetch notes from IndexedDB (offline-first) with API fallback
async function fetchNotesFromLocal(filters?: NoteFilters): Promise<NotesResponse> {
  // Get all non-deleted notes from IndexedDB
  let localNotes = await db.notes
    .filter((note) => !note.deletedAt)
    .toArray();

  // If IndexedDB is empty, fall back to API
  if (localNotes.length === 0) {
    try {
      return await fetchNotesFromAPI(filters);
    } catch {
      // If API also fails, return empty result
      return {
        notes: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };
    }
  }

  // Apply filters
  if (filters?.folderId) {
    localNotes = localNotes.filter((n) => n.folderId === filters.folderId);
  }
  if (filters?.favorites) {
    localNotes = localNotes.filter((n) => n.isFavorite);
  }

  // Sort: pinned first, then by updatedAt descending
  localNotes.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
    return b.updatedAt - a.updatedAt;
  });

  // Apply pagination
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 50;
  const offset = (page - 1) * limit;
  const paginatedNotes = localNotes.slice(offset, offset + limit);

  // Get tags for each note
  const notesWithTags = await Promise.all(
    paginatedNotes.map(async (note) => {
      const tagRelations = await db.noteTags
        .where('noteId')
        .equals(note.id)
        .toArray();

      const tags = await Promise.all(
        tagRelations.map(async (rel) => {
          const tag = await db.tags.get(rel.tagId);
          return tag;
        })
      );

      // Convert LocalNote to NoteWithTags format
      return {
        id: note.id,
        userId: note.userId,
        folderId: note.folderId ?? null,
        title: note.title,
        content: note.content,
        plainText: note.plainText,
        isPinned: note.isPinned,
        isFavorite: note.isFavorite,
        position: note.position,
        version: note.version,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        deletedAt: note.deletedAt ? new Date(note.deletedAt) : null,
        tags: tags.filter(Boolean).map((tag) => ({
          id: tag!.id,
          userId: tag!.userId,
          name: tag!.name,
          color: tag!.color ?? null,
          createdAt: new Date(tag!.createdAt),
        })),
      } as NoteWithTags;
    })
  );

  return {
    notes: notesWithTags,
    pagination: {
      page,
      limit,
      total: localNotes.length,
      totalPages: Math.ceil(localNotes.length / limit),
    },
  };
}

// Fetch single note from IndexedDB
async function fetchNoteFromLocal(id: string): Promise<NoteWithTags | null> {
  const note = await db.notes.get(id);
  if (!note || note.deletedAt) return null;

  const tagRelations = await db.noteTags.where('noteId').equals(id).toArray();
  const tags = await Promise.all(
    tagRelations.map(async (rel) => {
      const tag = await db.tags.get(rel.tagId);
      return tag;
    })
  );

  return {
    id: note.id,
    userId: note.userId,
    folderId: note.folderId ?? null,
    title: note.title,
    content: note.content,
    plainText: note.plainText,
    isPinned: note.isPinned,
    isFavorite: note.isFavorite,
    position: note.position,
    version: note.version,
    createdAt: new Date(note.createdAt),
    updatedAt: new Date(note.updatedAt),
    deletedAt: note.deletedAt ? new Date(note.deletedAt) : null,
    tags: tags.filter(Boolean).map((tag) => ({
      id: tag!.id,
      userId: tag!.userId,
      name: tag!.name,
      color: tag!.color ?? null,
      createdAt: new Date(tag!.createdAt),
    })),
  } as NoteWithTags;
}

// Hooks

/**
 * Fetch notes list with offline-first strategy.
 * Reads from IndexedDB immediately, sync happens in background.
 */
export function useNotes(filters?: NoteFilters) {
  return useQuery({
    queryKey: noteKeys.list(filters),
    queryFn: () => fetchNotesFromLocal(filters),
    staleTime: 1000, // Consider stale after 1 second for quick updates
  });
}

/**
 * Fetch single note with offline-first strategy.
 */
export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => fetchNoteFromLocal(id),
    enabled: !!id,
  });
}

/**
 * Create a new note with offline-first strategy.
 * Writes to IndexedDB immediately, queues for server sync.
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNoteData) => {
      const noteId = nanoid();
      const now = Date.now();

      // Create local note
      const localNote: LocalNote = {
        id: noteId,
        userId: '', // Will be updated on sync
        title: data.title || 'Untitled',
        content: data.content || '',
        plainText: data.plainText || '',
        folderId: data.folderId,
        isPinned: data.isPinned || false,
        isFavorite: data.isFavorite || false,
        position: 0,
        createdAt: now,
        updatedAt: now,
        version: 1,
        syncStatus: 'pending',
        localModifiedAt: now,
      };

      // Save to IndexedDB immediately
      await db.notes.add(localNote);

      // Add tag relations if provided
      if (data.tagIds && data.tagIds.length > 0) {
        const tagRelations: LocalNoteTag[] = data.tagIds.map((tagId) => ({
          id: `${noteId}_${tagId}`,
          noteId,
          tagId,
          createdAt: now,
        }));
        await db.noteTags.bulkAdd(tagRelations);
      }

      // Queue for server sync
      await syncEngine.queueOperation('note', noteId, 'create', {
        title: localNote.title,
        content: localNote.content,
        plainText: localNote.plainText,
        folderId: localNote.folderId,
        isPinned: localNote.isPinned,
        isFavorite: localNote.isFavorite,
        tagIds: data.tagIds,
      });

      return localNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

/**
 * Update a note with offline-first strategy.
 * Updates IndexedDB immediately, queues for server sync.
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNoteData }) => {
      const now = Date.now();

      // Get existing note
      const existing = await db.notes.get(id);
      if (!existing) throw new Error('Note not found');

      // Prepare updates
      const updates: Partial<LocalNote> = {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.plainText !== undefined && { plainText: data.plainText }),
        ...(data.folderId !== undefined && { folderId: data.folderId ?? undefined }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
        ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
        updatedAt: now,
        localModifiedAt: now,
        syncStatus: 'pending' as const,
      };

      // Update IndexedDB
      await db.notes.update(id, updates);

      // Update tag relations if provided
      if (data.tagIds !== undefined) {
        // Remove existing relations
        await db.noteTags.where('noteId').equals(id).delete();

        // Add new relations
        if (data.tagIds.length > 0) {
          const tagRelations: LocalNoteTag[] = data.tagIds.map((tagId) => ({
            id: `${id}_${tagId}`,
            noteId: id,
            tagId,
            createdAt: now,
          }));
          await db.noteTags.bulkAdd(tagRelations);
        }
      }

      // Queue for server sync
      await syncEngine.queueOperation('note', id, 'update', {
        ...data,
        version: existing.version,
      });

      return { ...existing, ...updates };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

/**
 * Delete a note with offline-first strategy (soft delete).
 * Marks as deleted in IndexedDB, queues for server sync.
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = Date.now();

      // Soft delete in IndexedDB
      await db.notes.update(id, {
        deletedAt: now,
        updatedAt: now,
        localModifiedAt: now,
        syncStatus: 'pending',
      });

      // Queue for server sync
      await syncEngine.queueOperation('note', id, 'delete', {});
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: noteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

/**
 * Toggle note pin status with offline-first strategy.
 */
export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const now = Date.now();
      const existing = await db.notes.get(id);
      if (!existing) throw new Error('Note not found');

      await db.notes.update(id, {
        isPinned,
        updatedAt: now,
        localModifiedAt: now,
        syncStatus: 'pending',
      });

      await syncEngine.queueOperation('note', id, 'update', {
        isPinned,
        version: existing.version,
      });

      return { ...existing, isPinned, updatedAt: now };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

/**
 * Toggle note favorite status with offline-first strategy.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const now = Date.now();
      const existing = await db.notes.get(id);
      if (!existing) throw new Error('Note not found');

      await db.notes.update(id, {
        isFavorite,
        updatedAt: now,
        localModifiedAt: now,
        syncStatus: 'pending',
      });

      await syncEngine.queueOperation('note', id, 'update', {
        isFavorite,
        version: existing.version,
      });

      return { ...existing, isFavorite, updatedAt: now };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}
