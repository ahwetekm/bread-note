# Quickstart: To-Do Sayfası

**Feature**: 001-todo-page
**Date**: 2025-01-13

## Önkoşullar

1. Node.js 18+ kurulu
2. Proje bağımlılıkları yüklenmiş (`npm install`)
3. Turso veritabanı yapılandırılmış (`.env.local`)
4. Development server çalışıyor (`npm run dev`)

## Hızlı Test

### 1. Uygulamaya Giriş Yap

```
http://localhost:3000/login
```

Test kullanıcısı yoksa kayıt ol:
```
http://localhost:3000/register
```

### 2. To-Do Sayfasına Git

```
http://localhost:3000/todos
```

### 3. Temel İşlemler

#### Yeni Görev Ekle
1. "Yeni Görev" butonuna tıkla
2. Başlık gir (örn: "Market alışverişi")
3. Öncelik seç (düşük/orta/yüksek)
4. Kaydet

#### Görevi Tamamla
1. Görev yanındaki checkbox'a tıkla
2. Görev üstü çizili ve soluk görünür

#### Görevi Düzenle
1. Görev üzerindeki kalem ikonuna tıkla
2. Başlığı değiştir
3. Kaydet

#### Görevi Sil
1. Görev üzerindeki çöp kutusu ikonuna tıkla
2. Onay dialogunda "Sil" butonuna tıkla

#### Filtreleme
- **Tümü**: Tüm görevler
- **Aktif**: Sadece tamamlanmamış görevler
- **Tamamlanan**: Sadece tamamlanmış görevler

## API Test (curl)

### Liste Getir
```bash
curl -X GET "http://localhost:3000/api/todos?filter=all" \
  -H "Cookie: authjs.session-token=YOUR_SESSION"
```

### Yeni Görev Oluştur
```bash
curl -X POST "http://localhost:3000/api/todos" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION" \
  -d '{"title": "Test görevi", "priority": "high"}'
```

### Görevi Güncelle
```bash
curl -X PATCH "http://localhost:3000/api/todos/TODO_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION" \
  -d '{"isCompleted": true}'
```

### Görevi Sil
```bash
curl -X DELETE "http://localhost:3000/api/todos/TODO_ID" \
  -H "Cookie: authjs.session-token=YOUR_SESSION"
```

## Offline Test

1. Browser DevTools aç (F12)
2. Network sekmesine git
3. "Offline" modunu etkinleştir
4. Yeni görev ekle → Yerel olarak kaydedilir
5. "Online" moduna geri dön → Otomatik senkronize olur

## Beklenen Davranışlar

| Senaryo | Beklenen Sonuç |
|---------|----------------|
| Boş liste | "Henüz görev yok" mesajı görünür |
| Yeni görev | Liste başına eklenir, form kapanır |
| Tamamlama | Checkbox işaretlenir, görsel değişir |
| Silme | Onay istenir, görev listeden kalkar |
| Filtreleme | Sadece seçili durumdaki görevler görünür |
| Offline ekleme | Görev yerel olarak eklenir, sync icon görünür |

## Sorun Giderme

### Görevler görünmüyor
- Session'ın geçerli olduğundan emin ol
- Browser cache'i temizle
- DevTools Console'da hata kontrolü yap

### API 401 hatası
- Tekrar giriş yap
- Cookie'lerin silinmediğinden emin ol

### Senkronizasyon çalışmıyor
- Internet bağlantısını kontrol et
- IndexedDB'yi temizle (DevTools > Application > IndexedDB > BreadNoteDB > Delete)
