# Quickstart: Ayarlar Sayfası Implementasyonu

**Feature**: 002-settings-page
**Date**: 2026-01-13

## Ön Koşullar

- [x] Node.js 18+
- [x] pnpm veya npm
- [x] Turso veritabanı bağlantısı (.env.local)
- [x] Mevcut auth sistemi çalışır durumda

## Hızlı Başlangıç

### 1. Branch'e Geçiş

```bash
git checkout 002-settings-page
```

### 2. Geliştirme Sunucusu

```bash
npm run dev
# http://localhost:3000/settings
```

### 3. Dosya Yapısı Oluşturma

```bash
# Dizinleri oluştur
mkdir -p src/app/\(main\)/settings
mkdir -p src/app/api/user/password
mkdir -p src/app/api/user/delete
mkdir -p src/components/settings
mkdir -p src/lib/theme
```

## Implementasyon Sırası

### Faz 1: API Routes (Backend)

1. **Zod Validations** - `src/lib/validations/user.ts`
   ```typescript
   // updateProfileSchema, changePasswordSchema, deleteAccountSchema
   ```

2. **GET/PATCH /api/user** - `src/app/api/user/route.ts`
   ```typescript
   // Profil okuma ve güncelleme
   ```

3. **POST /api/user/password** - `src/app/api/user/password/route.ts`
   ```typescript
   // Şifre değiştirme
   ```

4. **POST /api/user/delete** - `src/app/api/user/delete/route.ts`
   ```typescript
   // Hesap silme
   ```

### Faz 2: Custom Hooks

5. **use-user.ts** - `src/lib/hooks/use-user.ts`
   ```typescript
   // useUser, useUpdateProfile, useChangePassword, useDeleteAccount
   ```

### Faz 3: Theme System

6. **Theme Provider** - `src/lib/theme/theme-provider.tsx`
   ```typescript
   // ThemeProvider context, useTheme hook
   ```

7. **Layout Entegrasyonu** - `src/app/layout.tsx` güncelle
   ```typescript
   // ThemeProvider wrap
   ```

### Faz 4: UI Components

8. **Tabs Component** - `src/components/ui/tabs.tsx` (Shadcn)
   ```bash
   npx shadcn@latest add tabs
   ```

9. **Settings Components**
   - `src/components/settings/profile-form.tsx`
   - `src/components/settings/password-form.tsx`
   - `src/components/settings/theme-selector.tsx`
   - `src/components/settings/delete-account-dialog.tsx`
   - `src/components/settings/settings-tabs.tsx`

### Faz 5: Page Assembly

10. **Settings Page** - `src/app/(main)/settings/page.tsx`
    ```typescript
    // Tüm componentleri birleştir
    ```

## Test Senaryoları

### Manuel Test Checklist

```markdown
## Profil
- [ ] Ayarlar sayfası açılıyor
- [ ] Mevcut ad gösteriliyor
- [ ] Ad değişikliği kaydediliyor
- [ ] Boş ad hata veriyor

## Şifre
- [ ] Mevcut şifre yanlış → hata
- [ ] Şifreler eşleşmiyor → hata
- [ ] Kısa şifre → hata
- [ ] Başarılı değişiklik → mesaj

## Tema
- [ ] Light tema çalışıyor
- [ ] Dark tema çalışıyor
- [ ] System tema çalışıyor
- [ ] Sayfa yenilenmesinde korunuyor

## Hesap Silme
- [ ] Onay dialogu açılıyor
- [ ] Yanlış şifre → hata
- [ ] Başarılı silme → login'e yönlendirme
```

## API Test Komutları

```bash
# Profil getir
curl -X GET http://localhost:3000/api/user \
  -H "Cookie: authjs.session-token=..."

# Profil güncelle
curl -X PATCH http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=..." \
  -d '{"name":"Yeni Ad"}'

# Şifre değiştir
curl -X POST http://localhost:3000/api/user/password \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=..." \
  -d '{"currentPassword":"eski123","newPassword":"Yeni1234","confirmPassword":"Yeni1234"}'
```

## Önemli Notlar

### Constitution Uyumu

- **Offline-First**: Tema localStorage'da, profil/şifre online
- **Performance**: API < 200ms, UI < 100ms
- **Type Safety**: Tüm input'lar Zod ile validate
- **Simplicity**: Mevcut pattern'ler takip edildi

### Bilinen Kısıtlamalar

- Email değişikliği bu fazda desteklenmiyor
- Avatar yükleme bu fazda desteklenmiyor
- Hesap silme geri alınamaz

## Kaynaklar

- [spec.md](./spec.md) - Feature spesifikasyonu
- [data-model.md](./data-model.md) - Veri modeli
- [contracts/user-api.yaml](./contracts/user-api.yaml) - API sözleşmesi
- [research.md](./research.md) - Araştırma notları
