'use client';

import { useState, useCallback, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { ArrowLeft, Save, Loader2, Star, Pin, Trash2, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface Note {
  id: string;
  title: string;
  content: string;
  plainText: string;
  isPinned: boolean;
  isFavorite: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [plainText, setPlainText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [version, setVersion] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalContent, setOriginalContent] = useState('');

  // Fetch note
  useEffect(() => {
    async function fetchNote() {
      try {
        const response = await fetch(`/api/notes/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/');
            return;
          }
          throw new Error('Failed to fetch note');
        }

        const data = await response.json();
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
        setPlainText(data.plainText);
        setIsFavorite(data.isFavorite);
        setIsPinned(data.isPinned);
        setVersion(data.version);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load note');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNote();
  }, [id, router]);

  const handleContentChange = useCallback((newContent: string, newPlainText: string) => {
    setContent(newContent);
    setPlainText(newPlainText);
    setHasChanges(true);
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasChanges(true);
  };

  const handleStartEdit = () => {
    setOriginalTitle(title);
    setOriginalContent(content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setTitle(originalTitle);
    setContent(originalContent);
    setPlainText(note?.plainText || '');
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled',
          content,
          plainText,
          isFavorite,
          isPinned,
          version,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          throw new Error('Conflict: Note was modified elsewhere. Please refresh.');
        }
        throw new Error(data.error || 'Failed to save note');
      }

      const updatedNote = await response.json();
      setVersion(updatedNote.version);
      setHasChanges(false);
      setIsEditing(false);
      setOriginalTitle(title.trim() || 'Untitled');
      setOriginalContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    const newValue = !isFavorite;
    setIsFavorite(newValue);

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newValue, version }),
      });

      if (response.ok) {
        const data = await response.json();
        setVersion(data.version);
      }
    } catch {
      setIsFavorite(!newValue); // Revert on error
    }
  };

  const handleTogglePinned = async () => {
    const newValue = !isPinned;
    setIsPinned(newValue);

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: newValue, version }),
      });

      if (response.ok) {
        const data = await response.json();
        setVersion(data.version);
      }
    } catch {
      setIsPinned(!newValue); // Revert on error
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-12 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Note not found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Go back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {isEditing
              ? (hasChanges ? 'Unsaved changes' : 'Editing')
              : 'Saved'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTogglePinned}
            className={cn(isPinned && 'text-primary')}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={cn('h-4 w-4', isPinned && 'fill-current')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            className={cn(isFavorite && 'text-yellow-500')}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-destructive hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {isEditing && (
            <>
              <Button
                variant="ghost"
                onClick={handleCancelEdit}
                title="Discard changes"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="font-medium">Delete this note?</p>
          <p className="text-sm text-muted-foreground mb-3">
            This note will be moved to trash and automatically deleted after 30 days.
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
        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <Input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-2xl font-bold border-none bg-transparent px-0 h-auto py-2 focus-visible:ring-0 placeholder:text-muted-foreground/50 flex-1"
            autoFocus
          />
        ) : (
          <>
            <h1 className="text-2xl font-bold flex-1">
              {title || 'Untitled'}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleStartEdit}
              title="Edit note"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Editor */}
      <TiptapEditor
        content={content}
        onChange={handleContentChange}
        placeholder="Start writing your note..."
        editable={isEditing}
      />

      {/* Footer info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{plainText.length} characters</span>
        <span>
          Last updated: {new Date(note.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
