'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { ArrowLeft, Save, Loader2, Star, Pin } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [plainText, setPlainText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleContentChange = useCallback((newContent: string, newPlainText: string) => {
    setContent(newContent);
    setPlainText(newPlainText);
  }, []);

  const handleSave = async () => {
    if (!title.trim() && !plainText.trim()) {
      setError('Please add a title or some content');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled',
          content,
          plainText,
          isFavorite,
          isPinned,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save note');
      }

      const note = await response.json();
      router.push(`/notes/${note.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

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
          <h1 className="text-xl font-semibold">New Note</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPinned(!isPinned)}
            className={cn(isPinned && 'text-primary')}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={cn('h-4 w-4', isPinned && 'fill-current')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFavorite(!isFavorite)}
            className={cn(isFavorite && 'text-yellow-500')}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      {/* Title */}
      <Input
        type="text"
        placeholder="Note title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-2xl font-bold border-none bg-transparent px-0 h-auto py-2 focus-visible:ring-0 placeholder:text-muted-foreground/50"
      />

      {/* Editor */}
      <TiptapEditor
        content={content}
        onChange={handleContentChange}
        placeholder="Start writing your note..."
        autoFocus
      />

      {/* Footer info */}
      <div className="text-sm text-muted-foreground">
        {plainText.length} characters
      </div>
    </div>
  );
}
