'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/indexeddb/schema';
import { syncEngine } from '@/lib/sync';
import { nanoid } from 'nanoid';
import type { Tag, Note } from '@/lib/db/schema';
import type { LocalTag } from '@/lib/indexeddb/schema';

// Types
export interface TagWithNotes extends Tag {
  notes: Pick<Note, 'id' | 'title' | 'plainText' | 'isPinned' | 'isFavorite' | 'updatedAt'>[];
}

export interface TagWithCount extends Omit<Tag, 'deletedAt'> {
  noteCount: number;
}

export interface TagsResponse {
  tags: TagWithCount[];
}

export interface CreateTagData {
  name: string;
  color?: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string | null;
}

// Query keys
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: () => [...tagKeys.lists()] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagKeys.details(), id] as const,
};

// Fetch tags with note counts from IndexedDB (offline-first)
async function fetchTagsFromLocal(): Promise<TagsResponse> {
  const localTags = await db.tags.toArray();

  // Filter out soft deleted tags
  const activeTags = localTags.filter(tag => !tag.deletedAt);

  // Get all noteTags and notes in batch to avoid N+1 queries
  const allNoteTags = await db.noteTags.toArray();
  const allNotes = await db.notes.toArray();
  const activeNoteIds = new Set(allNotes.filter(n => !n.deletedAt).map(n => n.id));

  // Build a map of tagId -> noteCount
  const tagNoteCountMap = new Map<string, number>();
  for (const rel of allNoteTags) {
    if (activeNoteIds.has(rel.noteId)) {
      tagNoteCountMap.set(rel.tagId, (tagNoteCountMap.get(rel.tagId) || 0) + 1);
    }
  }

  const tagsWithCounts = activeTags.map((tag) => ({
    id: tag.id,
    userId: tag.userId,
    name: tag.name,
    color: tag.color ?? null,
    createdAt: new Date(tag.createdAt),
    updatedAt: new Date(tag.updatedAt),
    version: tag.version,
    noteCount: tagNoteCountMap.get(tag.id) || 0,
  } as TagWithCount));

  // Sort by name
  tagsWithCounts.sort((a, b) => a.name.localeCompare(b.name));

  return { tags: tagsWithCounts };
}

// Fetch single tag with notes from IndexedDB
async function fetchTagFromLocal(id: string): Promise<TagWithNotes | null> {
  const tag = await db.tags.get(id);
  if (!tag || tag.deletedAt) return null;

  // Get notes with this tag
  const noteTagRelations = await db.noteTags
    .where('tagId')
    .equals(id)
    .toArray();

  // Batch fetch all notes
  const noteIds = noteTagRelations.map(rel => rel.noteId);
  const allNotes = await db.notes.where('id').anyOf(noteIds).toArray();

  const notes = allNotes
    .filter(note => !note.deletedAt)
    .map(note => ({
      id: note.id,
      title: note.title,
      plainText: note.plainText,
      isPinned: note.isPinned,
      isFavorite: note.isFavorite,
      updatedAt: new Date(note.updatedAt),
    }));

  // Sort by pinned, then updatedAt
  notes.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return {
    id: tag.id,
    userId: tag.userId,
    name: tag.name,
    color: tag.color ?? null,
    createdAt: new Date(tag.createdAt),
    updatedAt: new Date(tag.updatedAt),
    version: tag.version,
    notes,
  } as TagWithNotes;
}

// Hooks

/**
 * Fetch tags list with note counts (offline-first).
 */
export function useTags() {
  return useQuery({
    queryKey: tagKeys.list(),
    queryFn: fetchTagsFromLocal,
    staleTime: 1000,
  });
}

/**
 * Fetch single tag with notes.
 */
export function useTag(id: string) {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: () => fetchTagFromLocal(id),
    enabled: !!id,
  });
}

/**
 * Create a tag with offline-first strategy.
 */
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTagData) => {
      const tagId = nanoid();
      const now = Date.now();

      // Check for duplicate name (exclude deleted tags)
      const existingTags = await db.tags.toArray();
      const duplicate = existingTags.find(
        (t) => !t.deletedAt && t.name.toLowerCase() === data.name.toLowerCase()
      );
      if (duplicate) {
        throw new Error('Tag with this name already exists');
      }

      const localTag: LocalTag = {
        id: tagId,
        userId: '',
        name: data.name,
        color: data.color,
        createdAt: now,
        updatedAt: now,
        version: 1,
        syncStatus: 'pending',
        localModifiedAt: now,
      };

      await db.tags.add(localTag);

      await syncEngine.queueOperation('tag', tagId, 'create', {
        name: data.name,
        color: data.color,
      });

      return localTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

/**
 * Update a tag with offline-first strategy.
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTagData }) => {
      const existing = await db.tags.get(id);
      if (!existing || existing.deletedAt) throw new Error('Tag not found');

      // Check for duplicate name (excluding self and deleted tags)
      if (data.name !== undefined) {
        const existingTags = await db.tags.toArray();
        const duplicate = existingTags.find(
          (t) =>
            t.id !== id && !t.deletedAt && t.name.toLowerCase() === data.name!.toLowerCase()
        );
        if (duplicate) {
          throw new Error('Tag with this name already exists');
        }
      }

      const now = Date.now();
      const updates: Partial<LocalTag> = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color ?? undefined }),
        updatedAt: now,
        version: existing.version + 1,
        syncStatus: 'pending',
        localModifiedAt: now,
      };

      await db.tags.update(id, updates);

      await syncEngine.queueOperation('tag', id, 'update', data as Record<string, unknown>);

      return { ...existing, ...updates };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

/**
 * Delete a tag with offline-first strategy.
 * Now uses soft delete for sync support.
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const tag = await db.tags.get(id);
      if (!tag || tag.deletedAt) throw new Error('Tag not found');

      const now = Date.now();

      // Soft delete the tag
      await db.tags.update(id, {
        deletedAt: now,
        updatedAt: now,
        version: tag.version + 1,
        syncStatus: 'pending',
        localModifiedAt: now,
      });

      // Delete note-tag relations (hard delete since they're junction records)
      await db.noteTags.where('tagId').equals(id).delete();

      await syncEngine.queueOperation('tag', id, 'delete', {});
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: tagKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}
