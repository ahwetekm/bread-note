'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

// Types
export interface SearchResult {
  id: string;
  title: string;
  preview: string;
  matchType: 'title' | 'content' | 'both';
  updatedAt: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// API function
async function searchNotes(query: string, limit: number = 10): Promise<SearchResponse> {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('limit', String(limit));

  const res = await fetch(`/api/search?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to search notes');
  }
  return res.json();
}

// Query keys
export const searchKeys = {
  all: ['search'] as const,
  query: (q: string) => [...searchKeys.all, q] as const,
};

// Hook
export function useSearch(query: string, limit: number = 10) {
  const debouncedQuery = useDebounce(query.trim(), 300);

  return useQuery({
    queryKey: searchKeys.query(debouncedQuery),
    queryFn: () => searchNotes(debouncedQuery, limit),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60, // 1 minute cache
  });
}
