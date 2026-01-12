'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { NoteList } from '@/components/notes/note-list';
import { RefreshCw, Star } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  plainText: string;
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: string;
  tags?: { id: string; name: string; color?: string }[];
}

export default function FavoritesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotes = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/notes?favorites=true');
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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Favorites</h1>
            <p className="text-muted-foreground">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={fetchNotes} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      {/* Notes List */}
      <NoteList
        notes={notes}
        isLoading={isLoading}
        emptyMessage="No favorites yet"
        emptyDescription="Star your important notes to find them quickly here."
      />
    </div>
  );
}
