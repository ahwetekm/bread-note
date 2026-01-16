import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notes, noteTags, tags } from '@/lib/db/schema';
import { eq, and, gt, lte, isNull, isNotNull, inArray } from 'drizzle-orm';
import { z } from 'zod';

const syncRequestSchema = z.object({
  sinceTimestamp: z.number(),
  deviceId: z.string(),
  batchSize: z.number().min(1).max(500).default(100),
});

// POST /api/sync/notes - Delta sync for notes
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sinceTimestamp, batchSize } = syncRequestSchema.parse(body);

    const userId = session.user.id;
    const sinceDate = new Date(sinceTimestamp);

    // Get created notes (createdAt > sinceTimestamp AND not deleted)
    const createdNotes = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          gt(notes.createdAt, sinceDate),
          isNull(notes.deletedAt)
        )
      )
      .limit(batchSize);

    // Get updated notes (updatedAt > sinceTimestamp AND createdAt <= sinceTimestamp AND not deleted)
    const updatedNotes = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          gt(notes.updatedAt, sinceDate),
          lte(notes.createdAt, sinceDate),
          isNull(notes.deletedAt)
        )
      )
      .limit(batchSize);

    // Get deleted notes (deletedAt > sinceTimestamp)
    const deletedNotes = await db
      .select({ id: notes.id })
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          isNotNull(notes.deletedAt),
          gt(notes.deletedAt, sinceDate)
        )
      )
      .limit(batchSize);

    // Get tags for created/updated notes in a single batch query (N+1 fix)
    const allNotes = [...createdNotes, ...updatedNotes];
    const noteIds = allNotes.map((n) => n.id);
    const noteTagsMap = new Map<string, typeof tags.$inferSelect[]>();

    if (noteIds.length > 0) {
      const allNoteTags = await db
        .select({
          noteId: noteTags.noteId,
          tag: tags,
        })
        .from(noteTags)
        .innerJoin(tags, and(eq(noteTags.tagId, tags.id), isNull(tags.deletedAt)))
        .where(inArray(noteTags.noteId, noteIds));

      // Group tags by noteId
      for (const { noteId, tag } of allNoteTags) {
        const existing = noteTagsMap.get(noteId) || [];
        existing.push(tag);
        noteTagsMap.set(noteId, existing);
      }
    }

    const notesWithTags = allNotes.map((note) => ({
      ...note,
      // Convert timestamps to numbers for consistency
      createdAt: note.createdAt?.getTime() ?? Date.now(),
      updatedAt: note.updatedAt?.getTime() ?? Date.now(),
      deletedAt: note.deletedAt?.getTime() ?? null,
      tags: (noteTagsMap.get(note.id) || []).map((tag) => ({
        ...tag,
        createdAt: tag.createdAt?.getTime() ?? Date.now(),
        updatedAt: tag.updatedAt?.getTime() ?? Date.now(),
      })),
    }));

    // Separate created and updated
    const createdIds = new Set(createdNotes.map((n) => n.id));
    const created = notesWithTags.filter((n) => createdIds.has(n.id));
    const updated = notesWithTags.filter((n) => !createdIds.has(n.id));

    const serverTimestamp = Date.now();
    const totalCount = createdNotes.length + updatedNotes.length + deletedNotes.length;

    return NextResponse.json({
      created,
      updated,
      deleted: deletedNotes.map((n) => n.id),
      serverTimestamp,
      hasMore: totalCount >= batchSize,
    });
  } catch (error) {
    console.error('Error in notes sync:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
