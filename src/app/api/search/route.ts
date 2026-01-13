import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { eq, and, isNull, or, sql, desc } from 'drizzle-orm';
import { z } from 'zod';

// Zod validation schema for search query parameters
const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters').max(100, 'Search query must be at most 100 characters'),
  limit: z.coerce.number().min(1).max(50).default(10),
});

// GET /api/search - Search notes
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || '10',
    };

    // Validate query parameters
    const validationResult = searchQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { q, limit } = validationResult.data;

    // Escape special characters for LIKE query
    const escapedQuery = q.replace(/[%_\\]/g, '\\$&');
    const likePattern = `%${escapedQuery}%`;

    // Search notes with case-insensitive LIKE
    const searchResults = await db
      .select({
        id: notes.id,
        title: notes.title,
        plainText: notes.plainText,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(
        and(
          eq(notes.userId, session.user.id),
          isNull(notes.deletedAt),
          or(
            sql`LOWER(${notes.title}) LIKE LOWER(${likePattern})`,
            sql`LOWER(${notes.plainText}) LIKE LOWER(${likePattern})`
          )
        )
      )
      .orderBy(desc(notes.updatedAt))
      .limit(limit);

    // Transform results to SearchResponse format
    const results = searchResults.map((note) => {
      const titleMatch = note.title.toLowerCase().includes(q.toLowerCase());
      const contentMatch = note.plainText.toLowerCase().includes(q.toLowerCase());

      let matchType: 'title' | 'content' | 'both';
      if (titleMatch && contentMatch) {
        matchType = 'both';
      } else if (titleMatch) {
        matchType = 'title';
      } else {
        matchType = 'content';
      }

      // Create preview from plainText (first 150 characters)
      const preview = note.plainText.length > 150
        ? note.plainText.substring(0, 150) + '...'
        : note.plainText;

      return {
        id: note.id,
        title: note.title,
        preview,
        matchType,
        updatedAt: note.updatedAt,
      };
    });

    // Get total count for the query
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(
        and(
          eq(notes.userId, session.user.id),
          isNull(notes.deletedAt),
          or(
            sql`LOWER(${notes.title}) LIKE LOWER(${likePattern})`,
            sql`LOWER(${notes.plainText}) LIKE LOWER(${likePattern})`
          )
        )
      );

    return NextResponse.json({
      results,
      total: Number(count),
      query: q,
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
