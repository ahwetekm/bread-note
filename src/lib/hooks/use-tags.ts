'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Tag, Note } from '@/lib/db/schema';

// Types
export interface TagWithNotes extends Tag {
  notes: Pick<Note, 'id' | 'title' | 'plainText' | 'isPinned' | 'isFavorite' | 'updatedAt'>[];
}

export interface TagWithCount extends Tag {
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

// API functions
async function fetchTags(): Promise<TagsResponse> {
  const res = await fetch('/api/tags');
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch tags');
  }
  return res.json();
}

async function fetchTag(id: string): Promise<TagWithNotes> {
  const res = await fetch(`/api/tags/${id}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch tag');
  }
  return res.json();
}

async function createTag(data: CreateTagData): Promise<Tag> {
  const res = await fetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create tag');
  }
  return res.json();
}

async function updateTag({ id, data }: { id: string; data: UpdateTagData }): Promise<Tag> {
  const res = await fetch(`/api/tags/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update tag');
  }
  return res.json();
}

async function deleteTag(id: string): Promise<void> {
  const res = await fetch(`/api/tags/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete tag');
  }
}

// Query keys
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: () => [...tagKeys.lists()] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagKeys.details(), id] as const,
};

// Hooks
export function useTags() {
  return useQuery({
    queryKey: tagKeys.list(),
    queryFn: fetchTags,
  });
}

export function useTag(id: string) {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: () => fetchTag(id),
    enabled: !!id,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTag,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(tagKeys.detail(variables.id), (old: TagWithNotes | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTag,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: tagKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}
