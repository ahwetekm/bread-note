# Research: Not Arama Özelliği

**Feature**: 001-search
**Date**: 2026-01-13

## Research Summary

Bu dokuman, arama özelliğinin implementasyonu için yapılan araştırma bulgularını içerir.

---

## 1. SQLite Full-Text Search Yaklaşımı

### Decision: SQLite LIKE operatörü (başlangıç için)

### Rationale:
- Mevcut `notes` tablosunda `plainText` alanı zaten mevcut
- LIKE operatörü basit ve yeterli performans sağlar (< 1000 not için)
- FTS5 daha sonra eklenebilir (gelecek iterasyon)

### Alternatives Considered:
| Seçenek | Avantaj | Dezavantaj | Karar |
|---------|---------|------------|-------|
| LIKE operator | Basit, mevcut altyapı yeterli | Büyük verilerde yavaş | ✅ Seçildi |
| FTS5 | Hızlı, gelişmiş özellikler | Ek setup gerekli, Turso desteği kontrol edilmeli | Gelecek iterasyon |
| Client-side search | Offline çalışır | Büyük verilerde yavaş, memory kullanımı | Offline-first için P2'de değerlendirilecek |

---

## 2. Debounce Stratejisi

### Decision: 300ms debounce delay

### Rationale:
- 300ms, kullanıcı yazarken gereksiz API çağrılarını önler
- Doğal yazma hızında sonuçlar hızlıca görünür
- TanStack Query'nin `staleTime` ile kombinasyonu etkin caching sağlar

### Implementation Pattern:
```typescript
// use-search.ts'de kullanılacak pattern
const [debouncedQuery] = useDebounce(query, 300);

useQuery({
  queryKey: ['search', debouncedQuery],
  queryFn: () => searchNotes(debouncedQuery),
  enabled: debouncedQuery.length >= 2,
  staleTime: 1000 * 60, // 1 dakika cache
});
```

---

## 3. Klavye Navigasyonu

### Decision: Radix UI Popover + Custom keyboard handling

### Rationale:
- Shadcn/UI zaten Radix UI tabanlı
- Accessibility (a11y) desteği built-in
- Arrow keys, Enter, Escape handling kolay

### Key Bindings:
| Key | Action |
|-----|--------|
| Ctrl+K / Cmd+K | Arama kutusunu aç/odaklan |
| ArrowDown | Sonraki sonuç |
| ArrowUp | Önceki sonuç |
| Enter | Seçili nota git |
| Escape | Dropdown'u kapat |

---

## 4. Vurgulama (Highlight) Stratejisi

### Decision: String split + mark tag wrapping

### Rationale:
- Basit ve güvenli (XSS koruması)
- React ile doğal entegrasyon
- dangerouslySetInnerHTML kullanılmıyor

### Implementation Pattern:
```typescript
function highlightMatch(text: string, query: string): React.ReactNode {
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">{part}</mark>
      : part
  );
}
```

---

## 5. API Response Format

### Decision: Minimal response with pagination

### Rationale:
- Sadece gerekli alanlar döndürülecek (id, title, plainText snippet, updatedAt)
- Pagination ile büyük sonuç setleri yönetilecek
- Content preview için plainText'in ilk 150 karakteri

### Response Schema:
```typescript
interface SearchResponse {
  results: Array<{
    id: string;
    title: string;
    preview: string;      // plainText'in ilk 150 karakteri
    matchType: 'title' | 'content' | 'both';
    updatedAt: Date;
  }>;
  total: number;
  query: string;
}
```

---

## 6. Offline Search (Gelecek İterasyon - P2)

### Decision: IndexedDB üzerinden client-side search

### Rationale:
- Constitution'da offline-first prensibi var
- Dexie.js zaten projede yüklü
- İlk iterasyonda server-side, ikinci iterasyonda client-side eklenir

### Notes:
- IndexedDB'de `notes` tablosu offline-first sync ile dolacak
- Dexie'nin `where().startsWithIgnoreCase()` veya custom filter kullanılabilir

---

## Resolved Clarifications

| Item | Resolution |
|------|------------|
| Arama algoritması | SQLite LIKE operatörü (case-insensitive) |
| Debounce süresi | 300ms |
| Minimum karakter | 2 karakter |
| Sonuç limiti | Varsayılan 10, maksimum 50 |
| Sıralama | updatedAt DESC (en son güncellenen önce) |
