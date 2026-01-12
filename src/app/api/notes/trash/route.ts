import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { eq, and, isNotNull, desc } from 'drizzle-orm';

// GET /api/notes/trash - Get all trashed notes
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trashedNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        plainText: notes.plainText,
        deletedAt: notes.deletedAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(
        and(
          eq(notes.userId, session.user.id),
          isNotNull(notes.deletedAt)
        )
      )
      .orderBy(desc(notes.deletedAt));

    return NextResponse.json({ notes: trashedNotes });
  } catch (error) {
    console.error('Error fetching trashed notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notes/trash - Empty trash (permanent delete all)
export async function DELETE(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db
      .delete(notes)
      .where(
        and(
          eq(notes.userId, session.user.id),
          isNotNull(notes.deletedAt)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error emptying trash:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
