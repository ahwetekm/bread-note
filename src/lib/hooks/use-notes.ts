'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Note, Tag } from '@/lib/db/schema';

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

// API functions
async function fetchNotes(filters?: NoteFilters): Promise<NotesResponse> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.folderId) params.set('folderId', filters.folderId);
  if (filters?.favorites) params.set('favorites', 'true');

  const res = await fetch(`/api/notes?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch notes');
  }
  return res.json();
}

async function fetchNote(id: string): Promise<NoteWithTags> {
  const res = await fetch(`/api/notes/${id}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch note');
  }
  return res.json();
}

async function createNote(data: CreateNoteData): Promise<Note> {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create note');
  }
  return res.json();
}

async function updateNote({ id, data }: { id: string; data: UpdateNoteData }): Promise<NoteWithTags> {
  const res = await fetch(`/api/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update note');
  }
  return res.json();
}

async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete note');
  }
}

// Query keys
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters?: NoteFilters) => [...noteKeys.lists(), filters] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
};

// Hooks
export function useNotes(filters?: NoteFilters) {
  return useQuery({
    queryKey: noteKeys.list(filters),
    queryFn: () => fetchNotes(filters),
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => fetchNote(id),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNote,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(noteKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: noteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

// Toggle helpers
export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
      });
      if (!res.ok) throw new Error('Failed to toggle pin');
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(noteKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite }),
      });
      if (!res.ok) throw new Error('Failed to toggle favorite');
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(noteKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}
