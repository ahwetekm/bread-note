# Tasks: To-Do Sayfası

**Input**: Design documents from `/specs/001-todo-page/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, research.md, quickstart.md

**Tests**: Test task'ları dahil edilmedi (spec'te açıkça istenmedi).

**Organization**: Task'lar user story bazında organize edildi, her story bağımsız olarak implement ve test edilebilir.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Paralel çalıştırılabilir (farklı dosyalar, bağımlılık yok)
- **[Story]**: Hangi user story'ye ait (US1, US2, US3, vb.)
- Tüm task'lar tam dosya yolları içerir

## Path Conventions

- **Pages**: `src/app/(main)/todos/`
- **API Routes**: `src/app/api/todos/`
- **Components**: `src/components/todos/`
- **Hooks**: `src/lib/hooks/`
- **Validations**: `src/lib/validations/`

---

## Phase 1: Setup

**Purpose**: Proje dosya yapısını ve temel konfigürasyonu oluştur

- [x] T001 [P] Create todos page directory at src/app/(main)/todos/
- [x] T002 [P] Create todos API route directory at src/app/api/todos/
- [x] T003 [P] Create todos components directory at src/components/todos/
- [x] T004 [P] Create Zod validation schemas in src/lib/validations/todos.ts
- [x] T005 Add todos link to sidebar navigation in src/components/layout/sidebar.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tüm user story'ler için gerekli olan API altyapısı

**⚠️ CRITICAL**: User story çalışması bu faz tamamlanmadan başlayamaz

- [x] T006 Implement GET /api/todos endpoint (list with filters) in src/app/api/todos/route.ts
- [x] T007 Implement POST /api/todos endpoint (create) in src/app/api/todos/route.ts
- [x] T008 Implement GET /api/todos/[id] endpoint in src/app/api/todos/[id]/route.ts
- [x] T009 Implement PATCH /api/todos/[id] endpoint in src/app/api/todos/[id]/route.ts
- [x] T010 Implement DELETE /api/todos/[id] endpoint in src/app/api/todos/[id]/route.ts
- [x] T011 Create TanStack Query hooks in src/lib/hooks/use-todos.ts (useTodos, useTodo, useCreateTodo, useUpdateTodo, useDeleteTodo)

**Checkpoint**: API altyapısı hazır - User story implementasyonu başlayabilir

---

## Phase 3: User Story 1 - To-Do Listesi Görüntüleme (Priority: P1) 🎯 MVP

**Goal**: Kullanıcı tüm görevlerini öncelik sırasına göre listeleyebilir

**Independent Test**: Giriş yaptıktan sonra /todos sayfasına git, görevler listelenmeli

### Implementation for User Story 1

- [x] T012 [US1] Create TodoItem component in src/components/todos/todo-item.tsx (displays title, checkbox, priority badge)
- [x] T013 [US1] Create TodoList component in src/components/todos/todo-list.tsx (renders list of TodoItem)
- [x] T014 [US1] Create EmptyState component in src/components/todos/empty-state.tsx (shows "Henüz görev yok" message)
- [x] T015 [US1] Create todos page in src/app/(main)/todos/page.tsx (uses TodoList, handles loading/error states)
- [x] T016 [US1] Add priority-based sorting logic to TodoList (high → medium → low, completed at bottom)

**Checkpoint**: User Story 1 tamamlandı - Görevler listelenebilir

---

## Phase 4: User Story 2 - Yeni Görev Oluşturma (Priority: P1)

**Goal**: Kullanıcı hızlıca yeni görev ekleyebilir

**Independent Test**: "Yeni Görev" butonuna tıkla, başlık gir, kaydet - görev listeye eklenmeli

### Implementation for User Story 2

- [x] T017 [US2] Create TodoForm component in src/components/todos/todo-form.tsx (title input, priority select, submit button)
- [x] T018 [US2] Add form validation with Zod (title required, max 200 chars) in TodoForm
- [x] T019 [US2] Integrate TodoForm with useCreateTodo mutation in src/app/(main)/todos/page.tsx
- [x] T020 [US2] Add "Yeni Görev" button to todos page that opens TodoForm (use Shadcn Dialog or Sheet)
- [x] T021 [US2] Handle optimistic update - show new todo immediately before server confirms

**Checkpoint**: User Story 2 tamamlandı - Yeni görev eklenebilir

---

## Phase 5: User Story 3 - Görev Tamamlama (Priority: P1)

**Goal**: Kullanıcı görevi tamamlandı olarak işaretleyebilir

**Independent Test**: Görevin yanındaki checkbox'a tıkla - görsel olarak değişmeli

### Implementation for User Story 3

- [x] T022 [US3] Add useToggleComplete hook in src/lib/hooks/use-todos.ts (optimistic update)
- [x] T023 [US3] Implement checkbox toggle in TodoItem component
- [x] T024 [US3] Add completed state styling (strikethrough, opacity) to TodoItem
- [x] T025 [US3] Update completedAt field when toggling completion

**Checkpoint**: User Story 3 tamamlandı - Görevler tamamlanabilir

---

## Phase 6: User Story 4 - Görev Düzenleme ve Silme (Priority: P2)

**Goal**: Kullanıcı mevcut görevi düzenleyebilir veya silebilir

**Independent Test**: Görevin düzenle/sil butonlarına tıkla - işlem gerçekleşmeli

### Implementation for User Story 4

- [x] T026 [P] [US4] Add edit button to TodoItem component
- [x] T027 [P] [US4] Add delete button to TodoItem component
- [x] T028 [US4] Create inline edit mode in TodoItem (click edit → title becomes input)
- [x] T029 [US4] Integrate edit functionality with useUpdateTodo mutation
- [x] T030 [US4] Create DeleteConfirmDialog component in src/components/todos/delete-confirm-dialog.tsx
- [x] T031 [US4] Integrate delete with useDeleteTodo mutation and confirmation dialog

**Checkpoint**: User Story 4 tamamlandı - Görevler düzenlenebilir ve silinebilir

---

## Phase 7: User Story 5 - Görev Önceliklendirme (Priority: P2)

**Goal**: Kullanıcı görevlere öncelik atayabilir

**Independent Test**: Görev oluştururken öncelik seç - görsel olarak vurgulanmalı

### Implementation for User Story 5

- [x] T032 [P] [US5] Create PriorityBadge component in src/components/todos/priority-badge.tsx (color-coded: high=red, medium=yellow, low=green)
- [x] T033 [US5] Add priority selector to TodoForm (dropdown with low/medium/high options)
- [x] T034 [US5] Add priority change capability to edit mode in TodoItem
- [x] T035 [US5] Ensure list sorting respects priority order (already in T016, verify integration)

**Checkpoint**: User Story 5 tamamlandı - Öncelikler atanabilir

---

## Phase 8: User Story 6 - Alt Görevler (Priority: P3)

**Goal**: Kullanıcı bir göreve alt görevler ekleyebilir

**Independent Test**: Görevin altındaki "Alt görev ekle" butonuna tıkla - alt görev eklenmeli

### Implementation for User Story 6

- [x] T036 [P] [US6] Create SubtaskList component in src/components/todos/subtask-list.tsx
- [x] T037 [US6] Add "Alt görev ekle" button to TodoItem (visible on hover/expand)
- [x] T038 [US6] Implement subtask creation with parentId in TodoForm
- [x] T039 [US6] Fetch and display subtasks under parent TodoItem
- [x] T040 [US6] Add progress indicator showing completed/total subtasks count
- [ ] T041 [US6] Implement cascade toggle - when all subtasks complete, show parent as complete

**Checkpoint**: User Story 6 tamamlandı - Alt görevler yönetilebilir

---

## Phase 9: Filtering & Polish

**Purpose**: Filtreleme ve cross-cutting iyileştirmeler

- [x] T042 [P] Create TodoFilters component in src/components/todos/todo-filters.tsx (tabs: Tümü, Aktif, Tamamlanan)
- [x] T043 Integrate TodoFilters with useTodos hook (pass filter param to API)
- [x] T044 Add keyboard accessibility to TodoItem (Enter to toggle, Tab navigation)
- [x] T045 Add loading skeletons during data fetch in TodoList
- [x] T046 Add error boundary and error state handling to todos page
- [x] T047 Ensure responsive design works on mobile (test at 375px width)
- [ ] T048 Run quickstart.md validation - verify all scenarios work

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ─────────────────────────────┐
                                            │
Phase 2: Foundational ◄─────────────────────┘
    │
    ├──► Phase 3: User Story 1 (P1) ──► MVP Ready!
    │
    ├──► Phase 4: User Story 2 (P1)
    │
    ├──► Phase 5: User Story 3 (P1)
    │
    ├──► Phase 6: User Story 4 (P2)
    │
    ├──► Phase 7: User Story 5 (P2)
    │
    └──► Phase 8: User Story 6 (P3)
              │
              ▼
         Phase 9: Polish
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Liste) | Foundational | Phase 2 complete |
| US2 (Oluştur) | Foundational | Phase 2 complete |
| US3 (Tamamla) | US1 (TodoItem) | T012 complete |
| US4 (Düzenle/Sil) | US1 (TodoItem) | T012 complete |
| US5 (Öncelik) | US2 (TodoForm) | T017 complete |
| US6 (Alt Görev) | US1, US2 | T012, T017 complete |

### Within Each User Story

1. Components before integration
2. Core functionality before enhancements
3. Optimistic updates after basic flow works

---

## Parallel Opportunities

### Setup Phase (T001-T005)

```bash
# All can run in parallel:
Task: T001 - Create todos page directory
Task: T002 - Create todos API route directory
Task: T003 - Create todos components directory
Task: T004 - Create Zod validation schemas
```

### User Story 4 (T026-T031)

```bash
# Parallel tasks:
Task: T026 - Add edit button to TodoItem
Task: T027 - Add delete button to TodoItem
```

### User Story 5 (T032-T035)

```bash
# Parallel tasks:
Task: T032 - Create PriorityBadge component
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (API + Hooks)
3. Complete Phase 3: User Story 1 (Liste)
4. **STOP and VALIDATE**: Görevler listeleniyor mu?
5. Complete Phase 4: User Story 2 (Oluştur)
6. Complete Phase 5: User Story 3 (Tamamla)
7. **MVP READY**: Temel görev yönetimi çalışıyor

### Incremental Delivery

| Milestone | Stories Included | Value Delivered |
|-----------|------------------|-----------------|
| MVP | US1, US2, US3 | Görev listeleme, oluşturma, tamamlama |
| v1.1 | + US4, US5 | Düzenleme, silme, öncelik |
| v1.2 | + US6 | Alt görevler |
| v1.3 | + Phase 9 | Filtreleme, polish |

---

## Notes

- [P] tasks = farklı dosyalar, bağımlılık yok
- [USn] label = ilgili user story
- Her user story bağımsız olarak tamamlanabilir ve test edilebilir
- Mevcut `todos` tablosu kullanılıyor, şema değişikliği yok
- Due date ve reminder özellikleri **KAPSAM DIŞI**
- Filtreleme: Sadece durum bazlı (tümü/aktif/tamamlanan)
