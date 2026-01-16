import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { noteTags, notes, tags } from '@/lib/db/schema';
import { eq, and, gt, inArray } from 'drizzle-orm';
import { z } from 'zod';

const syncRequestSchema = z.object({
  sinceTimestamp: z.number(),
  deviceId: z.string(),
  batchSize: z.number().min(1).max(500).default(100),
});

// POST /api/sync/note-tags - Delta sync for note-tag relations
// Note: noteTags are only created or deleted, never updated
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

    // Get user's note IDs for filtering
    const userNotes = await db
      .select({ id: notes.id })
      .from(notes)
      .where(eq(notes.userId, userId));

    const userNoteIds = userNotes.map(n => n.id);

    if (userNoteIds.length === 0) {
      return NextResponse.json({
        created: [],
        deleted: [],
        serverTimestamp: Date.now(),
        hasMore: false,
      });
    }

    // Get created noteTags (createdAt > sinceTimestamp)
    let createdNoteTags: (typeof noteTags.$inferSelect)[] = [];

    if (sinceTimestamp === 0) {
      // Full sync: Get all noteTags for user's notes
      createdNoteTags = await db
        .select()
        .from(noteTags)
        .where(inArray(noteTags.noteId, userNoteIds))
        .limit(batchSize);
    } else {
      // Delta sync: Get new noteTags
      createdNoteTags = await db
        .select()
        .from(noteTags)
        .where(
          and(
            inArray(noteTags.noteId, userNoteIds),
            gt(noteTags.createdAt, sinceDate)
          )
        )
        .limit(batchSize);
    }

    // Get tag info for each noteTag
    const tagIds = [...new Set(createdNoteTags.map(nt => nt.tagId))];
    const tagInfoMap = new Map<string, typeof tags.$inferSelect>();

    if (tagIds.length > 0) {
      const tagInfos = await db
        .select()
        .from(tags)
        .where(inArray(tags.id, tagIds));

      for (const tag of tagInfos) {
        tagInfoMap.set(tag.id, tag);
      }
    }

    // Format response
    const formatNoteTag = (noteTag: typeof createdNoteTags[0]) => {
      const tag = tagInfoMap.get(noteTag.tagId);
      return {
        id: noteTag.id,
        noteId: noteTag.noteId,
        tagId: noteTag.tagId,
        createdAt: noteTag.createdAt?.getTime() ?? Date.now(),
        tag: tag ? {
          id: tag.id,
          name: tag.name,
          color: tag.color,
        } : null,
      };
    };

    const serverTimestamp = Date.now();

    // Note: We can't track deleted noteTags since they're hard-deleted
    // The client should reconcile by checking which noteTags exist for synced notes
    return NextResponse.json({
      created: createdNoteTags.map(formatNoteTag),
      updated: [], // noteTags are never updated, only created or deleted
      deleted: [], // Hard-deleted, can't track
      serverTimestamp,
      hasMore: createdNoteTags.length >= batchSize,
    });
  } catch (error) {
    console.error('Error in note-tags sync:', error);

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
