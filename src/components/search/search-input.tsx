'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useSearch, type SearchResult } from '@/lib/hooks/use-search';
import { SearchResults } from './search-results';

interface SearchInputProps {
  placeholder?: string;
}

// Detect platform for keyboard shortcut hint
function getShortcutKey(): string {
  if (typeof window === 'undefined') return 'Ctrl+K';
  return navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K';
}

export function SearchInput({ placeholder }: SearchInputProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [shortcutKey, setShortcutKey] = useState('Ctrl+K');

  // Set platform-specific shortcut key on mount
  useEffect(() => {
    setShortcutKey(getShortcutKey());
  }, []);

  const dynamicPlaceholder = placeholder || `Notlarda ara... (${shortcutKey})`;

  const { data, isLoading, isError, error } = useSearch(query);
  const results = data?.results ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.length >= 1) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, []);

  // Handle result click
  const handleResultClick = useCallback((result: SearchResult) => {
    router.push(`/notes/${result.id}`);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  }, [router]);

  // Handle result hover
  const handleResultHover = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      // Escape closes the dropdown
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else if (results.length > 0) {
          handleResultClick(results[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results, selectedIndex, handleResultClick]);

  // Determine if dropdown should be shown
  const showDropdown = isOpen && (query.length >= 1 || isLoading);

  return (
    <div ref={containerRef} className="relative flex-1 lg:max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 1 && setIsOpen(true)}
          placeholder={dynamicPlaceholder}
          className="w-full rounded-md border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-label="Notlarda ara"
        />
      </div>

      {showDropdown && (
        <div
          id="search-results"
          className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-card shadow-lg z-50"
          role="listbox"
        >
          <SearchResults
            results={results}
            query={query}
            isLoading={isLoading}
            isError={isError}
            error={error}
            selectedIndex={selectedIndex}
            onResultClick={handleResultClick}
            onResultHover={handleResultHover}
          />
        </div>
      )}
    </div>
  );
}
