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
| To-do lists with subtasks | TAMAMLANDI | Tiptap task extension |
| Tags & folders | TAMAMLANDI | CRUD API'ler calisiyor |
| Full-text search | BEKLEMEDE | API yok |
| Note sharing | BEKLEMEDE | Schema var, API yok |
| Trash with 30-day retention | KISMI | API routes var |
| PDF export | BEKLEMEDE | Kutuphane yuklu |
| Notifications | BEKLEMEDE | Schema var |
| Keyboard shortcuts | BEKLEMEDE | Implementasyon yok |

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
│   │   └── tags/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── editor/
│   │   ├── tiptap-editor.tsx      # Rich text editor
│   │   └── editor-toolbar.tsx
│   ├── layout/
│   │   ├── header.tsx             # Ust menu
│   │   └── sidebar.tsx            # Yan menu
│   ├── notes/
│   │   ├── note-card.tsx
│   │   └── note-list.tsx
│   ├── providers/
│   │   ├── session-provider.tsx
│   │   └── query-provider.tsx   # TanStack Query
│   └── ui/                        # Shadcn/UI
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
├── lib/
│   ├── auth/
│   │   ├── config.ts              # Edge-compatible config
│   │   └── index.ts               # Full NextAuth config
│   ├── db/
│   │   ├── schema.ts              # Turso/Drizzle schema
│   │   └── index.ts               # DB client
│   ├── indexeddb/
│   │   ├── schema.ts              # Dexie schema
│   │   └── index.ts               # Dexie instance
│   ├── hooks/
│   │   ├── index.ts               # Export all hooks
│   │   ├── use-notes.ts           # Notes CRUD hooks
│   │   ├── use-folders.ts         # Folders CRUD hooks
│   │   └── use-tags.ts            # Tags CRUD hooks
│   └── utils/
│       └── cn.ts                  # className utility
├── types/
│   └── next-auth.d.ts
└── middleware.ts                  # Auth middleware
```

---

## API Routes (Gercek Durum)

| Endpoint | Metod | Durum | Aciklama |
|----------|-------|-------|----------|
| `/api/auth/[...nextauth]` | POST | CALISIYOR | NextAuth handler |
| `/api/auth/register` | POST | CALISIYOR | Kullanici kayit |
| `/api/notes` | GET | CALISIYOR | Notlari listele (paginated) |
| `/api/notes` | POST | CALISIYOR | Yeni not olustur |
| `/api/notes/[id]` | GET, PATCH, DELETE | CALISIYOR | Not detay/guncelle/sil |
| `/api/notes/trash` | GET, POST | ROUTE VAR | Cop kutusu |
| `/api/notes/trash/[id]` | DELETE | ROUTE VAR | Kalici silme |
| `/api/folders` | GET | CALISIYOR | Klasorleri listele |
| `/api/folders` | POST | CALISIYOR | Yeni klasor |
| `/api/folders/[id]` | GET, PATCH, DELETE | CALISIYOR | Klasor islemleri |
| `/api/tags` | GET | CALISIYOR | Etiketleri listele |
| `/api/tags` | POST | CALISIYOR | Yeni etiket |
| `/api/tags/[id]` | GET, PATCH, DELETE | CALISIYOR | Etiket islemleri |

### Henuz Olmayan API'ler

- `/api/notes/sync` - Delta sync endpoint
- `/api/notes/export` - PDF export
- `/api/search` - Full-text search
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
  parentId: text? (self-reference for subtasks)
  title: text
  isCompleted: integer (boolean)
  priority: text (low | medium | high)
  dueDate: integer?
  reminderAt: integer?
  order: integer
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
folders 1──n notes
folders 1──n folders (parentId)
notes n──n tags (via noteTags)
todos n──1 notes (optional)
todos n──1 todos (parentId for subtasks)
shares n──1 notes
shares n──1 users (sharedBy)
shares n──1 users (sharedWith, optional)
```

---

## Authentication

### Yapi

```
src/lib/auth/
├── config.ts    # Edge-compatible (middleware icin)
└── index.ts     # Full config (API routes icin)
```

### config.ts (Edge Runtime)

```typescript
// Sadece pages ve callbacks - provider/db import yok
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request }) { ... },
    jwt({ token, user }) { ... },
    session({ session, token }) { ... },
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
};
```

### index.ts (Full Config)

```typescript
import { authConfig } from './config';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      credentials: { email, password },
      authorize: async (credentials) => {
        // bcrypt.compare ile dogrulama
      },
    }),
  ],
});
```

### Middleware

```typescript
// src/middleware.ts
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/notes/:path*',
    '/folders/:path*',
    '/tags/:path*',
    '/favorites/:path*',
    '/trash/:path*',
    '/search/:path*',
    '/settings/:path*',
  ],
};
```

---

## Components

### Tiptap Editor

```typescript
// src/components/editor/tiptap-editor.tsx
Extensions:
- StarterKit (headings h1-h3, bold, italic, code, lists, blockquote)
- Typography
- Underline
- Link
- TaskList + TaskItem (nested: true)
- Placeholder

Props:
- content: string (Tiptap JSON)
- onChange: (content: string) => void
- editable?: boolean
```

### Layout Components

```typescript
// Header: Arama, sync status, bildirimler, kullanici menu
// Sidebar: Navigation (All Notes, Favorites, Trash, Folders, Tags)
// Mobile: Sidebar toggle button
```

### Note Components

```typescript
// NoteList: Grid layout, pinned/unpinned ayirimi
// NoteCard: Baslik, onizleme, tarih, etiketler
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

### Oncelik 2: Offline-First Sync

- [ ] `src/lib/sync/engine.ts` - Ana sync orchestrator
- [ ] `src/lib/sync/delta-sync.ts` - Delta sync algoritmasi
- [ ] `src/lib/sync/conflict-resolution.ts` - Cakisma cozumu
- [ ] IndexedDB'den okuma (cache-first)
- [ ] Sync queue isleme
- [ ] Background sync

### Oncelik 3: Gelismis Ozellikler

- [ ] Full-text search API ve UI
- [ ] PDF export
- [ ] Not paylasimi (public link + user invite)
- [ ] Keyboard shortcuts sistemi
- [ ] Command palette (Cmd+K)
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
```

---

## Guvenlik

- [x] Sifreler bcryptjs ile hashleniyor (10 rounds)
- [x] SQL injection korunmasi (Drizzle parameterized queries)
- [x] XSS korunmasi (React auto-escaping)
- [x] CSRF korunmasi (NextAuth)
- [x] HTTP-only session cookies
- [x] Input validation (Zod)
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

**Son Guncelleme**: 2026-01-12
**Versiyon**: 1.0.0
**Durum**: Aktif Gelistirme

> Bu dosya implementation sirasinda guncellenecektir.
