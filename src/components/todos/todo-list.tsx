'use client';

import { useState } from 'react';
import { TodoItem } from './todo-item';
import type { TodoResponse, Priority } from '@/lib/validations/todos';

interface TodoListProps {
  todos: TodoResponse[];
  subtasksMap?: Record<string, TodoResponse[]>;
  isLoading?: boolean;
  onToggleComplete?: (id: string, isCompleted: boolean) => void;
  onUpdate?: (id: string, data: { title?: string; priority?: Priority }) => void;
  onDelete?: (id: string) => void;
  onCreateSubtask?: (parentId: string, title: string) => void;
}

// Priority order: high = 1, medium = 2, low = 3
const priorityOrder: Record<Priority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

function sortTodos(todos: TodoResponse[]): TodoResponse[] {
  return [...todos].sort((a, b) => {
    // Completed items go to bottom
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }

    // Sort by priority (high > medium > low)
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    // Then by position
    if (a.position !== b.position) {
      return a.position - b.position;
    }

    // Finally by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function TodoList({
  todos,
  subtasksMap = {},
  isLoading,
  onToggleComplete,
  onUpdate,
  onDelete,
  onCreateSubtask,
}: TodoListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleExpandToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card animate-pulse"
          >
            <div className="h-4 w-4 rounded bg-muted shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
            <div className="h-5 w-14 bg-muted rounded-full shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  // Filter out subtasks from the main list (they're shown under their parent)
  const parentTodos = todos.filter((t) => !t.parentId);
  const sortedTodos = sortTodos(parentTodos);

  // Separate active and completed
  const activeTodos = sortedTodos.filter((t) => !t.isCompleted);
  const completedTodos = sortedTodos.filter((t) => t.isCompleted);

  const renderTodoItem = (todo: TodoResponse) => (
    <TodoItem
      key={todo.id}
      todo={todo}
      subtasks={subtasksMap[todo.id] || []}
      isExpanded={expandedIds.has(todo.id)}
      onExpandToggle={handleExpandToggle}
      onToggleComplete={onToggleComplete}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onCreateSubtask={onCreateSubtask}
    />
  );

  return (
    <div className="space-y-4">
      {/* Active Todos */}
      {activeTodos.length > 0 && (
        <div className="space-y-2">
          {activeTodos.map(renderTodoItem)}
        </div>
      )}

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 pt-2">
            <span className="h-px flex-1 bg-border" />
            Tamamlanan ({completedTodos.length})
            <span className="h-px flex-1 bg-border" />
          </h3>
          {completedTodos.map(renderTodoItem)}
        </div>
      )}
    </div>
  );
}
