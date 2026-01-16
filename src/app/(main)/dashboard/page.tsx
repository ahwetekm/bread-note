'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoteList } from '@/components/notes/note-list';
import { Plus, RefreshCw, FolderClosed, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { useNotes } from '@/lib/hooks/use-notes';
import { useFolders, useCreateFolder } from '@/lib/hooks/use-folders';

export default function DashboardPage() {
  // Folder selection state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Create folder state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Use TanStack Query hooks for offline-first data fetching
  const {
    data: notesData,
    isLoading: notesLoading,
    error: notesError,
    refetch: refetchNotes
  } = useNotes({ folderId: selectedFolderId || undefined });

  const {
    data: foldersData,
    isLoading: foldersLoading,
    error: foldersError,
    refetch: refetchFolders
  } = useFolders();

  const createFolderMutation = useCreateFolder();

  const notes = useMemo(() => {
    return notesData?.notes.map(note => ({
      id: note.id,
      title: note.title,
      plainText: note.plainText,
      isPinned: note.isPinned,
      isFavorite: note.isFavorite,
      updatedAt: note.updatedAt instanceof Date
        ? note.updatedAt.toISOString()
        : String(note.updatedAt),
      folderId: note.folderId,
      tags: note.tags?.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color ?? undefined,
      })),
    })) ?? [];
  }, [notesData]);

  const folders = useMemo(() => {
    return foldersData?.folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      color: folder.color,
      createdAt: folder.createdAt instanceof Date
        ? folder.createdAt.toISOString()
        : String(folder.createdAt),
      updatedAt: folder.updatedAt instanceof Date
        ? folder.updatedAt.toISOString()
        : String(folder.updatedAt),
    })) ?? [];
  }, [foldersData]);

  const isLoading = notesLoading || foldersLoading;
  const error = notesError || foldersError;

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const handleRefresh = async () => {
    await Promise.all([refetchNotes(), refetchFolders()]);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createFolderMutation.mutateAsync({ name: newFolderName.trim() });
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolderId(folderId);
  };

  const handleBackToAll = () => {
    setSelectedFolderId(null);
  };

  // Count notes per folder - use all notes data when viewing all folders
  const getNotesCountForFolder = (folderId: string) => {
    return notes.filter((n) => n.folderId === folderId).length;
  };

  // Get root folders only (no parent)
  const rootFolders = folders.filter((f) => f.parentId === null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {selectedFolder ? selectedFolder.name : 'All Notes'}
          </h1>
          <p className="text-muted-foreground">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            {!selectedFolderId && folders.length > 0 && (
              <> • {folders.length} {folders.length === 1 ? 'folder' : 'folders'}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => setShowCreateFolder(true)}>
            <FolderClosed className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button asChild>
            <Link href={selectedFolderId ? `/notes/new?folderId=${selectedFolderId}` : '/notes/new'}>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Link>
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error instanceof Error ? error.message : 'Failed to load data'}
          <Button variant="link" className="ml-2 p-0 h-auto" onClick={handleRefresh}>
            Try again
          </Button>
        </div>
      )}

      {/* Create Folder Mutation Error */}
      {createFolderMutation.error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {createFolderMutation.error instanceof Error
            ? createFolderMutation.error.message
            : 'Failed to create folder'}
        </div>
      )}

      {/* Create Folder Form */}
      {showCreateFolder && (
        <form onSubmit={handleCreateFolder} className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-3">
            <FolderClosed className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="sm" disabled={createFolderMutation.isPending || !newFolderName.trim()}>
              {createFolderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateFolder(false);
                setNewFolderName('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Back to All Notes (when folder is selected) */}
      {selectedFolderId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToAll}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          All Notes
        </Button>
      )}

      {/* Folders Grid (only when no folder is selected) */}
      {!selectedFolderId && rootFolders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Folders
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {rootFolders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                className={cn(
                  'p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left',
                  selectedFolderId === folder.id && 'ring-2 ring-primary'
                )}
              >
                <FolderClosed className="h-8 w-8 text-primary mb-2" />
                <p className="font-medium truncate">{folder.name}</p>
                <p className="text-sm text-muted-foreground">
                  {getNotesCountForFolder(folder.id)} notes
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="space-y-3">
        {!selectedFolderId && notes.length > 0 && (
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Notes
          </h2>
        )}
        <NoteList
          notes={notes}
          isLoading={isLoading}
          emptyMessage={selectedFolderId ? 'No notes in this folder' : 'No notes yet'}
          emptyDescription={
            selectedFolderId
              ? 'Create a note in this folder to get started.'
              : 'Create your first note to get started. Your notes will be synced across all your devices.'
          }
        />
      </div>
    </div>
  );
}
