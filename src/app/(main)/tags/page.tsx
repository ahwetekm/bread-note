'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface TagItem {
  id: string;
  name: string;
  color: string | null;
  noteCount: number;
  createdAt: string;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTags = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = await response.json();
      setTags(data.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsCreating(true);

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create tag');
      }

      const newTag = await response.json();
      setTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTagName('');
      setNewTagColor(null);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTag = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingName.trim(),
          color: editingColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tag');
      }

      const updatedTag = await response.json();
      setTags((prev) =>
        prev
          .map((t) => (t.id === id ? { ...t, ...updatedTag } : t))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      setEditingName('');
      setEditingColor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag');
    }
  };

  const handleDeleteTag = async (id: string) => {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag');
      }

      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-10 w-28 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex flex-wrap gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-full" />
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
            <Tag className="h-6 w-6" />
            Tags
          </h1>
          <p className="text-muted-foreground">
            {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Tag
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
          <Button
            variant="link"
            className="ml-2 p-0 h-auto text-red-500"
            onClick={() => setError('')}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Create Tag Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateTag} className="p-4 border rounded-lg bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 shrink-0"
              style={{ backgroundColor: newTagColor || 'transparent' }}
            />
            <Input
              type="text"
              placeholder="Tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="flex-1"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Color:</span>
            <button
              type="button"
              onClick={() => setNewTagColor(null)}
              className={`w-6 h-6 rounded-full border-2 ${!newTagColor ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              title="No color"
            />
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                className={`w-6 h-6 rounded-full ${newTagColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isCreating || !newTagName.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateForm(false);
                setNewTagName('');
                setNewTagColor(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Tags List */}
      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <Tag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No tags yet</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Create tags to categorize and organize your notes. You can add colors to make them easier to identify.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create a tag
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tags.map((tag) => {
            const isEditing = editingId === tag.id;
            const isDeleting = deletingId === tag.id;

            return (
              <div
                key={tag.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateTag(tag.id);
                    }}
                    className="flex-1 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 shrink-0"
                        style={{ backgroundColor: editingColor || 'transparent' }}
                      />
                      <Input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Color:</span>
                      <button
                        type="button"
                        onClick={() => setEditingColor(null)}
                        className={`w-6 h-6 rounded-full border-2 ${!editingColor ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      />
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditingColor(color)}
                          className={`w-6 h-6 rounded-full ${editingColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName('');
                          setEditingColor(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color || '#6b7280' }}
                    />
                    <Link
                      href={`/tags/${tag.id}`}
                      className="flex-1 flex items-center gap-2 font-medium hover:text-primary transition-colors"
                    >
                      {tag.name}
                      <span className="text-sm text-muted-foreground">
                        ({tag.noteCount} {tag.noteCount === 1 ? 'note' : 'notes'})
                      </span>
                    </Link>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingId(tag.id);
                          setEditingName(tag.name);
                          setEditingColor(tag.color);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTag(tag.id)}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
