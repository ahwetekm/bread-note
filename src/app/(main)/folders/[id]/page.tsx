'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NoteList } from '@/components/notes/note-list';
import { FolderClosed, ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
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

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string | null;
  notes: Note[];
  subfolders: Folder[];
}

export default function FolderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchFolder = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/folders/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/folders');
          return;
        }
        throw new Error('Failed to fetch folder');
      }

      const data = await response.json();
      setFolder(data);
      setEditName(data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFolder();
  }, [id]);

  const handleUpdateName = async () => {
    if (!editName.trim() || !folder) return;

    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update folder');
      }

      const updatedFolder = await response.json();
      setFolder((prev) => prev ? { ...prev, name: updatedFolder.name } : null);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update folder');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }

      router.push('/folders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
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

  if (!folder) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Folder not found</p>
        <Button asChild className="mt-4">
          <Link href="/folders">Go to Folders</Link>
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
            <Link href="/folders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <FolderClosed className="h-6 w-6 text-primary" />
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateName();
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
                  setEditName(folder.name);
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{folder.name}</h1>
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

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href={`/notes/new?folderId=${id}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Link>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="font-medium">Delete this folder?</p>
          <p className="text-sm text-muted-foreground mb-3">
            Notes in this folder will be moved to &quot;All Notes&quot;. Subfolders will be moved to the parent folder.
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

      {/* Subfolders */}
      {folder.subfolders.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Subfolders</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {folder.subfolders.map((subfolder) => (
              <Link
                key={subfolder.id}
                href={`/folders/${subfolder.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <FolderClosed className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{subfolder.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Notes ({folder.notes.length})
        </h2>
        <NoteList
          notes={folder.notes}
          emptyMessage="No notes in this folder"
          emptyDescription="Create a note in this folder or move existing notes here."
        />
      </div>
    </div>
  );
}
