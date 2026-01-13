# Implementation Plan: To-Do Sayfası

**Branch**: `001-todo-page` | **Date**: 2025-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-todo-page/spec.md`

## Summary

Kullanıcıların görevlerini yönetebileceği bağımsız bir To-Do sayfası oluşturulacak. Mevcut `todos` veritabanı tablosu kullanılarak CRUD işlemleri, önceliklendirme, alt görevler ve durum filtreleme özellikleri implement edilecek. Görevler opsiyonel olarak notlara bağlanabilecek (hibrit model).

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), TanStack Query, Zustand, Shadcn/UI, Tailwind CSS
**Storage**: Turso (LibSQL) + IndexedDB (Dexie.js) - Offline-first architecture
**Testing**: Vitest (unit), Playwright (E2E) - kurulu ama testler yazılmamış
**Target Platform**: Web (PWA) - Desktop ve Mobile responsive
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: LCP < 2.5s, FID < 100ms, 100 görev ile sayfa yüklemesi < 2s
**Constraints**: Offline-capable, API yanıtları < 200ms p95, bundle < 200KB gzipped
**Scale/Scope**: Tek kullanıcı için binlerce görev desteklenmeli

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-First Architecture | ✅ PASS | IndexedDB'ye önce yazılacak, Turso'ya sync edilecek |
| II. Performance & Responsiveness | ✅ PASS | LCP < 2.5s, FID < 100ms hedefleri spec'te tanımlı |
| III. User Experience Excellence | ✅ PASS | Keyboard erişilebilirlik, responsive, silme onayı var |
| IV. Type Safety & Code Quality | ✅ PASS | TypeScript strict, Zod validasyon, Drizzle ORM |
| V. Simplicity & Maintainability | ✅ PASS | Mevcut pattern'ler takip edilecek, yeni abstraction yok |

**Gate Status**: ✅ ALL PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API specs)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (main)/
│   │   └── todos/
│   │       └── page.tsx          # To-Do sayfası
│   └── api/
│       └── todos/
│           ├── route.ts          # GET (list), POST (create)
│           └── [id]/
│               └── route.ts      # GET, PATCH, DELETE
├── components/
│   └── todos/
│       ├── todo-list.tsx         # Ana liste komponenti
│       ├── todo-item.tsx         # Tek görev komponenti
│       ├── todo-form.tsx         # Oluşturma/düzenleme formu
│       ├── todo-filters.tsx      # Durum filtreleri
│       └── subtask-list.tsx      # Alt görev listesi
├── lib/
│   ├── hooks/
│   │   └── use-todos.ts          # TanStack Query hooks
│   └── indexeddb/
│       └── todos.ts              # Dexie operations (mevcut şemaya ek)
```

**Structure Decision**: Mevcut Next.js App Router yapısı takip ediliyor. `todos` dizini `(main)` route group altında, API routes `/api/todos` altında olacak.

## Complexity Tracking

> **No violations detected** - Constitution Check passed without exceptions.
