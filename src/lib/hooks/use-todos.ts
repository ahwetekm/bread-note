'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  TodoResponse,
  TodoListResponse,
  CreateTodoInput,
  UpdateTodoInput,
  Filter,
} from '@/lib/validations/todos';

// Types
export interface TodoFilters {
  filter?: Filter;
  noteId?: string;
  limit?: number;
  offset?: number;
}

export interface TodoWithSubtasks extends TodoResponse {
  subtasks?: TodoResponse[];
}

// API functions
async function fetchTodos(filters?: TodoFilters): Promise<TodoListResponse> {
  const params = new URLSearchParams();
  if (filters?.filter) params.set('filter', filters.filter);
  if (filters?.noteId) params.set('noteId', filters.noteId);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));

  const res = await fetch(`/api/todos?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch todos');
  }
  return res.json();
}

async function fetchTodo(id: string): Promise<TodoWithSubtasks> {
  const res = await fetch(`/api/todos/${id}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch todo');
  }
  return res.json();
}

async function createTodo(data: CreateTodoInput): Promise<TodoResponse> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || error.error || 'Failed to create todo');
  }
  return res.json();
}

async function updateTodo({
  id,
  data,
}: {
  id: string;
  data: UpdateTodoInput;
}): Promise<TodoResponse> {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || error.error || 'Failed to update todo');
  }
  return res.json();
}

async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete todo');
  }
}

// Query keys
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters?: TodoFilters) => [...todoKeys.lists(), filters] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
};

// Hooks
export function useTodos(filters?: TodoFilters) {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: () => fetchTodos(filters),
  });
}

export function useTodo(id: string) {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => fetchTodo(id),
    enabled: !!id,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTodo,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(todoKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: todoKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

// Toggle completion with optimistic update
export function useToggleComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      });
      if (!res.ok) throw new Error('Failed to toggle completion');
      return res.json();
    },
    onMutate: async ({ id, isCompleted }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      // Snapshot previous value
      const previousTodos = queryClient.getQueriesData({ queryKey: todoKeys.lists() });

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: todoKeys.lists() },
        (old: TodoListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            todos: old.todos.map((todo) =>
              todo.id === id
                ? {
                    ...todo,
                    isCompleted,
                    completedAt: isCompleted ? new Date().toISOString() : null,
                  }
                : todo
            ),
          };
        }
      );

      return { previousTodos };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        context.previousTodos.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}
