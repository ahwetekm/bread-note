# Bread Note - Proje Referans Dokumani

> Bu dosya Claude Code icin hazirlanmistir. Implementation sirasinda onemli bilgiler, kararlar ve referanslar bu dokumanda tutulur.

---

## Proje Ozeti

**Bread Note**, offline-first mimaride calisan, modern bir PWA not tutma uygulamasidir.

### Temel Ozellikler

| Ozellik | Durum | Aciklama |
|---------|-------|----------|
| Rich text editing (Tiptap) | TAMAMLANDI | Tam fonksiyonel editor |
| PWA (Progressive Web App) | TAMAMLANDI | Manifest, SW, offline page |
| Offline-first sync | BEKLEMEDE | Schema hazir, engine yok |
| To-do lists with subtasks | TAMAMLANDI | Bagimsiz /todos sayfasi, CRUD API |
| Tags & folders | TAMAMLANDI | CRUD API'ler calisiyor |
| Full-text search | TAMAMLANDI | /api/search endpoint, useSearch hook |
| Note sharing | BEKLEMEDE | Schema var, API yok |
| Trash with 30-day retention | TAMAMLANDI | Tam CRUD, restore, kalici silme |
| PDF export | BEKLEMEDE | Kutuphane yuklu |
| Notifications | BEKLEMEDE | Schema var |
| Keyboard shortcuts | KISMI | Ctrl+K arama kisayolu var |
| Settings page | TAMAMLANDI | Profil, sifre, tema, hesap silme |
| User management | TAMAMLANDI | Profil guncelleme, sifre degistirme |

---

## Tech Stack

| Kategori | Teknoloji | Versiyon | Durum |
|----------|-----------|----------|-------|
| **Framework** | Next.js | 15.1.3 (App Router) | AKTIF |
| **Language** | TypeScript | 5 | AKTIF |
| **Database** | Turso (LibSQL) | 0.14.0 | AKTIF |
| **ORM** | Drizzle | 0.36.4 | AKTIF |
| **Local DB** | IndexedDB (Dexie.js) | 4.0.10 | SCHEMA HAZIR |
| **UI Library** | Shadcn/UI | Latest | AKTIF |
| **Styling** | Tailwind CSS | 3.4.17 | AKTIF |
| **Editor** | Tiptap | 2.10.3 | AKTIF |
| **Auth** | NextAuth.js | 5.0.0-beta.25 | AKTIF |
| **Email** | Resend | 4.0.1 | YUKLU |
| **Upload** | UploadThing | 7.4.0 | YUKLU |
| **State** | Zustand + TanStack Query | 5.0.2 / 5.62.7 | AKTIF |
| **Testing** | Vitest + Playwright | 2.1.8 / 1.49.1 | YUKLU, TEST YOK |
| **Monitoring** | Sentry | 8.47.0 | YUKLU |

---

