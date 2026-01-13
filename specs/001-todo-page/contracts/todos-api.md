# API Contract: Todos

**Feature**: 001-todo-page
**Base URL**: `/api/todos`
**Date**: 2025-01-13

## Authentication

Tüm endpoint'ler NextAuth.js session gerektirir. Unauthorized istekler `401` döner.

---

## Endpoints

### 1. List Todos

```http
GET /api/todos
```

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `filter` | string | `all` | `all` \| `active` \| `completed` |
| `noteId` | string | - | Belirli nota bağlı görevler |
| `limit` | number | 50 | Sayfa başına görev (1-100) |
| `offset` | number | 0 | Atlanacak görev sayısı |

**Response** `200 OK`:
```json
{
  "todos": [
    {
      "id": "abc123",
      "title": "Görev başlığı",
      "isCompleted": false,
      "priority": "high",
      "position": 0,
      "noteId": null,
      "parentId": null,
      "completedAt": null,
      "createdAt": "2025-01-13T10:00:00Z",
      "updatedAt": "2025-01-13T10:00:00Z",
      "subtaskCount": 3,
      "completedSubtaskCount": 1
    }
  ],
  "total": 42,
  "hasMore": true
}
```

**Error Responses**:
- `401 Unauthorized`: Session geçersiz
- `400 Bad Request`: Geçersiz query parametreleri

---

### 2. Create Todo

```http
POST /api/todos
```

**Request Body**:
```json
{
  "title": "Yeni görev",
  "priority": "medium",
  "noteId": "note123",
  "parentId": "parent456"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | 1-200 karakter |
| `priority` | string | ❌ | `low` \| `medium` \| `high` (default: `medium`) |
| `noteId` | string | ❌ | Bağlanacak not ID'si |
| `parentId` | string | ❌ | Üst görev ID'si (alt görev için) |

**Response** `201 Created`:
```json
{
  "id": "new123",
  "title": "Yeni görev",
  "isCompleted": false,
  "priority": "medium",
  "position": 0,
  "noteId": "note123",
  "parentId": "parent456",
  "completedAt": null,
  "createdAt": "2025-01-13T10:00:00Z",
  "updatedAt": "2025-01-13T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Validasyon hatası
- `401 Unauthorized`: Session geçersiz
- `404 Not Found`: noteId veya parentId geçersiz

---

### 3. Get Todo

```http
GET /api/todos/:id
```

**Response** `200 OK`:
```json
{
  "id": "abc123",
  "title": "Görev başlığı",
  "isCompleted": false,
  "priority": "high",
  "position": 0,
  "noteId": null,
  "parentId": null,
  "completedAt": null,
  "createdAt": "2025-01-13T10:00:00Z",
  "updatedAt": "2025-01-13T10:00:00Z",
  "subtasks": [
    {
      "id": "sub1",
      "title": "Alt görev 1",
      "isCompleted": true,
      "priority": "low",
      "position": 0
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Session geçersiz
- `404 Not Found`: Görev bulunamadı veya başka kullanıcıya ait

---

### 4. Update Todo

```http
PATCH /api/todos/:id
```

**Request Body** (partial update):
```json
{
  "title": "Güncellenmiş başlık",
  "priority": "high",
  "isCompleted": true,
  "position": 2
}
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | 1-200 karakter |
| `priority` | string | `low` \| `medium` \| `high` |
| `isCompleted` | boolean | Tamamlanma durumu |
| `position` | number | Sıralama pozisyonu |

**Response** `200 OK`:
```json
{
  "id": "abc123",
  "title": "Güncellenmiş başlık",
  "isCompleted": true,
  "priority": "high",
  "position": 2,
  "completedAt": "2025-01-13T12:00:00Z",
  "updatedAt": "2025-01-13T12:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Validasyon hatası
- `401 Unauthorized`: Session geçersiz
- `404 Not Found`: Görev bulunamadı
- `409 Conflict`: Version çakışması (optimistic lock)

---

### 5. Delete Todo

```http
DELETE /api/todos/:id
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Görev çöp kutusuna taşındı"
}
```

**Notes**:
- Soft delete yapılır (`deletedAt` set edilir)
- Alt görevler de cascade olarak silinir
- 30 gün sonra otomatik temizlenir

**Error Responses**:
- `401 Unauthorized`: Session geçersiz
- `404 Not Found`: Görev bulunamadı

---

### 6. Toggle Todo Completion

```http
PATCH /api/todos/:id/toggle
```

Kısa yol endpoint'i - sadece `isCompleted` durumunu toggle eder.

**Response** `200 OK`:
```json
{
  "id": "abc123",
  "isCompleted": true,
  "completedAt": "2025-01-13T12:00:00Z"
}
```

---

## Common Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Başlık zorunludur",
    "details": {
      "field": "title",
      "constraint": "required"
    }
  }
}
```

## Rate Limiting

- 100 istek/dakika per user
- `429 Too Many Requests` aşıldığında

## Pagination

- Maximum `limit`: 100
- Default `limit`: 50
- `hasMore`: Daha fazla sonuç olup olmadığını belirtir
