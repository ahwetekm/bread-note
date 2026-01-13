# Quickstart: Not Arama Özelliği

**Feature**: 001-search
**Date**: 2026-01-13

## Overview

Bu özellik, header'daki arama kutusuna işlevsellik kazandırır. Kullanıcılar notlarını başlık ve içerik üzerinden arayabilir.

## Prerequisites

- Node.js 18+
- pnpm veya npm
- Turso veritabanı bağlantısı (.env.local)

## Quick Test

```bash
# Development server başlat
npm run dev

# Browser'da test et
# 1. Login yap
# 2. Header'daki arama kutusuna "test" yaz
# 3. Sonuçları gör
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/search/route.ts` | Search API endpoint |
| `src/lib/hooks/use-search.ts` | TanStack Query hook |
| `src/components/search/search-input.tsx` | Arama input component |
| `src/components/search/search-results.tsx` | Dropdown sonuç listesi |
| `src/components/layout/header.tsx` | Güncellenmiş header |

## API Usage

```typescript
// GET /api/search?q=toplantı&limit=10

// Response
{
  "results": [
    {
      "id": "abc123",
      "title": "Toplantı Notları",
      "preview": "Bu hafta yapılan toplantıda...",
      "matchType": "title",
      "updatedAt": "2026-01-13T10:00:00Z"
    }
  ],
  "total": 1,
  "query": "toplantı"
}
```

## Hook Usage

```typescript
import { useSearch } from '@/lib/hooks/use-search';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearch(query);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {isLoading && <Spinner />}
      {data?.results.map(result => (
        <SearchResultItem key={result.id} result={result} />
      ))}
    </div>
  );
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Arama kutusunu aç |
| `↑` / `↓` | Sonuçlar arasında gezin |
| `Enter` | Seçili nota git |
| `Escape` | Dropdown'u kapat |

## Testing

```bash
# Unit tests
npm run test src/lib/hooks/use-search.test.ts

# E2E tests
npm run test:e2e tests/search.spec.ts
```

## Troubleshooting

### Arama sonuçları gelmiyor
1. `.env.local`'da `TURSO_DATABASE_URL` kontrol et
2. Network tab'da `/api/search` isteğini kontrol et
3. Console'da hata mesajlarını kontrol et

### Klavye kısayolu çalışmıyor
1. Başka bir input element'e odaklanmış olabilir
2. Browser extension'lar Ctrl+K'yı override edebilir

## Architecture

```
User Types → Search Input
         ↓
    Debounce (300ms)
         ↓
    TanStack Query
         ↓
    GET /api/search?q=...
         ↓
    SQLite LIKE Query
         ↓
    Results → UI
```
