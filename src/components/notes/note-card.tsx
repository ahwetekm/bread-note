'use client';

import Link from 'next/link';
import { Star, Pin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow } from 'date-fns';

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    plainText: string;
    isPinned: boolean;
    isFavorite: boolean;
    updatedAt: string | Date;
    tags?: { id: string; name: string; color?: string }[];
  };
}

export function NoteCard({ note }: NoteCardProps) {
  const preview = note.plainText.slice(0, 150);
  const updatedAt = new Date(note.updatedAt);

  return (
    <Link
      href={`/notes/${note.id}`}
      className="block p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
          {note.title || 'Untitled'}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {note.isPinned && (
            <Pin className="h-3.5 w-3.5 text-primary fill-primary" />
          )}
          {note.isFavorite && (
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      </div>

      {preview && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {preview}
          {note.plainText.length > 150 && '...'}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {note.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
              style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
            >
              {tag.name}
            </span>
          ))}
          {note.tags && note.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{note.tags.length - 3}
            </span>
          )}
        </div>

        <span className="text-xs text-muted-foreground shrink-0">
          {formatDistanceToNow(updatedAt, { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
