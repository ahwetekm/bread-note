'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TodoList } from '@/components/todos/todo-list';
import { TodoForm } from '@/components/todos/todo-form';
import { TodoFilters } from '@/components/todos/todo-filters';
import { EmptyState } from '@/components/todos/empty-state';
import { DeleteConfirmDialog } from '@/components/todos/delete-confirm-dialog';
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useToggleComplete,
} from '@/lib/hooks/use-todos';
import type { Priority, TodoResponse, Filter } from '@/lib/validations/todos';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';

export default function TodosPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const { data, isLoading, error, refetch, isRefetching } = useTodos({ filter });
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const toggleComplete = useToggleComplete();

  const todos = useMemo(() => data?.todos ?? [], [data?.todos]);
  const total = data?.total ?? 0;

  // Build subtasks map for efficient lookup
  const subtasksMap = useMemo(() => {
    const map: Record<string, TodoResponse[]> = {};
    todos.forEach((todo) => {
      if (todo.parentId) {
        if (!map[todo.parentId]) {
          map[todo.parentId] = [];
        }
        map[todo.parentId].push(todo);
      }
    });
    return map;
  }, [todos]);

  // Calculate counts for filters (local calculation based on current data)
  const filterCounts = useMemo(() => {
    const parentTodos = todos.filter((t) => !t.parentId);
    return {
      all: parentTodos.length,
      active: parentTodos.filter((t) => !t.isCompleted).length,
      completed: parentTodos.filter((t) => t.isCompleted).length,
    };
  }, [todos]);

  const handleToggleComplete = (id: string, isCompleted: boolean) => {
    toggleComplete.mutate({ id, isCompleted });
  };

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateTodo = (data: { title: string; priority: Priority }) => {
    createTodo.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
      },
    });
  };

  const handleCreateSubtask = (parentId: string, title: string) => {
    createTodo.mutate({ title, parentId, priority: 'medium' });
  };

  const handleUpdateTodo = (id: string, data: { title?: string; priority?: Priority }) => {
    updateTodo.mutate({ id, data });
  };

  const handleDeleteClick = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      setDeleteTarget({ id, title: todo.title });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteTodo.mutate(deleteTarget.id, {
        onSuccess: () => {
          setDeleteTarget(null);
        },
      });
    }
  };

  // Count only parent todos for display
  const parentTodosCount = todos.filter((t) => !t.parentId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Görevler</h1>
          <p className="text-muted-foreground">
            {parentTodosCount} {parentTodosCount === 1 ? 'görev' : 'görev'}
            {total > parentTodosCount && ` (${total - parentTodosCount} alt görev)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Görev
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TodoFilters
        currentFilter={filter}
        onFilterChange={setFilter}
        counts={filter === 'all' ? filterCounts : undefined}
      />

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {error instanceof Error ? error.message : 'Görevler yüklenirken bir hata oluştu'}
          </span>
          <Button
            variant="link"
            className="p-0 h-auto text-red-500"
            onClick={() => refetch()}
          >
            Tekrar dene
          </Button>
        </div>
      )}

      {/* Content */}
      {!error && (
        <>
          {isLoading ? (
            <TodoList todos={[]} isLoading={true} />
          ) : parentTodosCount === 0 ? (
            <EmptyState onCreateTodo={handleOpenCreateDialog} />
          ) : (
            <TodoList
              todos={todos}
              subtasksMap={subtasksMap}
              onToggleComplete={handleToggleComplete}
              onUpdate={handleUpdateTodo}
              onDelete={handleDeleteClick}
              onCreateSubtask={handleCreateSubtask}
            />
          )}
        </>
      )}

      {/* Create Todo Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Görev</DialogTitle>
            <DialogDescription>
              Yeni bir görev oluşturun. Başlık ve öncelik belirleyin.
            </DialogDescription>
          </DialogHeader>
          <TodoForm
            onSubmit={handleCreateTodo}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={createTodo.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteTodo.isPending}
        title={deleteTarget?.title}
      />
    </div>
  );
}
