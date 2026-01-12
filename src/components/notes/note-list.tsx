'use client';

import { NoteCard } from './note-card';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Note {
  id: string;
  title: string;
  plainText: string;
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: string | Date;
  tags?: { id: string; name: string; color?: string }[];
}

interface NoteListProps {
  notes: Note[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function NoteList({
  notes,
  isLoading,
  emptyMessage = 'No notes yet',
  emptyDescription = 'Create your first note to get started.',
}: NoteListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg border bg-card animate-pulse"
          >
            <div className="h-5 bg-muted rounded w-3/4 mb-3" />
            <div className="h-4 bg-muted rounded w-full mb-2" />
            <div className="h-4 bg-muted rounded w-2/3 mb-3" />
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-4 bg-muted rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{emptyMessage}</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {emptyDescription}
        </p>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="mr-2 h-4 w-4" />
            Create a note
          </Link>
        </Button>
      </div>
    );
  }

  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);

  return (
    <div className="space-y-6">
      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <span className="h-px flex-1 bg-border" />
            Pinned
            <span className="h-px flex-1 bg-border" />
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* Other Notes */}
      {unpinnedNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-border" />
              Others
              <span className="h-px flex-1 bg-border" />
            </h3>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unpinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
