'use client';

import React from 'react';

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface HighlightMatchProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightMatch({ text, query, className }: HighlightMatchProps) {
  if (!query || query.length < 2) {
    return <span className={className}>{text}</span>;
  }

  const escapedQuery = escapeRegex(query);
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

// Utility function for direct use
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) {
    return text;
  }

  const escapedQuery = escapeRegex(query);
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={index}
        className="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export { escapeRegex };
