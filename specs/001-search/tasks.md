# Tasks: Not Arama Özelliği

**Input**: Design documents from `/specs/001-search/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/search-api.yaml

**Tests**: Test tasks are NOT included (not explicitly requested in spec).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Type**: Next.js App Router (single project)
- **Source**: `src/` at repository root
- **Components**: `src/components/`
- **API Routes**: `src/app/api/`
- **Hooks**: `src/lib/hooks/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and type definitions for search feature

- [x] T001 Create search components directory at `src/components/search/`
- [x] T002 [P] Create TypeScript types for SearchResult and SearchResponse in `src/lib/hooks/use-search.ts`
- [x] T003 [P] Create Zod validation schema for search query parameters in `src/app/api/search/route.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core search API that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement GET /api/search endpoint with SQLite LIKE query in `src/app/api/search/route.ts`
  - Accept `q` parameter (min 2 chars, max 100 chars)
  - Accept `limit` parameter (default 10, max 50)
  - Search `title` and `plainText` fields (case-insensitive)
  - Filter by userId and exclude deletedAt !== null
  - Return SearchResponse format with matchType field
  - Order by updatedAt DESC

- [x] T005 Create useSearch TanStack Query hook in `src/lib/hooks/use-search.ts`
  - Implement 300ms debounce
  - Enable query only when length >= 2
  - Export search query keys for cache management

**Checkpoint**: Foundation ready - API endpoint returns search results correctly

---

## Phase 3: User Story 1 - Başlık ile Not Arama (Priority: P1) MVP

**Goal**: Kullanıcı arama kutusuna yazarak notlarını bulabilir

**Independent Test**: Arama kutusuna "test" yazıldığında, başlık veya içerikte "test" geçen notlar listelenir

### Implementation for User Story 1

- [x] T006 [P] [US1] Create search-highlight.tsx utility component in `src/components/search/search-highlight.tsx`
  - highlightMatch function with mark tag wrapping
  - escapeRegex helper for safe regex
  - Dark mode support (bg-yellow-200 / dark:bg-yellow-900)

- [x] T007 [P] [US1] Create search-results.tsx dropdown component in `src/components/search/search-results.tsx`
  - Display search results list
  - Show title (highlighted), preview (highlighted), updatedAt
  - Show "Sonuç bulunamadı" when empty
  - Loading spinner state

- [x] T008 [US1] Create search-input.tsx component in `src/components/search/search-input.tsx`
  - Controlled input with onChange
  - Connect to useSearch hook
  - Show dropdown when results available
  - Minimum 2 character validation UI hint

- [x] T009 [US1] Update header.tsx to use SearchInput component in `src/components/layout/header.tsx`
  - Replace static input with SearchInput component
  - Position dropdown correctly (absolute positioning)

- [x] T010 [US1] Add empty state and error handling in `src/components/search/search-results.tsx`
  - Display friendly error message on API error
  - Display "En az 2 karakter girin" hint

**Checkpoint**: User Story 1 complete - Users can search and see results in dropdown

---

## Phase 4: User Story 2 - Arama Sonuçlarında Navigasyon (Priority: P2)

**Goal**: Kullanıcı arama sonuçlarından bir nota tıklayarak gidebilir

**Independent Test**: Arama sonucunda görünen nota tıklandığında `/notes/[id]` sayfasına yönlendirme olur

### Implementation for User Story 2

- [x] T011 [US2] Add click handler to search results in `src/components/search/search-results.tsx`
  - onClick navigates to /notes/[id]
  - Use Next.js router for navigation
  - Close dropdown after navigation

- [x] T012 [US2] Add keyboard navigation (arrow keys) in `src/components/search/search-input.tsx`
  - Track selectedIndex state
  - ArrowDown: increment selectedIndex
  - ArrowUp: decrement selectedIndex
  - Visual highlight on selected item

- [x] T013 [US2] Add Enter key navigation in `src/components/search/search-input.tsx`
  - Enter: navigate to selected result
  - If no selection, navigate to first result (if exists)

**Checkpoint**: User Story 2 complete - Users can navigate to notes via click or keyboard

---

## Phase 5: User Story 3 - Klavye Kısayolu ile Arama (Priority: P3)

**Goal**: Kullanıcı Ctrl+K ile arama kutusuna hızlıca erişebilir

**Independent Test**: Herhangi bir sayfada Ctrl+K tuşlarına basıldığında arama kutusu aktif olur

### Implementation for User Story 3

- [x] T014 [US3] Add global Ctrl+K keyboard shortcut handler in `src/components/search/search-input.tsx`
  - useEffect for keydown event listener
  - Detect Ctrl+K (Windows/Linux) and Cmd+K (Mac)
  - Focus input and open dropdown on trigger
  - Prevent default browser behavior

- [x] T015 [US3] Add Escape key handler in `src/components/search/search-input.tsx`
  - Escape: close dropdown and blur input
  - Clear search query optionally

- [x] T016 [US3] Add visual indicator for keyboard shortcut in `src/components/layout/header.tsx`
  - Show "(Ctrl+K)" hint in placeholder (already exists, verify)
  - Ensure hint shows on Mac as "(⌘K)" based on platform

**Checkpoint**: User Story 3 complete - Users can access search via keyboard shortcut

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and edge case handling

- [x] T017 [P] Add aria-label and role attributes for accessibility in `src/components/search/search-input.tsx`
- [x] T018 [P] Add loading state styling (skeleton or spinner) in `src/components/search/search-results.tsx`
- [x] T019 Verify responsive design on mobile in `src/components/search/search-input.tsx`
- [x] T020 Add max-height and scroll to results dropdown in `src/components/search/search-results.tsx`
- [x] T021 Export useSearch hook from `src/lib/hooks/index.ts`
- [x] T022 Run quickstart.md validation - manual testing checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on User Story 1 (needs search results to navigate)
- **User Story 3 (Phase 5)**: Depends on User Story 1 (needs search input to focus)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Foundational - Core search functionality
- **User Story 2 (P2)**: Depends on US1 - Navigation requires results UI to exist
- **User Story 3 (P3)**: Depends on US1 - Keyboard shortcut needs input to focus

### Within Each User Story

- Parallel tasks [P] can run simultaneously
- Sequential tasks depend on prior tasks in same story
- Story complete = all acceptance scenarios pass

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T002 [P] TypeScript types
T003 [P] Zod schema
```

**Phase 3 (US1)**:
```
T006 [P] [US1] search-highlight.tsx
T007 [P] [US1] search-results.tsx
```

**Phase 6 (Polish)**:
```
T017 [P] Accessibility
T018 [P] Loading states
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T010)
4. **STOP and VALIDATE**: Test search works end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → API ready
2. Add User Story 1 → Basic search works → Demo MVP
3. Add User Story 2 → Click/keyboard navigation → Demo
4. Add User Story 3 → Ctrl+K shortcut → Demo
5. Polish phase → Production ready

### Task Count Summary

| Phase | Task Count | Parallel Opportunities |
|-------|------------|----------------------|
| Setup | 3 | 2 parallel (T002, T003) |
| Foundational | 2 | 0 (sequential) |
| User Story 1 | 5 | 2 parallel (T006, T007) |
| User Story 2 | 3 | 0 (sequential) |
| User Story 3 | 3 | 0 (sequential) |
| Polish | 6 | 2 parallel (T017, T018) |
| **Total** | **22** | **6 parallel pairs** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- Commit after each task or logical group
- All API responses use Zod validation
- Debounce prevents excessive API calls
- SQLite LIKE provides case-insensitive search
