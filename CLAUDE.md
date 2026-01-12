# 🍞 Bread Note - Proje Referans Dokümanı

> Bu dosya Claude Code için hazırlanmıştır. Implementation sırasında önemli bilgiler, kararlar ve referanslar bu dokümanda tutulur.

---

## 📌 Proje Özeti

**Bread Note**, offline-first mimaride çalışan, modern bir PWA not tutma uygulamasıdır.

### Temel Özellikler
- ✍️ Rich text editing (Tiptap)
- 📱 PWA (Progressive Web App)
- 🔄 Offline-first sync
- ✅ To-do lists with subtasks
- 🏷️ Tags & folders
- 🔍 Full-text search
- 🤝 Note sharing (public & private)
- 🗑️ Trash with 30-day retention
- 📄 PDF export
- 🔔 Notifications (push, in-app, email)
- ⌨️ Keyboard shortcuts

---

## 🛠️ Tech Stack

| Kategori | Teknoloji | Versiyon |
|----------|-----------|----------|
| **Framework** | Next.js | 15.x (App Router) |
| **Language** | TypeScript | 5.3+ |
| **Database** | Turso (LibSQL) | Latest |
| **ORM** | Drizzle | 0.29+ |
| **Local DB** | IndexedDB (Dexie.js) | 3.2+ |
| **UI Library** | Shadcn/UI | Latest |
| **Styling** | Tailwind CSS | 3.4+ |
| **Editor** | Tiptap | 2.1+ |
| **Auth** | NextAuth.js | 5.0-beta |
| **Email** | Resend | 3.0+ |
| **Upload** | UploadThing | 6.0+ |
| **State** | Zustand + TanStack Query | Latest |
| **Testing** | Vitest + Playwright | Latest |
| **Monitoring** | Sentry + Vercel Analytics | Latest |
| **Deployment** | Vercel | - |

---

## 📁 Dosya Yapısı Referansı

### Kritik Dosyalar

```
src/
├── lib/
│   ├── db/
│   │   └── schema.ts           ⭐ Turso schema (tüm tablolar)
│   ├── indexeddb/
│   │   └── index.ts            ⭐ Local DB setup (Dexie)
│   ├── sync/
│   │   ├── engine.ts           ⭐ Ana sync orchestrator
│   │   ├── delta-sync.ts       ⭐ Delta sync algoritması
│   │   └── conflict-resolution.ts
│   ├── auth/
│   │   └── config.ts           ⭐ NextAuth config
│   └── hooks/
│       ├── use-notes.ts        ⭐ Notes CRUD hook
│       ├── use-todos.ts
│       └── use-sync.ts
├── components/
│   ├── editor/
│   │   └── tiptap-editor.tsx   ⭐ Rich text editor
│   ├── notes/
│   │   └── note-list.tsx       ⭐ Virtual scrolling list
│   └── layout/
│       └── command-palette.tsx  Cmd+K palette
└── app/
    ├── (main)/                 Protected routes
    ├── (auth)/                 Public auth routes
    └── api/                    API routes
```

### API Routes Mapping

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/notes` | GET | Notları listele (paginated) |
| `/api/notes` | POST | Yeni not oluştur |
| `/api/notes/[id]` | GET | Not detayı |
| `/api/notes/[id]` | PATCH | Not güncelle |
| `/api/notes/[id]` | DELETE | Not sil (soft delete) |
| `/api/notes/sync` | POST | Delta sync endpoint |
| `/api/notes/export` | POST | PDF export |
| `/api/todos` | GET/POST | Todos CRUD |
| `/api/folders` | GET/POST | Folders CRUD |
| `/api/tags` | GET/POST | Tags CRUD |
| `/api/share` | POST | Share note |
| `/api/share/[token]` | GET | Get shared note |
| `/api/search` | GET | Full-text search |
| `/api/upload` | POST | Image upload |

---

## 🗄️ Database Schema Highlights

### Core Tables

#### notes
- **PK**: `id` (text)
- **Indexes**: `userId`, `folderId`, `updatedAt`, `plainText` (FTS)
- **Soft Delete**: `deletedAt` timestamp
- **Versioning**: `version` (optimistic locking)
- **Content**: Tiptap JSON format

#### todos
- **Features**: Subtasks via `parentId` self-reference
- **Priority**: `low | medium | high`
- **Reminders**: `reminderAt` timestamp

#### shares
- **Public Links**: `shareToken` (unique, nanoid)
- **User Shares**: `sharedWith` FK to users
- **Permissions**: `view | edit`

### Important Relationships

```
users 1──∞ notes
users 1──∞ folders
folders 1──∞ notes
notes ∞──∞ tags (via noteTags)
todos ∞──1 notes (optional)
todos ∞──1 todos (subtasks via parentId)
```

---

## 🔄 Offline-First Architecture

### Data Flow Principles

1. **Write Operations**: IndexedDB first, then sync
2. **Read Operations**: IndexedDB first (cache-first)
3. **Sync**: Background, non-blocking
4. **Conflicts**: Version-based detection, user resolution

### Sync States

```typescript
type SyncStatus = 'synced' | 'pending' | 'conflict';
```

- **synced**: Local and remote in sync
- **pending**: Local changes waiting to sync
- **conflict**: Version mismatch, needs resolution

### Delta Sync Flow

```
Client sends:
  - lastSyncAt (timestamp)
  - deviceId (UUID)
  - changes[] (local modifications)

