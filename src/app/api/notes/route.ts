import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notes, noteTags, tags } from '@/lib/db/schema';
import { eq, desc, and, isNull, sql, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const createNoteSchema = z.object({
  title: z.string().min(1).max(255).default('Untitled'),
  content: z.string().default(''),
  plainText: z.string().default(''),
  folderId: z.string().optional(),
  isPinned: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  tagIds: z.array(z.string()).optional(),
});

// GET /api/notes - List all notes
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const folderId = searchParams.get('folderId');
    const favorites = searchParams.get('favorites') === 'true';
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [
      eq(notes.userId, session.user.id),
      isNull(notes.deletedAt),
    ];

    if (folderId) {
      conditions.push(eq(notes.folderId, folderId));
    }

    if (favorites) {
      conditions.push(eq(notes.isFavorite, true));
    }

    // Fetch notes
    const userNotes = await db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.isPinned), desc(notes.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(and(...conditions));

    // Get tags for all notes in a single batch query (N+1 fix)
    const noteIds = userNotes.map((n) => n.id);
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

    const notesWithTags = userNotes.map((note) => ({
      ...note,
      tags: noteTagsMap.get(note.id) || [],
    }));

    return NextResponse.json({
      notes: notesWithTags,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createNoteSchema.parse(body);

    const noteId = nanoid();
    const now = new Date();

    // Create note
    await db.insert(notes).values({
      id: noteId,
      userId: session.user.id,
      title: data.title,
      content: data.content,
      plainText: data.plainText,
      folderId: data.folderId || null,
      isPinned: data.isPinned,
      isFavorite: data.isFavorite,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    // Add tags if provided
    if (data.tagIds && data.tagIds.length > 0) {
      await db.insert(noteTags).values(
        data.tagIds.map((tagId) => ({
          id: nanoid(),
          noteId,
          tagId,
          createdAt: now,
        }))
      );
    }

    // Fetch and return the created note
    const [newNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId));

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
