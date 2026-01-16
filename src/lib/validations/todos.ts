import { z } from 'zod';

// Priority enum
export const priorityEnum = z.enum(['low', 'medium', 'high']);
export type Priority = z.infer<typeof priorityEnum>;

// Filter enum
export const filterEnum = z.enum(['all', 'active', 'completed']);
export type Filter = z.infer<typeof filterEnum>;

// Create Todo schema
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Başlık zorunludur')
    .max(200, 'Başlık en fazla 200 karakter olabilir')
    .trim(),
  priority: priorityEnum.default('medium'),
  noteId: z.string().optional(),
  parentId: z.string().optional(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

// Update Todo schema
export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Başlık zorunludur')
    .max(200, 'Başlık en fazla 200 karakter olabilir')
    .trim()
    .optional(),
  priority: priorityEnum.optional(),
  isCompleted: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
  version: z.number().int().min(1).optional(), // For optimistic locking
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

// List Todos query schema
export const listTodosQuerySchema = z.object({
  filter: filterEnum.default('all'),
  noteId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListTodosQuery = z.infer<typeof listTodosQuerySchema>;

// Todo response type (for frontend)
export interface TodoResponse {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: Priority;
  position: number;
  noteId: string | null;
  parentId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subtaskCount?: number;
  completedSubtaskCount?: number;
}

export interface TodoListResponse {
  todos: TodoResponse[];
  total: number;
  hasMore: boolean;
}