Server responds:
  - serverChanges[] (remote modifications)
  - conflicts[] (version mismatches)
  - newSyncAt (new sync timestamp)

Client applies:
  1. Apply serverChanges to IndexedDB
  2. Resolve conflicts (prompt user or auto-merge)
  3. Update sync metadata
  4. Clear sync queue
```

### Conflict Resolution Strategy

**Last-Write-Wins (Auto):**
- Simple field updates (title, tags)
- Non-overlapping edits

**User Prompt (Manual):**
- Content edits (Tiptap JSON)
- Major structural changes
- Multiple conflicting versions

---

## 🎨 UI/UX Guidelines

### Dark Theme Colors

```css
/* Tailwind Custom Colors */
--background: 222.2 84% 4.9%;      /* #030712 - gray-950 */
--foreground: 210 40% 98%;         /* #F9FAFB - gray-50 */
--primary: 217.2 91.2% 59.8%;      /* Blue-500 */
--card: 222.2 84% 6.5%;            /* gray-900 */
--border: 217.2 32.6% 17.5%;       /* gray-800 */
--accent: 217.2 91.2% 69.8%;       /* Blue-400 */
```

### Typography

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
const breakpoints = {
  sm: '640px',   // Mobile landscape, small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
};
```

### Component Patterns

**Loading States:**
```tsx
if (isLoading) return <NoteListSkeleton />;
if (error) return <ErrorState error={error} />;
return <NoteList notes={notes} />;
```

**Empty States:**
```tsx
{notes.length === 0 ? (
  <EmptyState
    icon={FileText}
    title="No notes yet"
    description="Create your first note to get started"
    action={<Button>New Note</Button>}
  />
) : (
  <NoteList notes={notes} />
)}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + N` | New note |
| `Cmd/Ctrl + S` | Save note |
| `Cmd/Ctrl + F` | Search |
| `Cmd/Ctrl + B` | Bold text |
| `Cmd/Ctrl + I` | Italic text |
| `Cmd/Ctrl + U` | Underline text |
| `Cmd/Ctrl + Shift + X` | Strikethrough |
| `Cmd/Ctrl + [` | Outdent |
| `Cmd/Ctrl + ]` | Indent |
| `Escape` | Close dialog/modal |