## Dosya Yapisi (Gercek)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (main)/
│   │   ├── dashboard/page.tsx
│   │   ├── favorites/page.tsx
│   │   ├── folders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── notes/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── tags/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── todos/page.tsx           # To-Do sayfasi
│   │   ├── settings/page.tsx        # Ayarlar sayfasi
│   │   ├── trash/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── register/route.ts
│   │   ├── folders/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── notes/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── trash/
│   │   │       ├── route.ts
│   │   │       └── [id]/route.ts
│   │   ├── tags/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── todos/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── search/
│   │   │   └── route.ts
│   │   └── user/
│   │       ├── route.ts
│   │       ├── password/route.ts
│   │       └── delete/route.ts
│   ├── offline/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── editor/
│   │   ├── tiptap-editor.tsx
│   │   └── editor-toolbar.tsx
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── main-layout.tsx
│   ├── notes/
│   │   ├── note-card.tsx
│   │   └── note-list.tsx
│   ├── todos/
│   │   ├── todo-list.tsx
│   │   ├── todo-item.tsx
│   │   ├── todo-form.tsx
│   │   ├── subtask-list.tsx
│   │   ├── todo-filters.tsx
│   │   ├── empty-state.tsx
│   │   └── delete-confirm-dialog.tsx
│   ├── settings/
│   │   ├── settings-tabs.tsx
│   │   ├── profile-form.tsx
│   │   ├── password-form.tsx
│   │   ├── theme-selector.tsx
│   │   └── delete-account-dialog.tsx
│   ├── search/
│   │   ├── search-input.tsx
│   │   ├── search-results.tsx
│   │   └── search-highlight.tsx
│   ├── providers/
│   │   ├── session-provider.tsx
│   │   ├── query-provider.tsx
│   │   └── pwa-provider.tsx
│   └── ui/                          # Shadcn/UI
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       └── tabs.tsx
├── lib/
│   ├── auth/
│   │   ├── config.ts
│   │   └── index.ts
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── indexeddb/
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── use-notes.ts
│   │   ├── use-folders.ts
│   │   ├── use-tags.ts
│   │   ├── use-todos.ts
│   │   ├── use-user.ts
│   │   ├── use-search.ts
│   │   ├── use-service-worker.ts
│   │   └── use-online-status.ts
│   ├── validations/
│   │   ├── todos.ts
│   │   └── user.ts
│   └── utils/
│       └── cn.ts
├── types/
│   └── next-auth.d.ts
└── middleware.ts
```

---

## API Routes (Gercek Durum)

### Authentication
| Endpoint | Metod | Durum | Aciklama |
|----------|-------|-------|----------|
| `/api/auth/[...nextauth]` | POST | CALISIYOR | NextAuth handler |
| `/api/auth/register` | POST | CALISIYOR | Kullanici kayit |

### Notes
| Endpoint | Metod | Durum | Aciklama |
|----------|-------|-------|----------|
| `/api/notes` | GET | CALISIYOR | Notlari listele (paginated, filtered) |
| `/api/notes` | POST | CALISIYOR | Yeni not olustur |
| `/api/notes/[id]` | GET | CALISIYOR | Not detay |
| `/api/notes/[id]` | PATCH | CALISIYOR | Not guncelle |
| `/api/notes/[id]` | DELETE | CALISIYOR | Not sil (soft delete) |

### Trash
| Endpoint | Metod | Durum | Aciklama |
|----------|-------|-------|----------|
| `/api/notes/trash` | GET | CALISIYOR | Silinen notlari listele |
| `/api/notes/trash` | DELETE | CALISIYOR | Cop kutusunu bosalt |
| `/api/notes/trash/[id]` | POST | CALISIYOR | Notu geri yukle |
| `/api/notes/trash/[id]` | DELETE | CALISIYOR | Kalici sil |

### Folders
| Endpoint | Metod | Durum | Aciklama |
|----------|-------|-------|----------|
| `/api/folders` | GET | CALISIYOR | Klasorleri listele |
| `/api/folders` | POST | CALISIYOR | Yeni klasor |
| `/api/folders/[id]` | GET | CALISIYOR | Klasor detay (notlar dahil) |
| `/api/folders/[id]` | PATCH | CALISIYOR | Klasor guncelle |
| `/api/folders/[id]` | DELETE | CALISIYOR | Klasor sil |

### Tags
| Endpoint | Metod | Durum | Aciklama |
|----------|-------|-------|----------|
| `/api/tags` | GET | CALISIYOR | Etiketleri listele (not sayisi dahil) |
| `/api/tags` | POST | CALISIYOR | Yeni etiket |
| `/api/tags/[id]` | GET | CALISIYOR | Etiket detay (notlar dahil) |
| `/api/tags/[id]` | PATCH | CALISIYOR | Etiket guncelle |
| `/api/tags/[id]` | DELETE | CALISIYOR | Etiket sil |

### Todos
| Endpoint | Metod | Durum | Aciklama |
|----------|-------|-------|----------|
| `/api/todos` | GET | CALISIYOR | Todo listele (filter: all/active/completed) |
| `/api/todos` | POST | CALISIYOR | Yeni todo |
| `/api/todos/[id]` | GET | CALISIYOR | Todo detay (subtasks dahil) |
| `/api/todos/[id]` | PATCH | CALISIYOR | Todo guncelle |
| `/api/todos/[id]` | DELETE | CALISIYOR | Todo sil |

### Search
| Endpoint | Metod | Durum | Aciklama |
|----------|-------|-------|----------|
| `/api/search` | GET | CALISIYOR | Not ara (q, limit params) |

### User
| Endpoint | Metod | Durum | Aciklama |
|----------|-------|-------|----------|
| `/api/user` | GET | CALISIYOR | Kullanici profili |
| `/api/user` | PATCH | CALISIYOR | Profil guncelle |
| `/api/user/password` | POST | CALISIYOR | Sifre degistir |
| `/api/user/delete` | POST | CALISIYOR | Hesabi sil |

### Henuz Olmayan API'ler

- `/api/notes/sync` - Delta sync endpoint
- `/api/notes/export` - PDF export
- `/api/share` - Not paylasimi
- `/api/share/[token]` - Paylasilan not

---

## Database Schema

### Turso (Server) - Tablolar

```typescript
// src/lib/db/schema.ts

