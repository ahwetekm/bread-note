'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NoteList } from '@/components/notes/note-list';
import { ArrowLeft, Pencil, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface Note {
  id: string;
  title: string;
  plainText: string;
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: string;
  tags?: { id: string; name: string; color?: string }[];
}

interface TagData {
  id: string;
  name: string;
  color: string | null;
  notes: Note[];
  createdAt: string;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
];

export default function TagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [tag, setTag] = useState<TagData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchTag = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tags/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/tags');
          return;
        }
        throw new Error('Failed to fetch tag');
      }

      const data = await response.json();
      setTag(data);
      setEditName(data.name);
      setEditColor(data.color);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tag');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdate = async () => {
    if (!editName.trim() || !tag) return;

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          color: editColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tag');
      }

      const updatedTag = await response.json();
      setTag((prev) => prev ? { ...prev, name: updatedTag.name, color: updatedTag.color } : null);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag');
      }

      router.push('/tags');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-3" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tag not found</p>
        <Button asChild className="mt-4">
          <Link href="/tags">Go to Tags</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tags">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: tag.color || '#6b7280' }}
          />
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate();
              }}
              className="flex items-center gap-2"
            >
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 text-xl font-bold"
                autoFocus
              />
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(tag.name);
                  setEditColor(tag.color);
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{tag.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Color picker when editing */}
      {isEditing && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-card">
          <span className="text-sm text-muted-foreground">Color:</span>
          <button
            type="button"
            onClick={() => setEditColor(null)}
            className={`w-6 h-6 rounded-full border-2 ${!editColor ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          />
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setEditColor(color)}
              className={`w-6 h-6 rounded-full ${editColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="font-medium">Delete this tag?</p>
          <p className="text-sm text-muted-foreground mb-3">
            This will remove the tag from all notes. The notes themselves will not be deleted.
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      {/* Notes */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Notes with this tag ({tag.notes.length})
        </h2>
        <NoteList
          notes={tag.notes}
          emptyMessage="No notes with this tag"
          emptyDescription="Add this tag to notes to see them here."
        />
      </div>
    </div>
  );
}
