'use client';

import { cn } from '@/lib/utils/cn';
import type { Filter } from '@/lib/validations/todos';

interface TodoFiltersProps {
  currentFilter: Filter;
  onFilterChange: (filter: Filter) => void;
  counts?: {
    all: number;
    active: number;
    completed: number;
  };
}

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Tamamlanan' },
];

export function TodoFilters({
  currentFilter,
  onFilterChange,
  counts,
}: TodoFiltersProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {filters.map((filter) => {
        const count = counts?.[filter.value];
        return (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              currentFilter === filter.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {filter.label}
            {count !== undefined && (
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