users: {
  id: text (PK, nanoid)
  email: text (unique)
  password: text (bcryptjs hash)
  name: text?
  avatar: text?
  emailVerified: integer (boolean)
  resetToken: text?
  resetTokenExpiry: integer?
  createdAt, updatedAt: integer (timestamp)
}

folders: {
  id: text (PK)
  userId: text (FK -> users)
  name: text
  parentId: text? (self-reference)
  color: text?
  icon: text?
  order: integer (default 0)
  createdAt, updatedAt: integer
}

notes: {
  id: text (PK)
  userId: text (FK -> users)
  folderId: text? (FK -> folders)
  title: text
  content: text (Tiptap JSON)
  plainText: text (for search)
  isPinned: integer (boolean, default 0)
  isFavorite: integer (boolean, default 0)
  version: integer (default 1, optimistic locking)
  deletedAt: integer? (soft delete)
  createdAt, updatedAt: integer
}

tags: {
  id: text (PK)
  userId: text (FK -> users)
  name: text
  color: text?
  createdAt: integer
}

noteTags: {
  noteId: text (FK -> notes)
  tagId: text (FK -> tags)
  // Composite PK: (noteId, tagId)
}

todos: {
  id: text (PK)
  userId: text (FK -> users)
  noteId: text? (FK -> notes)
  parentId: text? (self-reference for subtasks, max 2 levels)
  title: text
  isCompleted: integer (boolean)
  completedAt: integer? (timestamp)
  priority: text (low | medium | high)
  dueDate: integer?
  reminderAt: integer?
  order: integer
  deletedAt: integer? (soft delete)
  createdAt, updatedAt: integer
}

shares: {
  id: text (PK)
  noteId: text (FK -> notes)
  sharedBy: text (FK -> users)
  sharedWith: text? (FK -> users, null for public)
  shareToken: text? (unique, for public links)
  permission: text (view | edit)
  expiresAt: integer?
  createdAt: integer
}

notifications: {
  id: text (PK)
  userId: text (FK -> users)
  type: text (share | reminder | sync_error | mention | system)
  title: text
  message: text
  data: text? (JSON)
  isRead: integer (boolean)
  createdAt: integer
}

syncMetadata: {
  id: text (PK)
  userId: text (FK -> users)
  deviceId: text
  lastSyncAt: integer
  createdAt: integer
}
```

### IndexedDB (Client) - Dexie Schema

```typescript
// src/lib/indexeddb/schema.ts

