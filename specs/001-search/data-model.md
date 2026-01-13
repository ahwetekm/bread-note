# Data Model: Not Arama Özelliği

**Feature**: 001-search
**Date**: 2026-01-13

## Entities

### Note (Mevcut - Değişiklik Yok)

Arama özelliği mevcut `notes` tablosunu kullanır, yeni entity oluşturulmaz.

| Field | Type | Description |
|-------|------|-------------|
| id | text (PK) | Unique identifier (nanoid) |
| userId | text (FK) | Owner user reference |
| title | text | Not başlığı - aranabilir |
| plainText | text | Düz metin içeriği - aranabilir |
| updatedAt | timestamp | Son güncelleme tarihi - sıralama için |
| deletedAt | timestamp? | Soft delete - null olmalı (aktif notlar) |

### SearchResult (Runtime Entity - Veritabanında Yok)

API response için kullanılan runtime entity.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Note ID |
| title | string | Not başlığı |
| preview | string | plainText'in ilk 150 karakteri |
| matchType | enum | 'title' \| 'content' \| 'both' |
| updatedAt | Date | Son güncelleme tarihi |

## Relationships

```
User 1──n Note (via userId)
Note ──> SearchResult (projection for API response)
```

## Validation Rules

### Search Query
- Minimum 2 karakter
- Maksimum 100 karakter
- Özel karakterler escape edilmeli (SQL injection koruması)
- Boşluklar trim edilmeli

### Search Results
- Maksimum 50 sonuç
- Sadece kullanıcının kendi notları
- deletedAt === null (aktif notlar)
- updatedAt DESC sıralama

## State Transitions

Bu özellik için state transition yok - read-only query operation.

## Indexes (Mevcut)

Arama performansı için mevcut indexler yeterli:

```sql
-- Zaten mevcut
CREATE INDEX notes_user_id_idx ON notes(user_id);
CREATE INDEX notes_updated_at_idx ON notes(updated_at);
```

## Future Considerations

### FTS5 Index (Gelecek İterasyon)

```sql
-- FTS5 virtual table (şimdilik implementasyon yok)
CREATE VIRTUAL TABLE notes_fts USING fts5(
  title,
  plain_text,
  content=notes,
  content_rowid=id
);
```
