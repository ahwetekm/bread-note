import { z } from 'zod';

// ============================================================================
// PROFILE VALIDATION
// ============================================================================

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Ad boş olamaz')
    .max(100, 'Ad en fazla 100 karakter olabilir')
    .trim(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================================================
// PASSWORD CHANGE VALIDATION
// ============================================================================

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
    newPassword: z
      .string()
      .min(8, 'Yeni şifre en az 8 karakter olmalı')
      .max(100, 'Şifre en fazla 100 karakter olabilir')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermeli'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================================================
// DELETE ACCOUNT VALIDATION
// ============================================================================

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Şifre doğrulaması gerekli'),
  confirmation: z.string().refine((val) => val === 'SİL', {
    message: 'Onay için "SİL" yazın',
  }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface UserProfileResponse {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  createdAt: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

export interface DeleteAccountResponse {
  success: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
