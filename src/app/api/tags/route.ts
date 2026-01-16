import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tags, noteTags, notes } from '@/lib/db/schema';
import { eq, and, asc, sql, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// GET /api/tags - Get all tags with note count
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tags with note count (exclude soft deleted tags)
    const userTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
        version: tags.version,
        noteCount: sql<number>`count(${noteTags.id})`.as('note_count'),
      })
      .from(tags)
      .leftJoin(noteTags, eq(tags.id, noteTags.tagId))
      .leftJoin(notes, and(eq(noteTags.noteId, notes.id), isNull(notes.deletedAt)))
      .where(and(eq(tags.userId, session.user.id), isNull(tags.deletedAt)))
      .groupBy(tags.id)
      .orderBy(asc(tags.name));

    return NextResponse.json({ tags: userTags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTagSchema.parse(body);

    // Check if tag with same name exists
    const existingTag = await db
      .select()
      .from(tags)
      .where(
        and(
          eq(tags.userId, session.user.id),
          eq(tags.name, data.name)
        )
      );

    if (existingTag.length > 0) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 400 }
      );
    }

    const now = new Date();
    const id = nanoid();

    await db.insert(tags).values({
      id,
      userId: session.user.id,
      name: data.name,
      color: data.color || null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    const [newTag] = await db.select().from(tags).where(eq(tags.id, id));

    return NextResponse.json({ ...newTag, noteCount: 0 }, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
