'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Folder, Note } from '@/lib/db/schema';

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

// API functions
async function fetchFolders(): Promise<FoldersResponse> {
  const res = await fetch('/api/folders');
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch folders');
  }
  return res.json();
}

async function fetchFolder(id: string): Promise<FolderWithContent> {
  const res = await fetch(`/api/folders/${id}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch folder');
  }
  return res.json();
}

async function createFolder(data: CreateFolderData): Promise<Folder> {
  const res = await fetch('/api/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create folder');
  }
  return res.json();
}

async function updateFolder({ id, data }: { id: string; data: UpdateFolderData }): Promise<Folder> {
  const res = await fetch(`/api/folders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update folder');
  }
  return res.json();
}

async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`/api/folders/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete folder');
  }
}

// Query keys
export const folderKeys = {
  all: ['folders'] as const,
  lists: () => [...folderKeys.all, 'list'] as const,
  list: () => [...folderKeys.lists()] as const,
  details: () => [...folderKeys.all, 'detail'] as const,
  detail: (id: string) => [...folderKeys.details(), id] as const,
};

// Hooks
export function useFolders() {
  return useQuery({
    queryKey: folderKeys.list(),
    queryFn: fetchFolders,
  });
}

export function useFolder(id: string) {
  return useQuery({
    queryKey: folderKeys.detail(id),
    queryFn: () => fetchFolder(id),
    enabled: !!id,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFolder,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(folderKeys.detail(variables.id), (old: FolderWithContent | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: folderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
    },
  });
}
