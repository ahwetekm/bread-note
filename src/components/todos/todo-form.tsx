'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTodoSchema, type Priority } from '@/lib/validations/todos';
import { Loader2 } from 'lucide-react';

interface TodoFormProps {
  onSubmit: (data: { title: string; priority: Priority }) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  defaultValues?: {
    title?: string;
    priority?: Priority;
  };
}

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'high', label: 'Yüksek' },
  { value: 'medium', label: 'Orta' },
  { value: 'low', label: 'Düşük' },
];

export function TodoForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultValues,
}: TodoFormProps) {
  const [title, setTitle] = useState(defaultValues?.title ?? '');
  const [priority, setPriority] = useState<Priority>(
    defaultValues?.priority ?? 'medium'
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate with Zod
    const result = createTodoSchema.safeParse({ title, priority });

    if (!result.success) {
      const firstError = result.error.errors[0];
      setError(firstError?.message ?? 'Geçersiz form verisi');
      return;
    }

    onSubmit({ title: result.data.title, priority: result.data.priority });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Görev Başlığı</Label>
        <Input
          id="title"
          placeholder="Ne yapmanız gerekiyor?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          autoFocus
          disabled={isSubmitting}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <p className="text-xs text-muted-foreground text-right">
          {title.length}/200
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Öncelik</Label>
        <Select
          value={priority}
          onValueChange={(value) => setPriority(value as Priority)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="Öncelik seçin" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            İptal
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}
