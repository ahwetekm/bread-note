'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderClosed, FolderOpen, Plus, MoreHorizontal, Loader2, Pencil, Trash2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string | null;
  icon: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFolders = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/folders');
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const data = await response.json();
      setFolders(data.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreating(true);

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
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateFolder = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update folder');
      }

      const updatedFolder = await response.json();
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? updatedFolder : f))
      );
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update folder');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }

      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
    } finally {
      setDeletingId(null);
    }
  };

  // Build folder tree structure
  const buildFolderTree = (folders: Folder[], parentId: string | null = null): Folder[] => {
    return folders.filter((f) => f.parentId === parentId);
  };

  const rootFolders = buildFolderTree(folders, null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3" />
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
            <FolderClosed className="h-6 w-6" />
            Folders
          </h1>
          <p className="text-muted-foreground">
            {folders.length} {folders.length === 1 ? 'folder' : 'folders'}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      {/* Create Folder Form */}
      {showCreateForm && (
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
            <Button type="submit" size="sm" disabled={isCreating || !newFolderName.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateForm(false);
                setNewFolderName('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Folders List */}
      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <FolderClosed className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No folders yet</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Create folders to organize your notes. You can nest folders inside other folders.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create a folder
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {rootFolders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              allFolders={folders}
              editingId={editingId}
              editingName={editingName}
              deletingId={deletingId}
              onStartEdit={(id, name) => {
                setEditingId(id);
                setEditingName(name);
              }}
              onCancelEdit={() => {
                setEditingId(null);
                setEditingName('');
              }}
              onEditNameChange={setEditingName}
              onSaveEdit={handleUpdateFolder}
              onDelete={handleDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderItemProps {
  folder: Folder;
  allFolders: Folder[];
  level?: number;
  editingId: string | null;
  editingName: string;
  deletingId: string | null;
  onStartEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function FolderItem({
  folder,
  allFolders,
  level = 0,
  editingId,
  editingName,
  deletingId,
  onStartEdit,
  onCancelEdit,
  onEditNameChange,
  onSaveEdit,
  onDelete,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const children = allFolders.filter((f) => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const isEditing = editingId === folder.id;
  const isDeleting = deletingId === folder.id;

  return (
    <div style={{ marginLeft: level * 16 }}>
      <div className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-accent"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <div className="w-6" />
        )}

        {isExpanded ? (
          <FolderOpen className="h-5 w-5 text-primary" />
        ) : (
          <FolderClosed className="h-5 w-5 text-muted-foreground" />
        )}

        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSaveEdit(folder.id);
            }}
            className="flex-1 flex items-center gap-2"
          >
            <Input
              type="text"
              value={editingName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="h-8"
              autoFocus
            />
            <Button type="submit" size="sm" variant="ghost">
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <Link
              href={`/folders/${folder.id}`}
              className="flex-1 font-medium hover:text-primary transition-colors"
            >
              {folder.name}
            </Link>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onStartEdit(folder.id, folder.name)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(folder.id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-2">
          {children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              level={level + 1}
              editingId={editingId}
              editingName={editingName}
              deletingId={deletingId}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onEditNameChange={onEditNameChange}
              onSaveEdit={onSaveEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
