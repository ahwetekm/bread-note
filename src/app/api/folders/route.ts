import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { folders } from '@/lib/db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().nullable().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

// GET /api/folders - Get all folders
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userFolders = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.userId, session.user.id),
          isNull(folders.deletedAt)
        )
      )
      .orderBy(asc(folders.position), asc(folders.name));

    return NextResponse.json({ folders: userFolders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createFolderSchema.parse(body);

    // Get max position for ordering
    const existingFolders = await db
      .select({ position: folders.position })
      .from(folders)
      .where(
        and(
          eq(folders.userId, session.user.id),
          isNull(folders.deletedAt)
        )
      );

    const maxPosition = existingFolders.reduce(
      (max, f) => Math.max(max, f.position || 0),
      0
    );

    const now = new Date();
    const id = nanoid();

    await db.insert(folders).values({
      id,
      userId: session.user.id,
      name: data.name,
      parentId: data.parentId || null,
      color: data.color || null,
      icon: data.icon || null,
      position: maxPosition + 1,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    const [newFolder] = await db.select().from(folders).where(eq(folders.id, id));

    return NextResponse.json(newFolder, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
