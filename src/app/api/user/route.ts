import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateProfileSchema } from '@/lib/validations/user';
import type { UserProfileResponse, ApiErrorResponse } from '@/lib/validations/user';
import { z } from 'zod';

// GET /api/user - Get current user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Oturum açmanız gerekiyor',
          },
        },
        { status: 401 }
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Kullanıcı bulunamadı',
          },
        },
        { status: 404 }
      );
    }

    const response: UserProfileResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Bir hata oluştu, lütfen tekrar deneyin',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/user - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Oturum açmanız gerekiyor',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const now = new Date();

    await db
      .update(users)
      .set({
        name: data.name,
        updatedAt: now,
      })
      .where(eq(users.id, session.user.id));

    // Fetch updated user
    const [updatedUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    const response: UserProfileResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user profile:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0].message,
            details: {
              field: error.errors[0].path.join('.'),
            },
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Bir hata oluştu, lütfen tekrar deneyin',
        },
      },
      { status: 500 }
    );
  }
}
