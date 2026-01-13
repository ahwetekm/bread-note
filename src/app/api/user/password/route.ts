import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { changePasswordSchema } from '@/lib/validations/user';
import type { PasswordChangeResponse, ApiErrorResponse } from '@/lib/validations/user';
import { z } from 'zod';

// POST /api/user/password - Change user password
export async function POST(request: NextRequest) {
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
    const data = changePasswordSchema.parse(body);

    // Get current user with password
    const [user] = await db
      .select({
        id: users.id,
        password: users.password,
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

    // Verify current password
    const isValidPassword = await compare(data.currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Mevcut şifre hatalı',
          },
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(data.newPassword, 10);
    const now = new Date();

    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: now,
      })
      .where(eq(users.id, session.user.id));

    const response: PasswordChangeResponse = {
      success: true,
      message: 'Şifre başarıyla değiştirildi',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error changing password:', error);

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
