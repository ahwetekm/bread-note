'use client';

import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FileText, Loader2 } from 'lucide-react';
import { HighlightMatch } from './search-highlight';
import type { SearchResult } from '@/lib/hooks/use-search';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  selectedIndex: number;
  onResultClick: (result: SearchResult) => void;
  onResultHover: (index: number) => void;
}

export function SearchResults({
  results,
  query,
  isLoading,
  isError,
  error,
  selectedIndex,
  onResultClick,
  onResultHover,
}: SearchResultsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
        <span className="text-sm">Aranıyor...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4 text-center text-destructive">
        <span className="text-sm">
          {error?.message || 'Arama sırasında bir hata oluştu'}
        </span>
      </div>
    );
  }

  // Minimum character hint
  if (query.length > 0 && query.length < 2) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <span className="text-sm">En az 2 karakter girin</span>
      </div>
    );
  }

  // Empty results
  if (results.length === 0 && query.length >= 2) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <span className="text-sm">Sonuç bulunamadı</span>
      </div>
    );
  }

  // Results list
  return (
    <ul className="max-h-80 overflow-y-auto" role="listbox">
      {results.map((result, index) => (
        <li
          key={result.id}
          role="option"
          aria-selected={index === selectedIndex}
          className={`
            flex items-start gap-3 p-3 cursor-pointer
            hover:bg-accent transition-colors
            ${index === selectedIndex ? 'bg-accent' : ''}
            ${index !== results.length - 1 ? 'border-b' : ''}
          `}
          onClick={() => onResultClick(result)}
          onMouseEnter={() => onResultHover(index)}
        >
          <FileText className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              <HighlightMatch text={result.title} query={query} />
            </div>
            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
              <HighlightMatch text={result.preview} query={query} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(result.updatedAt), {
                addSuffix: true,
                locale: tr,
              })}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
