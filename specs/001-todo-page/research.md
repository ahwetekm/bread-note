# Research: To-Do Sayfası

**Feature**: 001-todo-page
**Date**: 2025-01-13

## Executive Summary

To-Do sayfası için gerekli tüm altyapı mevcut projede zaten var. Veritabanı şeması (`todos` tablosu), IndexedDB yapısı ve temel pattern'ler kullanıma hazır. Yeni teknoloji veya bağımlılık eklenmesine gerek yok.

---

## Research Tasks

### 1. Mevcut Veritabanı Şeması Analizi

**Decision**: Mevcut `todos` tablosu kullanılacak

**Rationale**:
- Tablo tüm gerekli alanları içeriyor: `id`, `userId`, `noteId`, `parentId`, `title`, `isCompleted`, `priority`, `position`
- Alt görev desteği `parentId` self-reference ile mevcut
- Not bağlantısı `noteId` ile opsiyonel olarak destekleniyor (hibrit model)
- Soft delete için `deletedAt` alanı var
- Optimistic locking için `version` alanı mevcut

**Alternatives Considered**:
- Yeni tablo oluşturma → Gereksiz, mevcut tablo yeterli
- Tablo genişletme → Gerek yok, tüm alanlar mevcut

**Mevcut Şema**:
```typescript
todos = {
  id: text (PK),
  userId: text (FK → users),
  noteId: text? (FK → notes, opsiyonel),
  parentId: text? (self-reference, alt görevler için),
  title: text,
  description: text?,
  isCompleted: boolean (default: false),
  priority: enum ['low', 'medium', 'high'] (default: 'medium'),
  position: integer (sıralama için),
  dueDate: timestamp? (KAPSAM DIŞI),
  reminderAt: timestamp? (KAPSAM DIŞI),
  completedAt: timestamp?,
  createdAt, updatedAt, deletedAt, version
}
```

---

### 2. Mevcut API Pattern Analizi

**Decision**: Notes API pattern'i takip edilecek

**Rationale**:
- `/api/notes` route yapısı referans alınacak
- TanStack Query hooks pattern'i (`use-notes.ts`) kopyalanacak
- Zod validasyon şemaları tutarlı olacak

**Best Practices (Projeden)**:
```typescript
// Route pattern
/api/todos          → GET (list), POST (create)
/api/todos/[id]     → GET, PATCH, DELETE

// Query hooks pattern
useTodos(filter)     → Liste çekme
useTodo(id)          → Tekil görev
useCreateTodo()      → Mutation
useUpdateTodo()      → Mutation
useDeleteTodo()      → Mutation
useToggleComplete()  → Optimistic update
```

---

### 3. UI Component Pattern Analizi

**Decision**: Mevcut Shadcn/UI + Tailwind pattern'leri kullanılacak

**Rationale**:
- `note-card.tsx` ve `note-list.tsx` referans alınacak
- Checkbox komponenti Shadcn/UI'dan gelecek
- Dialog/Sheet kullanımı mevcut pattern'lerle tutarlı olacak

**Component Hierarchy**:
```
TodoPage
├── TodoFilters (tümü/aktif/tamamlanan)
├── TodoForm (yeni görev ekleme)
└── TodoList
    └── TodoItem (tekrarlanır)
        ├── Checkbox (tamamlama toggle)
        ├── PriorityBadge
        ├── EditButton
        ├── DeleteButton
        └── SubtaskList (nested, P3)
            └── TodoItem (recursive)
```

---

### 4. Offline-First Sync Stratejisi

**Decision**: Mevcut IndexedDB + sync queue pattern'i kullanılacak

**Rationale**:
- `src/lib/indexeddb/` yapısı mevcut
- Dexie.js şeması `todos` tablosunu içeriyor
- Sync engine henüz implement edilmemiş ama şema hazır

**Implementation Notes**:
- CRUD işlemleri önce IndexedDB'ye yazılacak
- `syncQueue` tablosuna operasyon eklenecek
- Online olunca queue işlenecek (mevcut pattern)

---

### 5. Performans Optimizasyonu

**Decision**: Virtual scrolling şimdilik gerekli değil

**Rationale**:
- Sayfalama (pagination) yeterli performans sağlayacak
- 100 görev hedefi için standart liste yeterli
- React.memo ile gereksiz re-render önlenecek

**Optimizations**:
- `useMemo` ile filtrelenmiş liste cache'lenecek
- Optimistic updates ile UI anında güncellenecek
- TanStack Query cache'i kullanılacak

---

## Key Decisions Summary

| Konu | Karar | Gerekçe |
|------|-------|---------|
| Veritabanı | Mevcut `todos` tablosu | Tüm alanlar mevcut |
| API Pattern | Notes API takip | Tutarlılık |
| UI Framework | Shadcn/UI + Tailwind | Proje standardı |
| State Management | TanStack Query | Mevcut setup |
| Offline Storage | IndexedDB (Dexie) | Constitution uyumu |
| Due Date | Kapsam dışı | Clarification kararı |
| Filtreleme | Durum bazlı (3 tab) | Clarification kararı |

---

## Risks & Mitigations

| Risk | Olasılık | Etki | Azaltma |
|------|----------|------|---------|
| Sync engine eksik | Orta | Orta | MVP'de local-only, sync sonra |
| Alt görev karmaşıklığı | Düşük | Düşük | P3 olarak ertelendi |
| Performance (çok görev) | Düşük | Orta | Pagination + lazy loading |

---

## Next Steps

1. ✅ Research tamamlandı
2. → Phase 1: Data model ve API contracts oluştur
3. → Phase 1: Quickstart guide yaz
4. → Agent context güncelle
