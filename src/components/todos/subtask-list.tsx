'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import type { TodoResponse, Priority } from '@/lib/validations/todos';
import { Plus, Trash2, X } from 'lucide-react';

interface SubtaskListProps {
  subtasks: TodoResponse[];
  parentId: string;
  onToggleComplete?: (id: string, isCompleted: boolean) => void;
  onDelete?: (id: string) => void;
  onCreateSubtask?: (parentId: string, title: string) => void;
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

export function SubtaskList({
  subtasks,
  parentId,
  onToggleComplete,
  onDelete,
  onCreateSubtask,
}: SubtaskListProps) {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAddSubtask = () => {
    const trimmedTitle = newSubtaskTitle.trim();
    if (trimmedTitle) {
      onCreateSubtask?.(parentId, trimmedTitle);
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  return (
    <div className="pl-8 mt-2 space-y-1.5 border-l-2 border-border ml-2">
      {subtasks.map((subtask) => {
        const priority = priorityConfig[subtask.priority];
        return (
          <div
            key={subtask.id}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md hover:bg-accent/30 transition-colors group',
              subtask.isCompleted && 'opacity-60'
            )}
          >
            <Checkbox
              checked={subtask.isCompleted}
              onCheckedChange={() =>
                onToggleComplete?.(subtask.id, !subtask.isCompleted)
              }
              className="h-3.5 w-3.5"
            />
            <span
              className={cn(
                'flex-1 text-sm',
                subtask.isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {subtask.title}
            </span>
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-medium rounded-full border shrink-0',
                priority.className
              )}
            >
              {priority.label}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => onDelete?.(subtask.id)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        );
      })}

      {/* Add subtask form */}
      {isAddingSubtask ? (
        <div className="flex items-center gap-2 p-2">
          <Input
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Alt görev başlığı..."
            className="h-7 text-sm flex-1"
            maxLength={200}
            autoFocus
          />
          <Button size="sm" className="h-7" onClick={handleAddSubtask}>
            Ekle
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setNewSubtaskTitle('');
              setIsAddingSubtask(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setIsAddingSubtask(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Alt görev ekle
        </Button>
      )}
    </div>
  );
}
