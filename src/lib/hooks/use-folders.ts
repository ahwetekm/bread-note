'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/indexeddb/schema';
import { syncEngine } from '@/lib/sync';
import { nanoid } from 'nanoid';
import type { Folder, Note } from '@/lib/db/schema';
import type { LocalFolder } from '@/lib/indexeddb/schema';

// Types
export interface FolderWithContent extends Folder {
  notes: Pick<Note, 'id' | 'title' | 'plainText' | 'isPinned' | 'isFavorite' | 'updatedAt'>[];
  subfolders: Folder[];
}

export interface FoldersResponse {
  folders: Folder[];
}

export interface CreateFolderData {
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

export interface UpdateFolderData {
  name?: string;
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
  position?: number;
  version?: number;
}

// Query keys
export const folderKeys = {
  all: ['folders'] as const,
  lists: () => [...folderKeys.all, 'list'] as const,
  list: () => [...folderKeys.lists()] as const,
  details: () => [...folderKeys.all, 'detail'] as const,
  detail: (id: string) => [...folderKeys.details(), id] as const,
};

// Fetch folders from API (server fallback)
async function fetchFoldersFromAPI(): Promise<FoldersResponse> {
  const response = await fetch('/api/folders');
  if (!response.ok) {
    throw new Error('Failed to fetch folders from server');
  }
  return response.json();
}

// Fetch folders from IndexedDB (offline-first) with API fallback
async function fetchFoldersFromLocal(): Promise<FoldersResponse> {
  const localFolders = await db.folders
    .filter((folder) => !folder.deletedAt)
    .toArray();

  // If IndexedDB is empty, fall back to API
  if (localFolders.length === 0) {
    try {
      return await fetchFoldersFromAPI();
    } catch {
      // If API also fails, return empty result
      return { folders: [] };
    }
  }

  // Sort by position, then name
  localFolders.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.name.localeCompare(b.name);
  });

  // Convert to Folder format
  const folders = localFolders.map((folder) => ({
    id: folder.id,
    userId: folder.userId,
    name: folder.name,
    parentId: folder.parentId ?? null,
    color: folder.color ?? null,
    icon: folder.icon ?? null,
    position: folder.position,
    version: folder.version,
    createdAt: new Date(folder.createdAt),
    updatedAt: new Date(folder.updatedAt),
    deletedAt: folder.deletedAt ? new Date(folder.deletedAt) : null,
  })) as Folder[];

  return { folders };
}

// Fetch single folder with content from IndexedDB
async function fetchFolderFromLocal(id: string): Promise<FolderWithContent | null> {
  const folder = await db.folders.get(id);
  if (!folder || folder.deletedAt) return null;

  // Get notes in this folder
  const notes = await db.notes
    .filter((note) => note.folderId === id && !note.deletedAt)
    .toArray();

  // Get subfolders
  const subfolders = await db.folders
    .filter((f) => f.parentId === id && !f.deletedAt)
    .toArray();

  return {
    id: folder.id,
    userId: folder.userId,
    name: folder.name,
    parentId: folder.parentId ?? null,
    color: folder.color ?? null,
    icon: folder.icon ?? null,
    position: folder.position,
    version: folder.version,
    createdAt: new Date(folder.createdAt),
    updatedAt: new Date(folder.updatedAt),
    deletedAt: folder.deletedAt ? new Date(folder.deletedAt) : null,
    notes: notes.map((note) => ({
      id: note.id,
      title: note.title,
      plainText: note.plainText,
      isPinned: note.isPinned,
      isFavorite: note.isFavorite,
      updatedAt: new Date(note.updatedAt),
    })),
    subfolders: subfolders.map((sf) => ({
      id: sf.id,
      userId: sf.userId,
      name: sf.name,
      parentId: sf.parentId ?? null,
      color: sf.color ?? null,
      icon: sf.icon ?? null,
      position: sf.position,
      version: sf.version,
      createdAt: new Date(sf.createdAt),
      updatedAt: new Date(sf.updatedAt),
      deletedAt: sf.deletedAt ? new Date(sf.deletedAt) : null,
    })) as Folder[],
  } as FolderWithContent;
}

// Hooks

/**
 * Fetch folders list with offline-first strategy.
 */
export function useFolders() {
  return useQuery({
    queryKey: folderKeys.list(),
    queryFn: fetchFoldersFromLocal,
    staleTime: 1000,
  });
}

/**
 * Fetch single folder with content.
 */
export function useFolder(id: string) {
  return useQuery({
    queryKey: folderKeys.detail(id),
    queryFn: () => fetchFolderFromLocal(id),
    enabled: !!id,
  });
}

/**
 * Create a folder with offline-first strategy.
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFolderData) => {
      const folderId = nanoid();
      const now = Date.now();

      // Calculate position (max existing + 1)
      const existingFolders = await db.folders.toArray();
      const maxPosition = existingFolders.reduce(
        (max, f) => Math.max(max, f.position),
        0
      );

      const localFolder: LocalFolder = {
        id: folderId,
        userId: '',
        name: data.name,
        parentId: data.parentId,
        color: data.color,
        icon: data.icon,
        position: maxPosition + 1,
        createdAt: now,
        updatedAt: now,
        version: 1,
        syncStatus: 'pending',
        localModifiedAt: now,
      };

      await db.folders.add(localFolder);

      await syncEngine.queueOperation('folder', folderId, 'create', {
        name: data.name,
        parentId: data.parentId,
        color: data.color,
        icon: data.icon,
      });

      return localFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
    },
  });
}

/**
 * Update a folder with offline-first strategy.
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFolderData }) => {
      const now = Date.now();
      const existing = await db.folders.get(id);
      if (!existing) throw new Error('Folder not found');

      const updates: Partial<LocalFolder> = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parentId !== undefined && { parentId: data.parentId ?? undefined }),
        ...(data.color !== undefined && { color: data.color ?? undefined }),
        ...(data.icon !== undefined && { icon: data.icon ?? undefined }),
        ...(data.position !== undefined && { position: data.position }),
        updatedAt: now,
        localModifiedAt: now,
        syncStatus: 'pending' as const,
      };

      await db.folders.update(id, updates);

      await syncEngine.queueOperation('folder', id, 'update', {
        ...data,
        version: existing.version,
      });

      return { ...existing, ...updates };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
    },
  });
}

/**
 * Delete a folder with offline-first strategy.
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = Date.now();
      const folder = await db.folders.get(id);
      if (!folder) throw new Error('Folder not found');

      // Move notes in this folder to no folder
      const notesInFolder = await db.notes
        .filter((n) => n.folderId === id)
        .toArray();

      for (const note of notesInFolder) {
        await db.notes.update(note.id, {
          folderId: undefined,
          updatedAt: now,
          localModifiedAt: now,
          syncStatus: 'pending',
        });
      }

      // Move subfolders to parent folder
      const subfolders = await db.folders
        .filter((f) => f.parentId === id)
        .toArray();

      for (const subfolder of subfolders) {
        await db.folders.update(subfolder.id, {
          parentId: folder.parentId,
          updatedAt: now,
          localModifiedAt: now,
          syncStatus: 'pending',
        });
      }

      // Soft delete the folder
      await db.folders.update(id, {
        deletedAt: now,
        updatedAt: now,
        localModifiedAt: now,
        syncStatus: 'pending',
      });

      await syncEngine.queueOperation('folder', id, 'delete', {});
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: folderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
    },
  });
}
