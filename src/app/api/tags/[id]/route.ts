import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tags, noteTags, notes } from '@/lib/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { z } from 'zod';

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  version: z.number().optional(), // For optimistic locking
});

// GET /api/tags/[id] - Get a tag with its notes
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

    const [tag] = await db
      .select()
      .from(tags)
      .where(
        and(
          eq(tags.id, id),
          eq(tags.userId, session.user.id)
        )
      );

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Get notes with this tag
    const tagNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        plainText: notes.plainText,
        isPinned: notes.isPinned,
        isFavorite: notes.isFavorite,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
      .where(
        and(
          eq(noteTags.tagId, id),
          eq(notes.userId, session.user.id),
          isNull(notes.deletedAt)
        )
      )
      .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

    return NextResponse.json({
      ...tag,
      notes: tagNotes,
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/tags/[id] - Update a tag
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
    const data = updateTagSchema.parse(body);

    // Get existing tag (exclude soft deleted)
    const [existingTag] = await db
      .select()
      .from(tags)
      .where(
        and(
          eq(tags.id, id),
          eq(tags.userId, session.user.id),
          isNull(tags.deletedAt)
        )
      );

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Version conflict check (optimistic locking)
    if (data.version !== undefined && data.version !== existingTag.version) {
      return NextResponse.json(
        {
          error: 'Version conflict: Tag has been modified',
          serverVersion: existingTag.version
        },
        { status: 409 }
      );
    }

    // Check if another tag with the same name exists
    if (data.name && data.name !== existingTag.name) {
      const duplicateTag = await db
        .select()
        .from(tags)
        .where(
          and(
            eq(tags.userId, session.user.id),
            eq(tags.name, data.name),
            isNull(tags.deletedAt)
          )
        );

      if (duplicateTag.length > 0) {
        return NextResponse.json(
          { error: 'Tag with this name already exists' },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    // Update tag with updatedAt and version increment
    await db
      .update(tags)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        updatedAt: now,
        version: existingTag.version + 1,
      })
      .where(eq(tags.id, id));

    const [updatedTag] = await db.select().from(tags).where(eq(tags.id, id));

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tags/[id] - Soft delete a tag
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

    // Check if tag exists and is not already deleted
    const [existingTag] = await db
      .select()
      .from(tags)
      .where(
        and(
          eq(tags.id, id),
          eq(tags.userId, session.user.id),
          isNull(tags.deletedAt)
        )
      );

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const now = new Date();

    // Soft delete: Set deletedAt instead of hard delete
    await db
      .update(tags)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: existingTag.version + 1,
      })
      .where(eq(tags.id, id));

    // Delete related noteTags (hard delete since they're junction records)
    await db.delete(noteTags).where(eq(noteTags.tagId, id));

    return NextResponse.json({ success: true, deletedAt: now.toISOString() });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
