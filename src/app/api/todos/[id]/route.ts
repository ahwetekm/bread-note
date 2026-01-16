import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { todos } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { updateTodoSchema } from '@/lib/validations/todos';
import { z } from 'zod';

// GET /api/todos/[id] - Get a single todo with subtasks
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

    const [todo] = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.id, id),
          eq(todos.userId, session.user.id),
          isNull(todos.deletedAt)
        )
      );

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Get subtasks
    const subtasks = await db
      .select()
      .from(todos)
      .where(and(eq(todos.parentId, id), isNull(todos.deletedAt)))
      .orderBy(todos.position, todos.createdAt);

    return NextResponse.json({
      ...todo,
      createdAt: todo.createdAt?.toISOString() || null,
      updatedAt: todo.updatedAt?.toISOString() || null,
      completedAt: todo.completedAt?.toISOString() || null,
      subtasks: subtasks.map((s) => ({
        ...s,
        createdAt: s.createdAt?.toISOString() || null,
        updatedAt: s.updatedAt?.toISOString() || null,
        completedAt: s.completedAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/todos/[id] - Update a todo
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
    const data = updateTodoSchema.parse(body);

    // Get existing todo
    const [existingTodo] = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.id, id),
          eq(todos.userId, session.user.id),
          isNull(todos.deletedAt)
        )
      );

    if (!existingTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Version conflict check for optimistic locking
    if (data.version !== undefined && data.version !== existingTodo.version) {
      return NextResponse.json(
        {
          error: {
            code: 'VERSION_CONFLICT',
            message: 'This todo has been modified by another session. Please refresh and try again.',
            details: {
              currentVersion: existingTodo.version,
              requestedVersion: data.version,
            },
          },
        },
        { status: 409 }
      );
    }

    // Update todo
    const now = new Date();
    const updateData: Record<string, unknown> = {
      updatedAt: now,
      version: existingTodo.version + 1,
    };

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.position !== undefined) {
      updateData.position = data.position;
    }

    if (data.isCompleted !== undefined) {
      updateData.isCompleted = data.isCompleted;
      updateData.completedAt = data.isCompleted ? now : null;
    }

    await db.update(todos).set(updateData).where(eq(todos.id, id));

    // Fetch and return updated todo
    const [updatedTodo] = await db.select().from(todos).where(eq(todos.id, id));

    return NextResponse.json({
      ...updatedTodo,
      createdAt: updatedTodo.createdAt?.toISOString() || null,
      updatedAt: updatedTodo.updatedAt?.toISOString() || null,
      completedAt: updatedTodo.completedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error updating todo:', error);

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

// DELETE /api/todos/[id] - Soft delete a todo
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

    // Check if todo exists and belongs to user
    const [existingTodo] = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.id, id),
          eq(todos.userId, session.user.id),
          isNull(todos.deletedAt)
        )
      );

    if (!existingTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const now = new Date();

    // Soft delete the todo and its subtasks
    await db
      .update(todos)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(todos.id, id));

    // Also soft delete subtasks
    await db
      .update(todos)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(todos.parentId, id));

    return NextResponse.json({
      success: true,
      message: 'Görev çöp kutusuna taşındı',
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
