# Research: Ayarlar Sayfası

**Feature**: 002-settings-page
**Date**: 2026-01-13

## Research Tasks

### 1. Tema Yönetimi Yaklaşımı

**Soru**: Next.js 15 App Router ile tema (dark/light/system) yönetimi nasıl yapılmalı?

**Araştırma Bulguları**:
- `next-themes` paketi popüler ancak projede yüklü değil
- Proje şu an hardcoded `className="dark"` kullanıyor (`src/app/layout.tsx:42`)
- localStorage + CSS custom properties ile manuel çözüm mümkün

**Karar**: Manuel tema provider oluşturulacak (next-themes eklenmeyecek)

**Gerekçe**:
- Yeni bağımlılık eklemeden mevcut yapı üzerine inşa edilir
- Sadece 3 tema seçeneği var (light/dark/system), basit bir context yeterli
- Constitution V (Simplicity) ilkesine uygun: "Dependencies MUST be justified"

**Alternatifler**:
- next-themes paketi: Daha fazla özellik ama ekstra bağımlılık
- CSS-only (prefers-color-scheme): System seçeneği dışında kullanıcı tercihi kaydedemez

---

### 2. Şifre Değiştirme Güvenliği

**Soru**: Şifre değiştirme akışı nasıl güvenli hale getirilir?

**Araştırma Bulguları**:
- Mevcut auth yapısı bcryptjs kullanıyor (`src/lib/auth/index.ts:3`)
- Mevcut şifre doğrulaması zorunlu olmalı (OWASP best practice)
- Minimum şifre uzunluğu: mevcut sistemde 6 karakter (`loginSchema`)

**Karar**:
1. Mevcut şifre + yeni şifre + onay şifresi formülü
2. bcryptjs.compare ile mevcut şifre doğrulama
3. bcryptjs.hash ile yeni şifre hashleme (salt rounds: 10)
4. Minimum 8 karakter zorunluluğu (spec'te belirtildi)

**Gerekçe**: OWASP güvenlik standartlarına uygun, mevcut auth yapısı ile tutarlı

---

### 3. Hesap Silme ve KVKK/GDPR

**Soru**: Hesap silme işlemi nasıl ele alınmalı?

**Araştırma Bulguları**:
- Mevcut schema'da tüm ilişkili tablolarda `onDelete: 'cascade'` tanımlı
- users tablosu silindiğinde: notes, folders, tags, todos, notifications, syncMetadata otomatik silinir
- GDPR/KVKK: Kullanıcının verilerini silme hakkı var

**Karar**:
1. Şifre doğrulaması ile hesap silme onayı
2. Cascade delete mevcut DB yapısı ile otomatik çalışır
3. Session invalidate edilmeli
4. Geri dönüşü olmadığına dair uyarı gösterilmeli

**Gerekçe**: Mevcut DB yapısı zaten uygun, ekstra iş gerekmiyor

---

### 4. Profil Güncelleme Alanları

**Soru**: Hangi profil alanları güncellenebilir olmalı?

**Araştırma Bulguları**:
- users tablosu: id, email, name, password, emailVerified, verificationToken, resetToken, resetTokenExpiry, avatar, createdAt, updatedAt
- email değişikliği doğrulama akışı gerektirir (karmaşık)
- avatar için UploadThing entegrasyonu mevcut

**Karar**:
- name: Güncellenebilir
- avatar: Bu fazda scope dışı (UploadThing entegrasyonu ayrı iş)
- email: Salt okunur (spec FR-010)

**Gerekçe**: MVP scope'u için sadece ad değişikliği yeterli, avatar/email sonraki fazlarda

---

### 5. Form Kütüphanesi

**Soru**: Form yönetimi için hangi yaklaşım kullanılmalı?

**Araştırma Bulguları**:
- Mevcut todo-form.tsx: React state + onChange handler kullanıyor
- react-hook-form paketi yüklü DEĞİL
- Zod validation mevcut ve yaygın kullanılıyor

**Karar**: Mevcut pattern takip edilecek (React state + Zod validation)

**Gerekçe**:
- Yeni bağımlılık eklemeden mevcut yapı ile tutarlı
- Basit formlar için react-hook-form overkill
- Constitution V: "New abstractions MUST solve at least 3 concrete use cases"

---

### 6. Tab Navigation

**Soru**: Ayarlar sekmelerini nasıl organize etmeliyiz?

**Araştırma Bulguları**:
- @radix-ui/react-tabs paketi zaten yüklü
- Shadcn/UI tabs component mevcut olabilir veya eklenebilir

**Karar**: 3 sekme yapısı
1. Profil (ad, email görüntüleme)
2. Güvenlik (şifre değiştirme)
3. Görünüm (tema seçimi) + Hesap (silme)

**Gerekçe**: Mantıksal gruplama, kullanıcı beklentileri ile uyumlu

---

## Resolved Clarifications

| Item | Resolution |
|------|------------|
| Tema storage | localStorage (DB gerektirmez) |
| Şifre min length | 8 karakter (spec'ten) |
| Avatar upload | Scope dışı (sonraki faz) |
| Email değişikliği | Scope dışı (spec FR-010) |
| Form library | Native React state + Zod |
| Tab structure | 3 sekme: Profil, Güvenlik, Görünüm & Hesap |

## Dependencies to Add

Yeni bağımlılık gerekmiyor. Mevcut paketler yeterli:
- @radix-ui/react-tabs (zaten yüklü)
- bcryptjs (zaten yüklü)
- zod (zaten yüklü)

## Implementation Notes

1. **Theme Provider**: `src/lib/theme/theme-provider.tsx` oluşturulacak
   - useEffect ile localStorage'dan okuma
   - document.documentElement.classList ile tema uygulama
   - System seçeneği için matchMedia('(prefers-color-scheme: dark)')

2. **API Routes**: RESTful pattern
   - `GET /api/user` - Profil bilgileri
   - `PATCH /api/user` - Profil güncelleme
   - `POST /api/user/password` - Şifre değiştirme
   - `DELETE /api/user` - Hesap silme

3. **Validation**: Zod schemas
   - updateProfileSchema: { name: string }
   - changePasswordSchema: { currentPassword, newPassword, confirmPassword }
   - deleteAccountSchema: { password: string }
