'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/indexeddb/schema';
import { syncEngine } from '@/lib/sync';
import { nanoid } from 'nanoid';
import type { LocalTodo } from '@/lib/indexeddb/schema';
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

// Query keys
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters?: TodoFilters) => [...todoKeys.lists(), filters] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
};

// Convert LocalTodo to TodoResponse format
function localToTodoResponse(todo: LocalTodo, subtaskCount = 0, completedSubtaskCount = 0): TodoResponse {
  return {
    id: todo.id,
    noteId: todo.noteId ?? null,
    parentId: todo.parentId ?? null,
    title: todo.title,
    isCompleted: todo.isCompleted,
    priority: todo.priority,
    position: todo.position,
    completedAt: todo.completedAt ? new Date(todo.completedAt).toISOString() : null,
    createdAt: new Date(todo.createdAt).toISOString(),
    updatedAt: new Date(todo.updatedAt).toISOString(),
    subtaskCount,
    completedSubtaskCount,
  };
}

// Fetch todos from IndexedDB (offline-first)
async function fetchTodosFromLocal(filters?: TodoFilters): Promise<TodoListResponse> {
  // Get top-level todos (no parentId)
  let localTodos = await db.todos
    .filter((todo) => !todo.deletedAt && !todo.parentId)
    .toArray();

  // Apply filters
  if (filters?.filter === 'active') {
    localTodos = localTodos.filter((t) => !t.isCompleted);
  } else if (filters?.filter === 'completed') {
    localTodos = localTodos.filter((t) => t.isCompleted);
  }

  if (filters?.noteId) {
    localTodos = localTodos.filter((t) => t.noteId === filters.noteId);
  }

  // Sort: incomplete first, then by priority, position, createdAt
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  localTodos.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.priority !== b.priority)
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    if (a.position !== b.position) return a.position - b.position;
    return b.createdAt - a.createdAt;
  });

  // Apply pagination
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  const paginatedTodos = localTodos.slice(offset, offset + limit);

  // Get subtask counts for each todo
  const todosWithCounts = await Promise.all(
    paginatedTodos.map(async (todo) => {
      const subtasks = await db.todos
        .filter((t) => t.parentId === todo.id && !t.deletedAt)
        .toArray();
      const completedSubtasks = subtasks.filter((t) => t.isCompleted).length;
      return localToTodoResponse(todo, subtasks.length, completedSubtasks);
    })
  );

  return {
    todos: todosWithCounts,
    total: localTodos.length,
    hasMore: offset + limit < localTodos.length,
  };
}

// Fetch single todo with subtasks from IndexedDB
async function fetchTodoFromLocal(id: string): Promise<TodoWithSubtasks | null> {
  const todo = await db.todos.get(id);
  if (!todo || todo.deletedAt) return null;

  // Get subtasks
  const subtasks = await db.todos
    .filter((t) => t.parentId === id && !t.deletedAt)
    .toArray();

  const subtaskResponses = subtasks.map((st) => localToTodoResponse(st));

  return {
    ...localToTodoResponse(todo, subtasks.length, subtasks.filter((s) => s.isCompleted).length),
    subtasks: subtaskResponses,
  };
}

// Hooks

/**
 * Fetch todos list with offline-first strategy.
 */
export function useTodos(filters?: TodoFilters) {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: () => fetchTodosFromLocal(filters),
    staleTime: 1000,
  });
}

/**
 * Fetch single todo with subtasks.
 */
export function useTodo(id: string) {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => fetchTodoFromLocal(id),
    enabled: !!id,
  });
}

/**
 * Create a todo with offline-first strategy.
 */
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTodoInput) => {
      const todoId = nanoid();
      const now = Date.now();

      // If has parentId, validate parent exists and isn't nested too deep
      if (data.parentId) {
        const parent = await db.todos.get(data.parentId);
        if (!parent) throw new Error('Parent todo not found');
        if (parent.parentId) throw new Error('Cannot create nested subtask (max 2 levels)');
      }

      // Calculate position
      const existingTodos = await db.todos
        .filter((t) => !t.deletedAt && t.parentId === (data.parentId || undefined))
        .toArray();
      const maxPosition = existingTodos.reduce(
        (max, t) => Math.max(max, t.position),
        0
      );

      const localTodo: LocalTodo = {
        id: todoId,
        userId: '',
        noteId: data.noteId,
        parentId: data.parentId,
        title: data.title,
        description: undefined,
        isCompleted: false,
        priority: data.priority || 'medium',
        position: maxPosition + 1,
        dueDate: undefined,
        reminderAt: undefined,
        completedAt: undefined,
        createdAt: now,
        updatedAt: now,
        version: 1,
        syncStatus: 'pending',
        localModifiedAt: now,
      };

      await db.todos.add(localTodo);

      await syncEngine.queueOperation('todo', todoId, 'create', {
        title: data.title,
        priority: data.priority,
        noteId: data.noteId,
        parentId: data.parentId,
      });

      return localToTodoResponse(localTodo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

/**
 * Update a todo with offline-first strategy.
 */
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTodoInput }) => {
      const now = Date.now();
      const existing = await db.todos.get(id);
      if (!existing) throw new Error('Todo not found');

      const updates: Partial<LocalTodo> = {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isCompleted !== undefined && {
          isCompleted: data.isCompleted,
          completedAt: data.isCompleted ? now : undefined,
        }),
        ...(data.position !== undefined && { position: data.position }),
        updatedAt: now,
        localModifiedAt: now,
        syncStatus: 'pending' as const,
      };

      await db.todos.update(id, updates);

      await syncEngine.queueOperation('todo', id, 'update', data);

      return localToTodoResponse({ ...existing, ...updates } as LocalTodo);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

/**
 * Delete a todo with offline-first strategy (soft delete).
 */
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = Date.now();
      const todo = await db.todos.get(id);
      if (!todo) throw new Error('Todo not found');

      // Soft delete subtasks first
      const subtasks = await db.todos
        .filter((t) => t.parentId === id)
        .toArray();

      for (const subtask of subtasks) {
        await db.todos.update(subtask.id, {
          deletedAt: now,
          updatedAt: now,
          localModifiedAt: now,
          syncStatus: 'pending',
        });
      }

      // Soft delete the todo
      await db.todos.update(id, {
        deletedAt: now,
        updatedAt: now,
        localModifiedAt: now,
        syncStatus: 'pending',
      });

      await syncEngine.queueOperation('todo', id, 'delete', {});
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: todoKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

/**
 * Toggle completion with optimistic update (offline-first).
 */
export function useToggleComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const now = Date.now();
      const existing = await db.todos.get(id);
      if (!existing) throw new Error('Todo not found');

      await db.todos.update(id, {
        isCompleted,
        completedAt: isCompleted ? now : undefined,
        updatedAt: now,
        localModifiedAt: now,
        syncStatus: 'pending',
      });

      await syncEngine.queueOperation('todo', id, 'update', { isCompleted });

      return localToTodoResponse({ ...existing, isCompleted, completedAt: isCompleted ? now : undefined, updatedAt: now } as LocalTodo);
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