Implementation:
```typescript
// src/lib/utils/shortcuts.ts
import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  deps: any[] = []
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === key) {
        e.preventDefault();
        callback();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, deps);
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

**Target Coverage**: 80%+

**Critical Areas:**
- `lib/sync/delta-sync.ts` - Sync logic
- `lib/indexeddb/operations.ts` - Local DB ops
- `lib/hooks/use-notes.ts` - Data fetching
- `lib/utils/*` - Utility functions

```typescript
// Example: tests/unit/lib/sync/delta-sync.test.ts
import { describe, it, expect } from 'vitest';
import { resolveDeltaSync } from '@/lib/sync/delta-sync';

describe('Delta Sync', () => {
  it('should detect version conflicts', () => {
    const local = { id: '1', version: 2, content: 'A' };
    const remote = { id: '1', version: 3, content: 'B' };

    const result = resolveDeltaSync(local, remote);

    expect(result.status).toBe('conflict');
  });
});
```

### E2E Tests (Playwright)

**Critical Flows:**
1. Authentication (login, register, email verify)
2. Note CRUD (create, read, update, delete)
3. Offline mode (create note offline, sync when online)
4. Sync conflicts (edit on two devices)
5. Share flow (public link, user invite)

```typescript
// tests/e2e/offline.spec.ts
test('should create note while offline and sync', async ({ page, context }) => {
  await page.goto('/login');
  await login(page);

  // Go offline
  await context.setOffline(true);

  // Create note
  await page.click('[data-testid="new-note"]');
  await page.fill('[data-testid="note-title"]', 'Offline Note');
  await page.fill('[data-testid="note-content"]', 'Content');
  await page.click('[data-testid="save-note"]');

  // Verify pending status
  await expect(page.locator('[data-testid="sync-status"]'))
    .toContainText('Pending');

  // Go online
  await context.setOffline(false);

  // Wait for sync
  await expect(page.locator('[data-testid="sync-status"]'))
    .toContainText('Synced', { timeout: 10000 });
});
```

---

## 🚀 Deployment Guide

### Environment Variables

```bash
# .env.local (development)
# .env.production (Vercel)

# Database
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-32-chars-min

# Email
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Upload
UPLOADTHING_SECRET=sk_live_xxxxx
UPLOADTHING_APP_ID=app_xxxxx

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx

# Feature Flags
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production
vercel --prod
```

### Database Migrations

```bash
# Generate migration
npm run db:generate

# Push to Turso
npm run db:push

# Studio (GUI)
npm run db:studio
```

**package.json scripts:**
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:sqlite",
    "db:push": "drizzle-kit push:sqlite",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 🐛 Debugging Tips

### IndexedDB Inspection

**Chrome DevTools:**
1. Application tab → Storage → IndexedDB
2. Expand `BreadNoteDB`
3. Inspect tables: `notes`, `todos`, `syncQueue`

**Clear Local Data:**
```typescript
// In browser console
await indexedDB.deleteDatabase('BreadNoteDB');
localStorage.clear();
location.reload();
```

### Sync Issues

**Check Sync Queue:**
```typescript
// In browser console
import { db } from '@/lib/indexeddb';

const queue = await db.syncQueue.toArray();
console.log('Pending syncs:', queue);
```

**Force Sync:**
```typescript
import { triggerSync } from '@/lib/sync/engine';

await triggerSync();
```

### Service Worker

**View Registered SW:**
```
chrome://serviceworker-internals/
```

**Unregister SW:**
```typescript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});
```

---

## 🔒 Security Checklist

- [x] Passwords hashed (bcrypt, 10 rounds)
- [x] SQL injection prevention (Drizzle parameterized queries)
- [x] XSS prevention (React auto-escaping)
- [x] CSRF protection (NextAuth)
- [x] Rate limiting (Vercel Edge Config)
- [x] Email verification required
- [x] Secure sessions (HTTP-only cookies)
- [x] HTTPS enforced (Vercel)
- [x] Input validation (Zod)
- [x] Share tokens crypto-secure (nanoid)
- [x] File upload validation (type, size, MIME)

### Rate Limiting Example

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}
```

---

## 📊 Performance Benchmarks

### Target Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| FID (First Input Delay) | < 100ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| TTI (Time to Interactive) | < 3.5s | Lighthouse |
| Bundle Size (First Load) | < 200KB | next/bundle-analyzer |
| API Response (p95) | < 200ms | Vercel Analytics |
| Sync Time (100 notes) | < 2s | Custom metric |
| Search Query | < 500ms | Custom metric |

### Optimization Techniques

**Code Splitting:**
```typescript
// Dynamic import for heavy components
const TiptapEditor = dynamic(
  () => import('@/components/editor/tiptap-editor'),
  {
    ssr: false,
    loading: () => <EditorSkeleton />
  }
);
```

**Image Optimization:**
```tsx
import Image from 'next/image';

<Image
  src="/note-image.jpg"
  alt="Note"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>
```

**Virtual Scrolling:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: notes.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 120,
  overscan: 5,
});
```

---

## 🔧 Troubleshooting Common Issues

### Issue: Service Worker Not Updating

**Solution:**
```typescript
// Add to layout.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed'
              && navigator.serviceWorker.controller) {
            // Show update banner
            toast({
              title: 'Update Available',
              action: <Button onClick={() => window.location.reload()}>
                Reload
              </Button>
            });
          }
        });
      });
    });
  }
}, []);
```

### Issue: IndexedDB Quota Exceeded

**Solution:**
```typescript
async function enforceQuota() {
  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage! / estimate.quota!;

  if (usage > 0.9) {
    // Remove old non-favorite notes
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);

    await db.notes
      .where('isFavorite').equals(0)
      .and(note => note.updatedAt < sixMonthsAgo)
      .delete();
  }
}
```

### Issue: Sync Conflicts Not Resolving

**Solution:**
```typescript
// Manual conflict resolution
async function resolveConflict(noteId: string, keepVersion: 'local' | 'remote') {
  const local = await db.notes.get(noteId);
  const remote = await fetch(`/api/notes/${noteId}`).then(r => r.json());

  const resolved = keepVersion === 'local'
    ? { ...local, version: remote.version + 1 }
    : { ...remote, syncStatus: 'synced' };

  await db.notes.put(resolved);
  await syncNote(noteId);
}
```

---

## 📚 Key Implementation Patterns

### Custom Hook Pattern (use-notes.ts)

```typescript
export function useNotes(filters?: NoteFilters) {
  const { isOnline } = useOffline();

  return useQuery({
    queryKey: ['notes', filters],
    queryFn: async () => {
      // 1. Read from IndexedDB (cache-first)
      let notes = await db.notes
        .where('deletedAt').equals(undefined)
        .toArray();

      // 2. Apply filters
      if (filters?.folderId) {
        notes = notes.filter(n => n.folderId === filters.folderId);
      }

      // 3. Background sync if online
      if (isOnline) {
        queueMicrotask(() => syncNotes());
      }

      return notes;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: NewNote) => {
      const id = nanoid();

      // 1. Write to IndexedDB
      await db.notes.add({
        ...note,
        id,
        syncStatus: 'pending',
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 2. Add to sync queue
      await db.syncQueue.add({
        id: nanoid(),
        entityType: 'note',
        entityId: id,
        operation: 'create',
        payload: note,
        timestamp: Date.now(),
        retryCount: 0,
      });

      return id;
    },
    onSuccess: () => {
      // 3. Invalidate cache
      queryClient.invalidateQueries(['notes']);

      // 4. Trigger sync
      triggerSync();
    },
  });
}
```

### API Route Pattern

```typescript
// app/api/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  folderId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validate query params
    const { searchParams } = new URL(request.url);
    const { page, limit, folderId } = querySchema.parse(
      Object.fromEntries(searchParams)
    );

    // 3. Build query
    const offset = (page - 1) * limit;
    const where = and(
      eq(notes.userId, session.user.id),
      isNull(notes.deletedAt),
      folderId ? eq(notes.folderId, folderId) : undefined
    );

    // 4. Fetch data
    const [items, [{ count }]] = await Promise.all([
      db.query.notes.findMany({
        where,
        orderBy: [desc(notes.isPinned), desc(notes.updatedAt)],
        limit,
        offset,
        with: {
          tags: true,
          folder: true,
        },
      }),
      db.select({ count: sql`count(*)` })
        .from(notes)
        .where(where),
    ]);

    // 5. Return response
    return NextResponse.json({
      notes: items,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching notes:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🎓 Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Setup database
npm run db:push

# Run dev server
npm run dev

# Run tests (watch mode)
npm run test

# Run E2E tests
npm run test:e2e

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/note-sharing

# Commit with conventional commits
git commit -m "feat(share): implement public link generation"

# Push
git push origin feature/note-sharing

# Create PR (via GitHub CLI)
gh pr create --title "Add note sharing" --body "..."
```

### Code Review Checklist

- [ ] Types are properly defined
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Tests written (unit + e2e if applicable)
- [ ] Accessibility considerations (ARIA labels)
- [ ] Performance optimized (memo, useMemo, useCallback)
- [ ] Security validated (input sanitization)
- [ ] Documentation updated

---

## 🎯 Success Criteria

### MVP Launch (8 Weeks)

- [x] All core features implemented
- [x] Offline-first working
- [x] PWA installable
- [x] Tests passing (80% coverage)
- [x] Lighthouse score > 90
- [x] Mobile responsive
- [x] Deployed to Vercel

### Post-Launch (3 Months)

- [ ] 1000+ active users
- [ ] < 1% error rate (Sentry)
- [ ] < 2s avg sync time
- [ ] > 4.5 star rating (if applicable)
- [ ] User feedback implemented

---

## 📞 Support & Resources

### Documentation Links

- [Next.js Docs](https://nextjs.org/docs)
- [Turso Docs](https://turso.tech/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tiptap Docs](https://tiptap.dev)
- [Shadcn/UI](https://ui.shadcn.com)
- [Dexie.js](https://dexie.org)

### Community

- [Next.js Discord](https://discord.gg/nextjs)
- [Turso Discord](https://discord.gg/turso)

---

**Last Updated**: 2026-01-12
**Version**: 1.0.0
**Status**: Ready for Implementation ✅

> Bu dosya implementation sırasında güncellenecektir. Yeni pattern'ler, sorunlar ve çözümler eklenecektir.
