'use client';

import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateTodo?: () => void;
}

export function EmptyState({ onCreateTodo }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
        <CheckSquare className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Henüz görev yok</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        İlk görevinizi oluşturarak başlayın ve yapılacaklar listenizi yönetin.
      </p>
      {onCreateTodo && (
        <Button onClick={onCreateTodo}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Görev
        </Button>
      )}
    </div>
  );
}
