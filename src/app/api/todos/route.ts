import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { todos } from '@/lib/db/schema';
import { eq, and, isNull, sql, desc, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createTodoSchema, listTodosQuerySchema } from '@/lib/validations/todos';
import { z } from 'zod';

// GET /api/todos - List all todos with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = listTodosQuerySchema.parse({
      filter: searchParams.get('filter') || 'all',
      noteId: searchParams.get('noteId') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
    });

    // Build where conditions
    const conditions = [
      eq(todos.userId, session.user.id),
      isNull(todos.deletedAt),
      isNull(todos.parentId), // Only top-level todos
    ];

    // Filter by completion status
    if (query.filter === 'active') {
      conditions.push(eq(todos.isCompleted, false));
    } else if (query.filter === 'completed') {
      conditions.push(eq(todos.isCompleted, true));
    }

    // Filter by noteId if provided
    if (query.noteId) {
      conditions.push(eq(todos.noteId, query.noteId));
    }

    // Fetch todos with sorting
    const userTodos = await db
      .select()
      .from(todos)
      .where(and(...conditions))
      .orderBy(
        asc(todos.isCompleted), // Active first
        sql`CASE ${todos.priority} WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END`,
        asc(todos.position),
        desc(todos.createdAt)
      )
      .limit(query.limit)
      .offset(query.offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(todos)
      .where(and(...conditions));

    // Get subtask counts for each todo
    const todosWithSubtasks = await Promise.all(
      userTodos.map(async (todo) => {
        const subtaskCounts = await db
          .select({
            total: sql<number>`count(*)`,
            completed: sql<number>`sum(case when ${todos.isCompleted} = true then 1 else 0 end)`,
          })
          .from(todos)
          .where(and(eq(todos.parentId, todo.id), isNull(todos.deletedAt)));

        return {
          ...todo,
          createdAt: todo.createdAt?.toISOString() || null,
          updatedAt: todo.updatedAt?.toISOString() || null,
          completedAt: todo.completedAt?.toISOString() || null,
          subtaskCount: Number(subtaskCounts[0]?.total || 0),
          completedSubtaskCount: Number(subtaskCounts[0]?.completed || 0),
        };
      })
    );

    return NextResponse.json({
      todos: todosWithSubtasks,
      total: Number(count),
      hasMore: query.offset + query.limit < Number(count),
    });
  } catch (error) {
    console.error('Error fetching todos:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTodoSchema.parse(body);

    // If parentId is provided, verify it exists and belongs to user
    if (data.parentId) {
      const [parentTodo] = await db
        .select()
        .from(todos)
        .where(
          and(
            eq(todos.id, data.parentId),
            eq(todos.userId, session.user.id),
            isNull(todos.deletedAt)
          )
        );

      if (!parentTodo) {
        return NextResponse.json({ error: 'Parent todo not found' }, { status: 404 });
      }

      // Prevent more than 2 levels of nesting
      if (parentTodo.parentId) {
        return NextResponse.json(
          { error: 'Cannot create subtask of a subtask' },
          { status: 400 }
        );
      }
    }

    // If noteId is provided, we trust it exists (foreign key constraint will catch issues)

    const todoId = nanoid();
    const now = new Date();

    // Get max position for ordering
    const [maxPosition] = await db
      .select({ max: sql<number>`max(${todos.position})` })
      .from(todos)
      .where(
        and(
          eq(todos.userId, session.user.id),
          data.parentId ? eq(todos.parentId, data.parentId) : isNull(todos.parentId)
        )
      );

    const position = (maxPosition?.max ?? -1) + 1;

    // Create todo
    await db.insert(todos).values({
      id: todoId,
      userId: session.user.id,
      title: data.title,
      priority: data.priority,
      noteId: data.noteId || null,
      parentId: data.parentId || null,
      isCompleted: false,
      position,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    // Fetch and return the created todo
    const [newTodo] = await db.select().from(todos).where(eq(todos.id, todoId));

    return NextResponse.json(
      {
        ...newTodo,
        createdAt: newTodo.createdAt?.toISOString() || null,
        updatedAt: newTodo.updatedAt?.toISOString() || null,
        completedAt: newTodo.completedAt?.toISOString() || null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating todo:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0].message,
            details: {
              field: error.errors[0].path.join('.'),
              constraint: error.errors[0].code,
            },
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
