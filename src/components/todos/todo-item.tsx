'use client';

import { useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SubtaskList } from './subtask-list';
import { cn } from '@/lib/utils/cn';
import type { TodoResponse, Priority } from '@/lib/validations/todos';
import { Pencil, Trash2, Check, X, ChevronDown, ChevronRight, ListPlus } from 'lucide-react';

interface TodoItemProps {
  todo: TodoResponse;
  subtasks?: TodoResponse[];
  onToggleComplete?: (id: string, isCompleted: boolean) => void;
  onUpdate?: (id: string, data: { title?: string; priority?: Priority }) => void;
  onDelete?: (id: string) => void;
  onCreateSubtask?: (parentId: string, title: string) => void;
  onExpandToggle?: (id: string) => void;
  isExpanded?: boolean;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high: {
    label: 'Yüksek',
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  medium: {
    label: 'Orta',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  },
  low: {
    label: 'Düşük',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
};

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'high', label: 'Yüksek' },
  { value: 'medium', label: 'Orta' },
  { value: 'low', label: 'Düşük' },
];

export function TodoItem({
  todo,
  subtasks = [],
  onToggleComplete,
  onUpdate,
  onDelete,
  onCreateSubtask,
  onExpandToggle,
  isExpanded = false,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editPriority, setEditPriority] = useState<Priority>(todo.priority);
  const inputRef = useRef<HTMLInputElement>(null);

  const priority = priorityConfig[todo.priority];
  const hasSubtasks = (todo.subtaskCount ?? 0) > 0 || subtasks.length > 0;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleToggle = () => {
    onToggleComplete?.(todo.id, !todo.isCompleted);
  };

  const handleStartEdit = () => {
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    const trimmedTitle = editTitle.trim();
    const updates: { title?: string; priority?: Priority } = {};

    if (trimmedTitle && trimmedTitle !== todo.title) {
      updates.title = trimmedTitle;
    }
    if (editPriority !== todo.priority) {
      updates.priority = editPriority;
    }

    if (Object.keys(updates).length > 0) {
      onUpdate?.(todo.id, updates);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="space-y-0">
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group',
          todo.isCompleted && 'opacity-60'
        )}
      >
        {/* Expand/collapse button for items with subtasks */}
        {hasSubtasks ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0 -ml-1"
            onClick={() => onExpandToggle?.(todo.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6 shrink-0 -ml-1" />
        )}

        <Checkbox
          checked={todo.isCompleted}
          onCheckedChange={handleToggle}
          className="shrink-0"
          aria-label={`${todo.title} görevini ${todo.isCompleted ? 'tamamlanmadı' : 'tamamlandı'} olarak işaretle`}
        />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={200}
                className="h-8 text-sm flex-1 min-w-[150px]"
              />
              <Select
                value={editPriority}
                onValueChange={(value) => setEditPriority(value as Priority)}
              >
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={handleSaveEdit}
              >
                <Check className="h-4 w-4 text-green-500" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <>
              <p
                className={cn(
                  'text-sm font-medium truncate',
                  todo.isCompleted && 'line-through text-muted-foreground'
                )}
              >
                {todo.title}
              </p>

              {/* Subtask progress */}
              {hasSubtasks && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {todo.completedSubtaskCount || 0}/{todo.subtaskCount || subtasks.length} alt görev
                </p>
              )}
            </>
          )}
        </div>

        {/* Actions - shown on hover when not editing */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Add subtask button - only for parent todos (no parentId) */}
            {!todo.parentId && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  if (!isExpanded) {
                    onExpandToggle?.(todo.id);
                  }
                  // SubtaskList will handle the add button
                }}
                aria-label="Alt görev ekle"
                title="Alt görev ekle"
              >
                <ListPlus className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleStartEdit}
              aria-label="Görevi düzenle"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              onClick={() => onDelete?.(todo.id)}
              aria-label="Görevi sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Priority badge */}
        {!isEditing && (
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full border shrink-0',
              priority.className
            )}
          >
            {priority.label}
          </span>
        )}
      </div>

      {/* Subtasks - shown when expanded */}
      {isExpanded && !todo.parentId && (
        <SubtaskList
          subtasks={subtasks}
          parentId={todo.id}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onCreateSubtask={onCreateSubtask}
        />
      )}
    </div>
  );
}
