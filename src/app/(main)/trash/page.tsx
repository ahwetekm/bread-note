'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TrashedNote {
  id: string;
  title: string;
  plainText: string;
  deletedAt: string;
  updatedAt: string;
}

export default function TrashPage() {
  const [notes, setNotes] = useState<TrashedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);

  const fetchTrashedNotes = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/notes/trash');
      if (!response.ok) {
        throw new Error('Failed to fetch trashed notes');
      }

      const data = await response.json();
      setNotes(data.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trash');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashedNotes();
  }, []);

  const handleRestore = async (id: string) => {
    setRestoringId(id);

    try {
      const response = await fetch(`/api/notes/trash/${id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to restore note');
      }

      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore note');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/notes/trash/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptying(true);

    try {
      const response = await fetch('/api/notes/trash', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to empty trash');
      }

      setNotes([]);
      setShowEmptyConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to empty trash');
    } finally {
      setIsEmptying(false);
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const expiryDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-28 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-2/3 mb-3" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Trash
          </h1>
          <p className="text-muted-foreground">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} in trash
          </p>
        </div>
        {notes.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setShowEmptyConfirm(true)}
            disabled={isEmptying}
          >
            {isEmptying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Empty Trash
          </Button>
        )}
      </div>

      {/* Empty Trash Confirmation */}
      {showEmptyConfirm && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Permanently delete all notes?</p>
              <p className="text-sm text-muted-foreground mb-3">
                This action cannot be undone. All {notes.length} notes will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEmptyTrash}
                  disabled={isEmptying}
                >
                  {isEmptying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmptyConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      {/* Info Banner */}
      <div className="p-3 bg-muted/50 border rounded-md text-sm text-muted-foreground">
        Notes in trash will be automatically deleted after 30 days.
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <Trash2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Trash is empty</h2>
          <p className="text-muted-foreground max-w-sm">
            When you delete notes, they will appear here for 30 days before being permanently removed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-1">
                    {note.title || 'Untitled'}
                  </h3>
                  {note.plainText && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {note.plainText.slice(0, 150)}
                      {note.plainText.length > 150 && '...'}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>
                      Deleted {formatDistanceToNow(new Date(note.deletedAt), { addSuffix: true })}
                    </span>
                    <span className="text-yellow-500">
                      {getDaysRemaining(note.deletedAt)} days remaining
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(note.id)}
                    disabled={restoringId === note.id}
                  >
                    {restoringId === note.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-2 h-4 w-4" />
                    )}
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handlePermanentDelete(note.id)}
                    disabled={deletingId === note.id}
                  >
                    {deletingId === note.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
