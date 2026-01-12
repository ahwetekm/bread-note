import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { folders, notes } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';

const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  position: z.number().optional(),
  version: z.number().optional(),
});

// GET /api/folders/[id] - Get a folder with its notes
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

    const [folder] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, session.user.id),
          isNull(folders.deletedAt)
        )
      );

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Get notes in this folder
    const folderNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        plainText: notes.plainText,
        isPinned: notes.isPinned,
        isFavorite: notes.isFavorite,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(
        and(
          eq(notes.folderId, id),
          eq(notes.userId, session.user.id),
          isNull(notes.deletedAt)
        )
      )
      .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

    // Get subfolders
    const subfolders = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.parentId, id),
          eq(folders.userId, session.user.id),
          isNull(folders.deletedAt)
        )
      );

    return NextResponse.json({
      ...folder,
      notes: folderNotes,
      subfolders,
    });
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/folders/[id] - Update a folder
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
    const data = updateFolderSchema.parse(body);

    // Get existing folder
    const [existingFolder] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, session.user.id),
          isNull(folders.deletedAt)
        )
      );

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Version conflict check
    if (data.version && data.version !== existingFolder.version) {
      return NextResponse.json(
        { error: 'Conflict: Folder has been modified', serverVersion: existingFolder.version },
        { status: 409 }
      );
    }

    // Prevent setting folder as its own parent
    if (data.parentId === id) {
      return NextResponse.json(
        { error: 'A folder cannot be its own parent' },
        { status: 400 }
      );
    }

    // Update folder
    await db
      .update(folders)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.position !== undefined && { position: data.position }),
        updatedAt: new Date(),
        version: existingFolder.version + 1,
      })
      .where(eq(folders.id, id));

    const [updatedFolder] = await db.select().from(folders).where(eq(folders.id, id));

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/folders/[id] - Delete a folder (soft delete)
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

    // Check if folder exists
    const [existingFolder] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, session.user.id),
          isNull(folders.deletedAt)
        )
      );

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const now = new Date();

    // Move notes in this folder to no folder
    await db
      .update(notes)
      .set({ folderId: null, updatedAt: now })
      .where(eq(notes.folderId, id));

    // Move subfolders to parent folder
    await db
      .update(folders)
      .set({ parentId: existingFolder.parentId, updatedAt: now })
      .where(eq(folders.parentId, id));

    // Soft delete the folder
    await db
      .update(folders)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(folders.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
