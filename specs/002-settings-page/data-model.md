# Data Model: Ayarlar Sayfası

**Feature**: 002-settings-page
**Date**: 2026-01-13

## Entities

### User (Mevcut - Değişiklik Yok)

Mevcut `users` tablosu ayarlar sayfası için yeterli. Yeni alan eklenmesine gerek yok.

```typescript
// src/lib/db/schema.ts (MEVCUT)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password').notNull(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  verificationToken: text('verification_token'),
  resetToken: text('reset_token'),
  resetTokenExpiry: integer('reset_token_expiry', { mode: 'timestamp' }),
  avatar: text('avatar'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
```

**Ayarlar sayfasında kullanılacak alanlar:**
| Alan | İşlem | Açıklama |
|------|-------|----------|
| name | READ/WRITE | Profil adı |
| email | READ | Salt okunur görüntüleme |
| avatar | READ | Salt okunur (bu fazda) |
| password | WRITE | Hash ile karşılaştırma/güncelleme |
| createdAt | READ | Hesap oluşturma tarihi |

### UserPreferences (Client-Side - localStorage)

Tema tercihi sunucu tarafında saklanmayacak. localStorage'da basit bir key-value olarak tutulacak.

```typescript
// localStorage key: 'bread-note-theme'
// Değerler: 'light' | 'dark' | 'system'

interface ThemePreference {
  theme: 'light' | 'dark' | 'system';
}
```

**Neden localStorage?**
- Anında uygulama (sayfa yenileme gerektirmez)
- Offline çalışır
- DB migration gerektirmez
- Constitution I (Offline-First) ilkesine uygun

## Validation Rules

### Profil Güncelleme

```typescript
// src/lib/validations/user.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Ad boş olamaz')
    .max(100, 'Ad en fazla 100 karakter olabilir')
    .trim(),
});
```

### Şifre Değiştirme

```typescript
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Mevcut şifre gerekli'),
  newPassword: z
    .string()
    .min(8, 'Yeni şifre en az 8 karakter olmalı')
    .max(100, 'Şifre en fazla 100 karakter olabilir')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermeli'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});
```

### Hesap Silme

```typescript
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Şifre doğrulaması gerekli'),
  confirmation: z.literal('SİL', {
    errorMap: () => ({ message: 'Onay için "SİL" yazın' }),
  }),
});
```

## State Transitions

### Tema Değişikliği

```
[light] ←→ [dark] ←→ [system]
     ↑_______________↑

Geçişler:
- Herhangi bir temadan diğerine anında geçilebilir
- localStorage güncellenir
- document.documentElement.classList güncellenir
```

### Hesap Silme

```
[Aktif Hesap] → [Silme Onayı Bekliyor] → [Silinmiş]
                         ↓
                    [İptal Edildi]

Silme sonrası:
- Session invalidate
- Login sayfasına yönlendirme
- Tüm cascade bağlantılar otomatik silinir
```

## Relationships

```
users (1) ────────── (n) notes
      │
      ├──────────── (n) folders
      │
      ├──────────── (n) tags
      │
      ├──────────── (n) todos
      │
      ├──────────── (n) shares
      │
      ├──────────── (n) notifications
      │
      └──────────── (n) syncMetadata

* Tüm ilişkiler onDelete: 'cascade' ile tanımlı
* users silindiğinde tüm ilişkili veriler otomatik silinir
```

## Migration Requirements

**Yeni migration gerekmiyor.** Mevcut schema tüm gereksinimleri karşılıyor.

## Type Definitions

```typescript
// src/lib/validations/user.ts

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// API Response Types
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
```
