'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoteList } from '@/components/notes/note-list';
import { Plus, RefreshCw, FolderClosed, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface Note {
  id: string;
  title: string;
  plainText: string;
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: string;
  folderId: string | null;
  tags?: { id: string; name: string; color?: string }[];
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Folder selection state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Create folder state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch folders and notes in parallel
      const [foldersRes, notesRes] = await Promise.all([
        fetch('/api/folders'),
        fetch('/api/notes'),
      ]);

      if (!foldersRes.ok || !notesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [foldersData, notesData] = await Promise.all([
        foldersRes.json(),
        notesRes.json(),
      ]);

      setFolders(foldersData.folders);
      setNotes(notesData.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch notes when folder selection changes
  const fetchNotes = useCallback(async (folderId: string | null) => {
    try {
      const url = folderId
        ? `/api/notes?folderId=${folderId}`
        : '/api/notes';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isLoading) {
      fetchNotes(selectedFolderId);
    }
  }, [selectedFolderId, isLoading, fetchNotes]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      const newFolder = await response.json();
      setFolders((prev) => [...prev, newFolder]);
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolderId(folderId);
  };

  const handleBackToAll = () => {
    setSelectedFolderId(null);
  };

  // Count notes per folder
  const getNotesCountForFolder = (folderId: string) => {
    // When viewing all notes, we have all notes data
    // When viewing a specific folder, we need to rely on the original data
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
          <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading || undefined}>
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
          {error}
          <Button variant="link" className="ml-2 p-0 h-auto" onClick={fetchData}>
            Try again
          </Button>
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
            <Button type="submit" size="sm" disabled={isCreatingFolder || !newFolderName.trim()}>
              {isCreatingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
