import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { eq, and, gt, lte, isNull, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

const syncRequestSchema = z.object({
  sinceTimestamp: z.number(),
  deviceId: z.string(),
  batchSize: z.number().min(1).max(500).default(100),
});

// POST /api/sync/tags - Delta sync for tags (now supports soft delete)
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

    // Convert tag to response format
    const formatTag = (tag: typeof createdTags[0]) => ({
      id: tag.id,
      userId: tag.userId,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt?.getTime() ?? Date.now(),
      updatedAt: tag.updatedAt?.getTime() ?? Date.now(),
      deletedAt: tag.deletedAt?.getTime() ?? null,
      version: tag.version,
    });

    let createdTags: (typeof tags.$inferSelect)[] = [];
    let updatedTags: (typeof tags.$inferSelect)[] = [];
    let deletedTags: (typeof tags.$inferSelect)[] = [];

    if (sinceTimestamp === 0) {
      // Full sync: Get all non-deleted tags
      createdTags = await db
        .select()
        .from(tags)
        .where(and(eq(tags.userId, userId), isNull(tags.deletedAt)))
        .limit(batchSize);
    } else {
      // Delta sync: Get changes since last sync

      // 1. Created tags (createdAt > sinceTimestamp, not deleted)
      createdTags = await db
        .select()
        .from(tags)
        .where(
          and(
            eq(tags.userId, userId),
            gt(tags.createdAt, sinceDate),
            isNull(tags.deletedAt)
          )
        )
        .limit(batchSize);

      // 2. Updated tags (updatedAt > sinceTimestamp, createdAt <= sinceTimestamp, not deleted)
      updatedTags = await db
        .select()
        .from(tags)
        .where(
          and(
            eq(tags.userId, userId),
            gt(tags.updatedAt, sinceDate),
            lte(tags.createdAt, sinceDate),
            isNull(tags.deletedAt)
          )
        )
        .limit(batchSize);

      // 3. Deleted tags (deletedAt > sinceTimestamp)
      deletedTags = await db
        .select()
        .from(tags)
        .where(
          and(
            eq(tags.userId, userId),
            isNotNull(tags.deletedAt),
            gt(tags.deletedAt, sinceDate)
          )
        )
        .limit(batchSize);
    }

    const serverTimestamp = Date.now();
    const totalItems = createdTags.length + updatedTags.length + deletedTags.length;

    return NextResponse.json({
      created: createdTags.map(formatTag),
      updated: updatedTags.map(formatTag),
      deleted: deletedTags.map(tag => ({
        id: tag.id,
        deletedAt: tag.deletedAt?.getTime() ?? Date.now(),
      })),
      serverTimestamp,
      hasMore: totalItems >= batchSize,
    });
  } catch (error) {
    console.error('Error in tags sync:', error);

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
