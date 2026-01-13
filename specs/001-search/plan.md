# Implementation Plan: Not Arama Özelliği

**Branch**: `001-search` | **Date**: 2026-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-search/spec.md`

## Summary

Bu özellik, header'daki mevcut arama kutusuna işlevsellik kazandıracak. Kullanıcılar notlarını başlık ve içerik üzerinden arayabilecek, sonuçlar anlık olarak güncellenecek ve klavye kısayolu (Ctrl+K) ile hızlı erişim sağlanacak. SQLite LIKE operatörü kullanılarak büyük/küçük harf duyarsız arama yapılacak.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), TanStack Query 5, Shadcn/UI, Tailwind CSS, Zod
**Storage**: Turso (LibSQL) + IndexedDB (Dexie.js) - `notes` tablosu (`title`, `plainText` alanları)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web (PWA), responsive (mobile/tablet/desktop)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Arama sonuçları < 200ms, debounce ile API çağrısı optimizasyonu
**Constraints**: Offline-first tasarım prensibi, < 200KB bundle size
**Scale/Scope**: Tipik kullanıcı başına 100-1000 not

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-First | ✅ PASS | Arama önce IndexedDB'de yapılabilir, sonra Turso ile senkronize edilebilir (P2 iterasyon) |
| II. Performance | ✅ PASS | Debounce ile API çağrıları optimize edilecek, < 200ms hedefi |
| III. UX Excellence | ✅ PASS | Klavye erişilebilirlik (Ctrl+K, arrow keys, Enter), loading states |
| IV. Type Safety | ✅ PASS | Zod schema ile API validasyonu, TypeScript strict mode |
| V. Simplicity | ✅ PASS | Mevcut API pattern'i (notes route) genişletilecek, yeni abstraction yok |

**Gate Result**: PASS - Tüm prensipler karşılandı, Phase 0'a geçilebilir.

## Project Structure

### Documentation (this feature)

```text
specs/001-search/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── search-api.yaml  # OpenAPI spec
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── search/
│           └── route.ts         # GET /api/search?q=...
├── components/
│   ├── layout/
│   │   └── header.tsx           # Güncellenecek - arama işlevselliği
│   └── search/
│       ├── search-input.tsx     # Arama input component
│       ├── search-results.tsx   # Dropdown sonuç listesi
│       └── search-highlight.tsx # Vurgulama utility
└── lib/
    └── hooks/
        └── use-search.ts        # TanStack Query hook
```

**Structure Decision**: Mevcut Next.js App Router yapısı korunacak. Arama için yeni `/api/search` route ve `src/components/search/` dizini eklenecek.

## Complexity Tracking

> No violations - all complexity gates passed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| - | - | - |
