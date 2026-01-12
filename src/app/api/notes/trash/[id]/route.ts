import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notes, noteTags } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

// POST /api/notes/trash/[id] - Restore a note from trash
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if note exists in trash
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, session.user.id),
          isNotNull(notes.deletedAt)
        )
      );

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found in trash' }, { status: 404 });
    }

    // Restore note (remove deletedAt)
    await db
      .update(notes)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error restoring note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notes/trash/[id] - Permanently delete a note
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

    // Check if note exists in trash
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, session.user.id),
          isNotNull(notes.deletedAt)
        )
      );

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found in trash' }, { status: 404 });
    }

    // Delete related noteTags first
    await db.delete(noteTags).where(eq(noteTags.noteId, id));

    // Permanently delete the note
    await db.delete(notes).where(eq(notes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
