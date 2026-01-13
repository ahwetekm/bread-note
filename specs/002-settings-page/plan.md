# Implementation Plan: Ayarlar Sayfası (Settings Page)

**Branch**: `002-settings-page` | **Date**: 2026-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-settings-page/spec.md`

## Summary

Kullanıcıların profil bilgilerini (ad, avatar) düzenleyebildiği, şifre değiştirebildiği, tema tercihini ayarlayabildiği ve hesabını silebildiği kapsamlı bir ayarlar sayfası. Tema tercihi localStorage'da saklanacak, diğer ayarlar mevcut Turso veritabanındaki users tablosunda güncellenecek.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), TanStack Query, Shadcn/UI, Zod
**Storage**: Turso (LibSQL) for user data, localStorage for theme preference
**Testing**: Vitest (unit), Playwright (E2E) - kurulu ancak test yok
**Target Platform**: Web (PWA) - Desktop/Mobile responsive
**Project Type**: Web application (Next.js fullstack)
**Performance Goals**: API responses < 200ms p95, UI interactions < 100ms
**Constraints**: Offline-capable (tema tercihi), bundle size < 200KB
**Scale/Scope**: Single user settings, 4 user stories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-First | PARTIAL | Tema tercihi localStorage'da, şifre/profil değişiklikleri online gerektirir |
| II. Performance | PASS | API endpoint'ler mevcut yapıya uygun, < 200ms hedefi |
| III. UX Excellence | PASS | Loading states, confirmation dialogs, keyboard accessibility planlandı |
| IV. Type Safety | PASS | Zod validations, TypeScript strict mode kullanılacak |
| V. Simplicity | PASS | Mevcut hook/component pattern'leri takip edilecek |

**Offline-First Açıklaması**: Profil ve şifre değişiklikleri doğası gereği sunucu tarafında doğrulanmalıdır (şifre hash kontrolü, email benzersizliği). Bu işlemler offline yapılamaz. Ancak tema tercihi tamamen client-side olarak localStorage'da saklanacaktır.

## Project Structure

### Documentation (this feature)

```text
specs/002-settings-page/
├── plan.md              # This file
├── spec.md              # Feature specification
├── checklist.md         # Quality checklist
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API specs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (main)/
│   │   └── settings/
│   │       └── page.tsx           # Ayarlar sayfası
│   └── api/
│       └── user/
│           ├── route.ts           # GET/PATCH profil
│           ├── password/
│           │   └── route.ts       # POST şifre değiştir
│           └── delete/
│               └── route.ts       # DELETE hesap sil
├── components/
│   └── settings/
│       ├── profile-form.tsx       # Profil düzenleme formu
│       ├── password-form.tsx      # Şifre değiştirme formu
│       ├── theme-selector.tsx     # Tema seçici
│       ├── delete-account-dialog.tsx  # Hesap silme onayı
│       └── settings-tabs.tsx      # Tab navigasyonu
├── lib/
│   ├── hooks/
│   │   └── use-user.ts            # User CRUD hooks
│   ├── validations/
│   │   └── user.ts                # Zod schemas
│   └── theme/
│       └── theme-provider.tsx     # Theme context provider
└── types/
    └── user.ts                    # User types (if needed)
```

**Structure Decision**: Mevcut Next.js App Router yapısı korunacak. API routes `/api/user/` altında, components `/components/settings/` altında organize edilecek. Tema yönetimi için ayrı bir theme provider oluşturulacak.

## Complexity Tracking

> **No violations detected** - Feature follows existing patterns and does not introduce unnecessary complexity.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Theme Storage | localStorage | Server-side DB gerektirmez, anında uygulanır |
| Form Validation | Zod + React Hook Form | Mevcut todo-page pattern'i ile tutarlı |
| Tab Navigation | Radix UI Tabs (Shadcn) | Mevcut UI component library |
| Password Hashing | bcryptjs | Mevcut auth yapısı ile tutarlı |
