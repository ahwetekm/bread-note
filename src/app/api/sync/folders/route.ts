import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { folders } from '@/lib/db/schema';
import { eq, and, gt, lte, isNull, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

const syncRequestSchema = z.object({
  sinceTimestamp: z.number(),
  deviceId: z.string(),
  batchSize: z.number().min(1).max(500).default(100),
});

// POST /api/sync/folders - Delta sync for folders
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

    // Get created folders (createdAt > sinceTimestamp AND not deleted)
    const createdFolders = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.userId, userId),
          gt(folders.createdAt, sinceDate),
          isNull(folders.deletedAt)
        )
      )
      .limit(batchSize);

    // Get updated folders (updatedAt > sinceTimestamp AND createdAt <= sinceTimestamp AND not deleted)
    const updatedFolders = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.userId, userId),
          gt(folders.updatedAt, sinceDate),
          lte(folders.createdAt, sinceDate),
          isNull(folders.deletedAt)
        )
      )
      .limit(batchSize);

    // Get deleted folders (deletedAt > sinceTimestamp)
    const deletedFolders = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(
          eq(folders.userId, userId),
          isNotNull(folders.deletedAt),
          gt(folders.deletedAt, sinceDate)
        )
      )
      .limit(batchSize);

    // Convert timestamps to numbers
    const formatFolder = (folder: typeof createdFolders[0]) => ({
      ...folder,
      createdAt: folder.createdAt?.getTime() ?? Date.now(),
      updatedAt: folder.updatedAt?.getTime() ?? Date.now(),
      deletedAt: folder.deletedAt?.getTime() ?? null,
    });

    const serverTimestamp = Date.now();
    const totalCount = createdFolders.length + updatedFolders.length + deletedFolders.length;

    return NextResponse.json({
      created: createdFolders.map(formatFolder),
      updated: updatedFolders.map(formatFolder),
      deleted: deletedFolders.map((f) => f.id),
      serverTimestamp,
      hasMore: totalCount >= batchSize,
    });
  } catch (error) {
    console.error('Error in folders sync:', error);

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