notes: '&id, title, folderId, userId, isPinned, isFavorite, syncStatus, updatedAt, deletedAt'
todos: '&id, noteId, userId, parentId, isCompleted, dueDate, syncStatus'
folders: '&id, name, userId, parentId, syncStatus'
tags: '&id, name, userId, syncStatus'
noteTags: '[noteId+tagId], noteId, tagId'
notifications: '&id, userId, type, isRead, createdAt'
syncQueue: '++id, entityType, entityId, operation, timestamp, retryCount'
syncMetadata: '&id, deviceId, lastSyncAt'
```

### Onemli Iliskiler

```
users 1──n notes
users 1──n folders
users 1──n todos
folders 1──n notes
folders 1──n folders (parentId)
notes n──n tags (via noteTags)
todos n──1 notes (optional)
todos n──1 todos (parentId for subtasks, max 2 levels)
shares n──1 notes
shares n──1 users (sharedBy)
shares n──1 users (sharedWith, optional)
```

---

## Components

### Layout Components

```typescript
// src/components/layout/
header.tsx        // Arama, sync status, bildirimler, kullanici menu
sidebar.tsx       // Navigation (All Notes, Favorites, Todos, Trash, Folders, Tags)
main-layout.tsx   // Ana layout wrapper
```

### Editor Components

```typescript
// src/components/editor/
tiptap-editor.tsx    // Rich text editor
editor-toolbar.tsx   // Toolbar (bold, italic, headings, lists, etc.)
```

### Todo Components

```typescript
// src/components/todos/
todo-list.tsx              // Ana container
todo-item.tsx              // Tek todo item
todo-form.tsx              // Olusturma/duzenleme formu
subtask-list.tsx           // Alt gorevler
todo-filters.tsx           // Filtre butonlari (all, active, completed)
empty-state.tsx            // Bos durum mesaji
delete-confirm-dialog.tsx  // Silme onay dialog
```

### Settings Components

```typescript
// src/components/settings/
settings-tabs.tsx        // Tab navigation
profile-form.tsx         // Isim guncelleme
password-form.tsx        // Sifre degistirme
theme-selector.tsx       // Tema secici (dark/light/auto)
delete-account-dialog.tsx // Hesap silme onay
```

### Search Components

```typescript
// src/components/search/
search-input.tsx     // Arama input (debounce, dropdown)
search-results.tsx   // Sonuc listesi
search-highlight.tsx // Eslesen metni vurgula
```

---

## Hooks

```typescript
// src/lib/hooks/

// Notes
useNotes()           // Not listesi (paginated, filtered)
useNote(id)          // Tek not
useCreateNote()      // Not olustur
useUpdateNote()      // Not guncelle
useDeleteNote()      // Not sil (soft)
useToggleFavorite()  // Favori toggle
useTogglePin()       // Pin toggle

// Folders
useFolders()         // Klasor listesi
useFolder(id)        // Tek klasor (notlar dahil)
useCreateFolder()    // Klasor olustur
useUpdateFolder()    // Klasor guncelle
useDeleteFolder()    // Klasor sil

// Tags
useTags()            // Etiket listesi (not sayisi dahil)
useTag(id)           // Tek etiket (notlar dahil)
useCreateTag()       // Etiket olustur
useUpdateTag()       // Etiket guncelle
useDeleteTag()       // Etiket sil

// Todos
useTodos(filter)     // Todo listesi (all/active/completed)
useTodo(id)          // Tek todo (subtasks dahil)
useCreateTodo()      // Todo olustur
useUpdateTodo()      // Todo guncelle
useDeleteTodo()      // Todo sil

// User
useUser()            // Kullanici profili
useUpdateUser()      // Profil guncelle
useChangePassword()  // Sifre degistir
useDeleteAccount()   // Hesap sil

// Search
useSearch(query)     // Not ara (debounced)

// Utils
useOnlineStatus()    // Online/offline durumu
useServiceWorker()   // PWA service worker
```

---

## Authentication

### Yapi

```
src/lib/auth/
├── config.ts    # Edge-compatible (middleware icin)
└── index.ts     # Full config (API routes icin)
```

### Middleware

```typescript
// src/middleware.ts
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/notes/:path*',
    '/folders/:path*',
    '/tags/:path*',
    '/favorites/:path*',
    '/trash/:path*',
    '/todos/:path*',
    '/settings/:path*',
    '/search/:path*',
  ],
};
```

---

## UI/UX Guidelines

### Renkler (Dark Theme)

```css
--background: 222.2 84% 4.9%;      /* #030712 - gray-950 */
--foreground: 210 40% 98%;         /* #F9FAFB - gray-50 */
--primary: 217.2 91.2% 59.8%;      /* Blue-500 */
--card: 222.2 84% 6.5%;            /* gray-900 */
--border: 217.2 32.6% 17.5%;       /* gray-800 */
--accent: 217.2 91.2% 69.8%;       /* Blue-400 */
```

### Tipografi

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "Segoe UI",
  sans-serif;
```

### Responsive Breakpoints

