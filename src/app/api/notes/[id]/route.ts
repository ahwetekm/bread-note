import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notes, noteTags, tags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const updateNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  plainText: z.string().optional(),
  folderId: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
  version: z.number().optional(),
});

// GET /api/notes/[id] - Get a single note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)));

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Get tags
    const noteTags_ = await db
      .select({ tag: tags })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, note.id));

    return NextResponse.json({
      ...note,
      tags: noteTags_.map((nt) => nt.tag),
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/notes/[id] - Update a note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateNoteSchema.parse(body);

    // Get existing note
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)));

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Version conflict check (optimistic locking)
    if (data.version && data.version !== existingNote.version) {
      return NextResponse.json(
        { error: 'Conflict: Note has been modified', serverVersion: existingNote.version },
        { status: 409 }
      );
    }

    // Update note
    const now = new Date();
    await db
      .update(notes)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.plainText !== undefined && { plainText: data.plainText }),
        ...(data.folderId !== undefined && { folderId: data.folderId }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
        ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
        updatedAt: now,
        version: existingNote.version + 1,
      })
      .where(eq(notes.id, id));

    // Update tags if provided
    if (data.tagIds !== undefined) {
      // Remove existing tags
      await db.delete(noteTags).where(eq(noteTags.noteId, id));

      // Add new tags
      if (data.tagIds.length > 0) {
        await db.insert(noteTags).values(
          data.tagIds.map((tagId) => ({
            id: nanoid(),
            noteId: id,
            tagId,
            createdAt: now,
          }))
        );
      }
    }

    // Fetch and return updated note
    const [updatedNote] = await db.select().from(notes).where(eq(notes.id, id));

    // Get tags
    const noteTags_ = await db
      .select({ tag: tags })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, id));

    return NextResponse.json({
      ...updatedNote,
      tags: noteTags_.map((nt) => nt.tag),
    });
  } catch (error) {
    console.error('Error updating note:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notes/[id] - Soft delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if note exists and belongs to user
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)));

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Soft delete
    await db
      .update(notes)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
