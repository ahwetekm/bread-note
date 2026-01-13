# Data Model: To-Do Sayfası

**Feature**: 001-todo-page
**Date**: 2025-01-13

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │    todos     │       │    notes     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ userId (FK)  │       │ id (PK)      │
│ email        │       │ id (PK)      │───────►│ title        │
│ name         │       │ noteId (FK)? │       │ ...          │
│ ...          │       │ parentId?    │───┐   └──────────────┘
└──────────────┘       │ title        │   │
                       │ isCompleted  │   │
                       │ priority     │   │
                       │ position     │   │
                       │ ...          │   │
                       └──────────────┘   │
                              ▲           │
                              └───────────┘
                           (self-reference)
```

## Entities

### Todo (Görev)

Mevcut `todos` tablosu kullanılacak. Şema zaten projede tanımlı.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | text | PK, nanoid | Benzersiz kimlik |
| `userId` | text | FK → users, NOT NULL | Görev sahibi |
| `noteId` | text | FK → notes, NULL | Opsiyonel not bağlantısı |
| `parentId` | text | FK → todos (self), NULL | Üst görev (alt görevler için) |
| `title` | text | NOT NULL, max 200 char | Görev başlığı |
| `description` | text | NULL | Detaylı açıklama (şimdilik kullanılmayacak) |
| `isCompleted` | boolean | NOT NULL, default false | Tamamlanma durumu |
| `priority` | enum | 'low' \| 'medium' \| 'high', default 'medium' | Öncelik seviyesi |
| `position` | integer | NOT NULL, default 0 | Sıralama için |
| `dueDate` | timestamp | NULL | **KAPSAM DIŞI** |
| `reminderAt` | timestamp | NULL | **KAPSAM DIŞI** |
| `completedAt` | timestamp | NULL | Tamamlanma zamanı |
| `createdAt` | timestamp | NOT NULL, auto | Oluşturulma zamanı |
| `updatedAt` | timestamp | NOT NULL, auto | Güncellenme zamanı |
| `deletedAt` | timestamp | NULL | Soft delete |
| `version` | integer | NOT NULL, default 1 | Optimistic locking |

### Indexes (Mevcut)

```sql
-- Kullanıcı bazlı sorgular
CREATE INDEX todos_user_id_idx ON todos(user_id);

-- Not bazlı sorgular
CREATE INDEX todos_note_id_idx ON todos(note_id);

-- Alt görev sorguları
CREATE INDEX todos_parent_id_idx ON todos(parent_id);

-- Durum filtreleme
CREATE INDEX todos_completed_idx ON todos(is_completed);

-- Öncelik sıralama
CREATE INDEX todos_priority_idx ON todos(priority);
```

## Validation Rules

### Title
- Zorunlu alan
- Minimum: 1 karakter
- Maximum: 200 karakter
- Trim edilmeli (baş/son boşluklar)

### Priority
- Enum değeri olmalı: `low`, `medium`, `high`
- Varsayılan: `medium`

### Parent-Child Relationship
- Alt görev sadece bir üst göreve bağlı olabilir
- Maksimum 2 seviye derinlik (ana görev → alt görev)
- Üst görev silindiğinde alt görevler de silinir (cascade)

### User Ownership
- Her görev bir kullanıcıya ait olmalı
- Kullanıcı sadece kendi görevlerini görebilir/düzenleyebilir

## State Transitions

```
┌─────────────┐         toggle          ┌─────────────┐
│             │ ───────────────────────► │             │
│   ACTIVE    │                          │  COMPLETED  │
│             │ ◄─────────────────────── │             │
└─────────────┘         toggle          └─────────────┘
       │                                        │
       │ delete                                 │ delete
       ▼                                        ▼
┌─────────────┐                          ┌─────────────┐
│   DELETED   │                          │   DELETED   │
│ (soft)      │                          │ (soft)      │
└─────────────┘                          └─────────────┘
       │
       │ 30 gün sonra veya permanent delete
       ▼
┌─────────────┐
│  PURGED     │
│ (hard)      │
└─────────────┘
```

## Query Patterns

### List Todos (with filters)
```sql
SELECT * FROM todos
WHERE user_id = :userId
  AND deleted_at IS NULL
  AND parent_id IS NULL  -- sadece ana görevler
  AND (:filter = 'all'
    OR (:filter = 'active' AND is_completed = false)
    OR (:filter = 'completed' AND is_completed = true))
ORDER BY
  is_completed ASC,  -- aktifler önce
  CASE priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END,
  position ASC,
  created_at DESC
LIMIT :limit OFFSET :offset
```

### Get Subtasks
```sql
SELECT * FROM todos
WHERE parent_id = :parentId
  AND deleted_at IS NULL
ORDER BY position ASC, created_at ASC
```

### Toggle Completion
```sql
UPDATE todos
SET
  is_completed = NOT is_completed,
  completed_at = CASE
    WHEN is_completed = false THEN unixepoch()
    ELSE NULL
  END,
  updated_at = unixepoch(),
  version = version + 1
WHERE id = :id AND version = :currentVersion
```

## Zod Schemas

```typescript
// Create Todo
export const createTodoSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  noteId: z.string().optional(),
  parentId: z.string().optional(),
});

// Update Todo
export const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  isCompleted: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

// List Todos Query
export const listTodosQuerySchema = z.object({
  filter: z.enum(['all', 'active', 'completed']).default('all'),
  noteId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
```