```typescript
sm: '640px',   // Mobile landscape
md: '768px',   // Tablets
lg: '1024px',  // Desktop
xl: '1280px',  // Large desktop
```

---

## Yapilacaklar (TODO)

### Oncelik 1: Temel Ozellikler (TAMAMLANDI)

- [x] Custom hooks olustur (`use-notes.ts`, `use-folders.ts`, `use-tags.ts`)
- [x] TanStack Query entegrasyonu
- [x] Not PATCH/DELETE API'leri tamamla
- [x] Klasor/etiket PATCH/DELETE API'leri tamamla
- [x] Favori toggle islevi (`useToggleFavorite` hook)
- [x] Pin toggle islevi (`useTogglePin` hook)
- [x] To-Do sayfasi ve API'leri
- [x] Settings sayfasi (profil, sifre, tema, hesap silme)
- [x] Trash tam CRUD (restore, kalici silme)

### Oncelik 2: Offline-First Sync

- [ ] `src/lib/sync/engine.ts` - Ana sync orchestrator
- [ ] `src/lib/sync/delta-sync.ts` - Delta sync algoritmasi
- [ ] `src/lib/sync/conflict-resolution.ts` - Cakisma cozumu
- [ ] IndexedDB'den okuma (cache-first)
- [ ] Sync queue isleme
- [ ] Background sync

### Oncelik 3: Gelismis Ozellikler

- [x] Full-text search API ve UI
- [ ] PDF export
- [ ] Not paylasimi (public link + user invite)
- [x] Keyboard shortcuts sistemi (Ctrl+K arama)
- [ ] Command palette (Cmd+K - genisletilmis)
- [ ] Email bildirimleri

### Oncelik 4: Test & Monitoring

- [ ] Vitest unit testleri
- [ ] Playwright E2E testleri
- [ ] Sentry entegrasyonu
- [ ] Render deployment konfigurasyonu

---

## Development Workflow

### Komutlar

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run db:push      # Schema'yi Turso'ya push
npm run db:studio    # Drizzle Studio
npm run db:generate  # Migration olustur
```

### Environment Variables

```bash
# .env.local
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-32-chars-min

# Opsiyonel (henuz kullanilmiyor)
RESEND_API_KEY=re_xxxxx
UPLOADTHING_SECRET=sk_live_xxxxx
UPLOADTHING_APP_ID=app_xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/sync-engine

# Conventional commits
git commit -m "feat(sync): implement delta sync algorithm"
git commit -m "fix(notes): handle empty content edge case"
git commit -m "refactor(auth): split config for edge runtime"
```

---

## Debugging

### IndexedDB

```javascript
// Chrome DevTools > Application > IndexedDB > BreadNoteDB
// Console'da:
await indexedDB.deleteDatabase('BreadNoteDB');
localStorage.clear();
location.reload();
```

### Auth Issues

```javascript
// Session kontrolu
const session = await auth();
console.log('Session:', session);

// Token decode (JWT)
// jwt.io uzerinden token icerigini kontrol et
```

### API Debug

```bash
# curl ile test
curl -X GET http://localhost:3000/api/notes \
  -H "Cookie: authjs.session-token=..."

curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"{}"}'

# Search test
curl -X GET "http://localhost:3000/api/search?q=test&limit=10" \
  -H "Cookie: authjs.session-token=..."
```

---

## Guvenlik

- [x] Sifreler bcryptjs ile hashleniyor (10 rounds)
- [x] SQL injection korunmasi (Drizzle parameterized queries)
- [x] XSS korunmasi (React auto-escaping)
- [x] CSRF korunmasi (NextAuth)
- [x] HTTP-only session cookies
- [x] Input validation (Zod)
- [x] User isolation (tum API'lerde userId kontrolu)
- [ ] Rate limiting (henuz yok)
- [ ] Email verification (schema var, flow yok)

---

## Performans Hedefleri

| Metrik | Hedef |
|--------|-------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| TTI | < 3.5s |
| Bundle Size | < 200KB |
| API Response (p95) | < 200ms |

---

**Son Guncelleme**: 2026-01-13
**Versiyon**: 1.1.0
**Durum**: Aktif Gelistirme

> Bu dosya implementation sirasinda guncellenecektir.
