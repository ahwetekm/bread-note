import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { todos } from '@/lib/db/schema';
import { eq, and, gt, lte, isNull, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

const syncRequestSchema = z.object({
  sinceTimestamp: z.number(),
  deviceId: z.string(),
  batchSize: z.number().min(1).max(500).default(100),
});

// POST /api/sync/todos - Delta sync for todos
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

    // Get created todos (createdAt > sinceTimestamp AND not deleted)
    const createdTodos = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.userId, userId),
          gt(todos.createdAt, sinceDate),
          isNull(todos.deletedAt)
        )
      )
      .limit(batchSize);

    // Get updated todos (updatedAt > sinceTimestamp AND createdAt <= sinceTimestamp AND not deleted)
    const updatedTodos = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.userId, userId),
          gt(todos.updatedAt, sinceDate),
          lte(todos.createdAt, sinceDate),
          isNull(todos.deletedAt)
        )
      )
      .limit(batchSize);

    // Get deleted todos (deletedAt > sinceTimestamp)
    const deletedTodos = await db
      .select({ id: todos.id })
      .from(todos)
      .where(
        and(
          eq(todos.userId, userId),
          isNotNull(todos.deletedAt),
          gt(todos.deletedAt, sinceDate)
        )
      )
      .limit(batchSize);

    // Convert timestamps to numbers
    const formatTodo = (todo: typeof createdTodos[0]) => ({
      ...todo,
      createdAt: todo.createdAt?.getTime() ?? Date.now(),
      updatedAt: todo.updatedAt?.getTime() ?? Date.now(),
      deletedAt: todo.deletedAt?.getTime() ?? null,
      completedAt: todo.completedAt?.getTime() ?? null,
      dueDate: todo.dueDate?.getTime() ?? null,
      reminderAt: todo.reminderAt?.getTime() ?? null,
    });

    const serverTimestamp = Date.now();
    const totalCount = createdTodos.length + updatedTodos.length + deletedTodos.length;

    return NextResponse.json({
      created: createdTodos.map(formatTodo),
      updated: updatedTodos.map(formatTodo),
      deleted: deletedTodos.map((t) => t.id),
      serverTimestamp,
      hasMore: totalCount >= batchSize,
    });
  } catch (error) {
    console.error('Error in todos sync:', error);

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
