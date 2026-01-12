'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { NoteList } from '@/components/notes/note-list';
import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Note {
  id: string;
  title: string;
  plainText: string;
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: string;
  tags?: { id: string; name: string; color?: string }[];
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotes = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/notes');
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Notes</h1>
          <p className="text-muted-foreground">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchNotes} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link href="/notes/new">
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Link>
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
          <Button variant="link" className="ml-2 p-0 h-auto" onClick={fetchNotes}>
            Try again
          </Button>
        </div>
      )}

      {/* Notes List */}
      <NoteList
        notes={notes}
        isLoading={isLoading}
        emptyMessage="No notes yet"
        emptyDescription="Create your first note to get started. Your notes will be synced across all your devices."
      />
    </div>
  );
}
