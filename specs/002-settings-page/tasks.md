# Tasks: Ayarlar Sayfası (Settings Page)

**Input**: Design documents from `/specs/002-settings-page/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Testler bu fazda dahil değil (spec'te talep edilmedi)

**Organization**: Görevler user story'lere göre gruplandırılmıştır. Her story bağımsız olarak implement edilebilir ve test edilebilir.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Paralel çalıştırılabilir (farklı dosyalar, bağımlılık yok)
- **[Story]**: Görevin ait olduğu user story (US1, US2, US3, US4)
- Açıklamalarda tam dosya yolları belirtilmiştir

## Path Conventions

```text
src/
├── app/(main)/settings/page.tsx       # Ayarlar sayfası
├── app/api/user/                       # User API endpoints
├── components/settings/                # Settings UI components
├── lib/hooks/use-user.ts              # User hooks
├── lib/validations/user.ts            # Zod schemas
└── lib/theme/theme-provider.tsx       # Theme context
```

---

## Phase 1: Setup (Paylaşılan Altyapı)

**Purpose**: Proje yapısı ve temel bağımlılıklar

- [x] T001 [P] Shadcn Tabs component ekle: `npx shadcn@latest add tabs`
- [x] T002 [P] Settings component dizinini oluştur: `src/components/settings/`
- [x] T003 [P] User API dizin yapısını oluştur: `src/app/api/user/password/` ve `src/app/api/user/delete/`

---

## Phase 2: Foundational (Temel Altyapı)

**Purpose**: Tüm user story'ler için gerekli olan temel bileşenler

**⚠️ KRİTİK**: User story implementasyonu bu faz tamamlanmadan başlayamaz

- [x] T004 Zod validation schema'larını oluştur: `src/lib/validations/user.ts`
  - `updateProfileSchema` (name validation)
  - `changePasswordSchema` (password validation with refine)
  - `deleteAccountSchema` (password + confirmation)
  - Type exports: `UpdateProfileInput`, `ChangePasswordInput`, `DeleteAccountInput`

- [x] T005 User response type'larını tanımla: `src/lib/validations/user.ts`
  - `UserProfileResponse` interface
  - `PasswordChangeResponse` interface
  - `DeleteAccountResponse` interface

- [x] T006 [P] Settings tabs component oluştur: `src/components/settings/settings-tabs.tsx`
  - Radix UI Tabs kullanarak 3 sekme: Profil, Güvenlik, Görünüm & Hesap
  - Responsive tasarım (mobile/desktop)

**Checkpoint**: Temel altyapı hazır - user story implementasyonu başlayabilir

---

## Phase 3: User Story 1 - Profil Bilgileri (Priority: P1) 🎯 MVP

**Goal**: Kullanıcı profil bilgilerini (ad, email) görüntüleyebilir ve adını güncelleyebilir

**Independent Test**: Ayarlar sayfasına gidip ad değiştirip kaydettikten sonra sidebar'da yeni adın görünmesiyle test edilebilir

### API Implementation

- [x] T007 [US1] GET/PATCH `/api/user` endpoint oluştur: `src/app/api/user/route.ts`
  - GET: Mevcut kullanıcı profil bilgilerini döndür (id, name, email, avatar, createdAt)
  - PATCH: Ad güncelleme (Zod validation ile)
  - Auth kontrolü: `auth()` ile session doğrulama
  - Error handling: 401 Unauthorized, 400 Validation Error, 500 Internal Error

### Hooks Implementation

- [x] T008 [US1] useUser hook oluştur: `src/lib/hooks/use-user.ts`
  - `useUser()`: TanStack Query ile profil bilgilerini fetch et
  - `useUpdateProfile()`: Profil güncelleme mutation (optimistic update ile)
  - Query invalidation: Başarılı güncelleme sonrası cache temizleme

### UI Implementation

- [x] T009 [US1] Profile form component oluştur: `src/components/settings/profile-form.tsx`
  - Name input alanı (controlled component)
  - Email alanı (salt okunur, disabled)
  - Avatar gösterimi (salt okunur)
  - Hesap oluşturma tarihi gösterimi
  - "Kaydet" butonu (loading state ile)
  - Zod validation hata mesajları
  - Toast bildirim (başarı/hata)

### Page Assembly

- [x] T010 [US1] Settings sayfası oluştur: `src/app/(main)/settings/page.tsx`
  - Settings tabs wrapper
  - Profile form (Profil sekmesi içinde)
  - Loading skeleton state
  - Error boundary

**Checkpoint**: User Story 1 tamamlandı - profil görüntüleme ve güncelleme çalışıyor

---

## Phase 4: User Story 2 - Şifre Değiştirme (Priority: P2)

**Goal**: Kullanıcı mevcut şifresini doğrulayarak yeni şifre belirleyebilir

**Independent Test**: Mevcut şifre ile giriş yapıp, yeni şifre belirleyip, çıkış yapıp yeni şifre ile tekrar giriş yaparak test edilebilir

### API Implementation

- [x] T011 [US2] POST `/api/user/password` endpoint oluştur: `src/app/api/user/password/route.ts`
  - Mevcut şifre doğrulama (bcryptjs.compare)
  - Yeni şifre hashleme (bcryptjs.hash, salt rounds: 10)
  - DB güncelleme (users.password + updatedAt)
  - Error handling: 400 "Mevcut şifre hatalı", 400 "Şifreler eşleşmiyor"

### Hooks Implementation

- [x] T012 [US2] useChangePassword hook ekle: `src/lib/hooks/use-user.ts`
  - `useChangePassword()`: Şifre değiştirme mutation
  - Form reset on success
  - Error state handling

### UI Implementation

- [x] T013 [US2] Password form component oluştur: `src/components/settings/password-form.tsx`
  - Mevcut şifre input (type="password")
  - Yeni şifre input (type="password")
  - Şifre onayı input (type="password")
  - Şifre gücü göstergesi (opsiyonel)
  - "Şifre Değiştir" butonu (loading state)
  - Validation hata mesajları
  - Toast bildirim

### Page Integration

- [x] T014 [US2] Settings sayfasına password form ekle: `src/app/(main)/settings/page.tsx`
  - Güvenlik sekmesine password form entegrasyonu

**Checkpoint**: User Story 2 tamamlandı - şifre değiştirme çalışıyor

---

## Phase 5: User Story 3 - Tema Tercihi (Priority: P3)

**Goal**: Kullanıcı açık/koyu tema veya sistem teması arasında seçim yapabilir

**Independent Test**: Tema değiştirip sayfayı yeniledikten sonra seçilen temanın korunduğunu doğrulayarak test edilebilir

### Theme Provider Implementation

- [x] T015 [US3] Theme provider oluştur: `src/lib/theme/theme-provider.tsx`
  - ThemeContext ve ThemeProvider component
  - `useTheme()` hook export
  - localStorage okuma/yazma ('bread-note-theme' key)
  - System theme detection: `window.matchMedia('(prefers-color-scheme: dark)')`
  - Real-time system theme change listener
  - document.documentElement.classList manipulation

- [x] T016 [US3] Root layout'a ThemeProvider ekle: `src/app/layout.tsx`
  - ThemeProvider wrapper (SessionProvider içinde)
  - Hydration mismatch önleme (suppressHydrationWarning)
  - Initial theme flash önleme (script veya className)

### UI Implementation

- [x] T017 [US3] Theme selector component oluştur: `src/components/settings/theme-selector.tsx`
  - 3 seçenek: Açık, Koyu, Sistem
  - Radio group veya segmented control UI
  - Seçili tema vurgusu
  - Anında tema uygulama (sayfa yenilemesi gerektirmez)

### Page Integration

- [x] T018 [US3] Settings sayfasına theme selector ekle: `src/app/(main)/settings/page.tsx`
  - Görünüm & Hesap sekmesine theme selector entegrasyonu

**Checkpoint**: User Story 3 tamamlandı - tema seçimi çalışıyor

---

## Phase 6: User Story 4 - Hesap Silme (Priority: P4)

**Goal**: Kullanıcı hesabını kalıcı olarak silebilir (KVKK/GDPR uyumu)

**Independent Test**: Test hesabı oluşturup, silme işlemi yapıp, aynı email ile tekrar kayıt olmayı deneyerek test edilebilir

### API Implementation

- [x] T019 [US4] POST `/api/user/delete` endpoint oluştur: `src/app/api/user/delete/route.ts`
  - Şifre doğrulama (bcryptjs.compare)
  - "SİL" confirmation kontrolü
  - User silme (cascade ile tüm ilişkili veriler silinir)
  - Session invalidation işaretleme
  - Success response

### Hooks Implementation

- [x] T020 [US4] useDeleteAccount hook ekle: `src/lib/hooks/use-user.ts`
  - `useDeleteAccount()`: Hesap silme mutation
  - Başarı sonrası signOut ve redirect

### UI Implementation

- [x] T021 [US4] Delete account dialog oluştur: `src/components/settings/delete-account-dialog.tsx`
  - Alert dialog (Radix UI Dialog)
  - Uyarı mesajı: "Bu işlem geri alınamaz"
  - Şifre input alanı
  - "SİL" yazma onay alanı
  - "Hesabı Sil" butonu (destructive variant, loading state)
  - "İptal" butonu
  - Validation hata mesajları

### Page Integration

- [x] T022 [US4] Settings sayfasına delete account ekle: `src/app/(main)/settings/page.tsx`
  - Görünüm & Hesap sekmesine "Hesabı Sil" bölümü
  - Tehlike bölgesi styling (border-destructive)

**Checkpoint**: User Story 4 tamamlandı - hesap silme çalışıyor

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Tüm user story'leri etkileyen iyileştirmeler

- [x] T023 [P] Keyboard accessibility kontrolü - tüm form elemanları tab ile erişilebilir olmalı
- [x] T024 [P] Loading state'leri gözden geçir - 300ms üzeri işlemlerde spinner gösterilmeli
- [x] T025 [P] Error boundary ekle: `src/app/(main)/settings/error.tsx`
- [x] T026 [P] Mobile responsive kontrol - tüm formlar mobilde düzgün görünmeli
- [x] T027 Build ve lint kontrolü: `npm run build && npm run lint`
- [x] T028 quickstart.md manual test checklist'i doğrula

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────┐
                      ├──→ Phase 2 (Foundational) ──→ [GATE]
Phase 1 parallel ─────┘                                 │
                                                        ↓
                         ┌─────────────────────────────────────────┐
                         │  User Stories (Phase 3-6)               │
                         │  Tümü Phase 2'ye bağlı                  │
                         │  Birbirinden bağımsız implementasyon    │
                         └─────────────────────────────────────────┘
                                                        │
                                                        ↓
                                              Phase 7 (Polish)
```

### User Story Dependencies

| Story | Bağımlılık | Paralel? |
|-------|------------|----------|
| US1 (Profil) | Phase 2 | Evet - Phase 2 sonrası başlayabilir |
| US2 (Şifre) | Phase 2 | Evet - US1'den bağımsız |
| US3 (Tema) | Phase 2 | Evet - US1, US2'den bağımsız |
| US4 (Hesap Silme) | Phase 2 | Evet - Diğerlerinden bağımsız |

### Within Each User Story

1. API endpoint → Hooks → UI Component → Page Integration

### Parallel Opportunities

**Phase 1 (Setup):**
```bash
# Tüm T001-T003 paralel çalıştırılabilir
T001: npx shadcn@latest add tabs
T002: mkdir -p src/components/settings/
T003: mkdir -p src/app/api/user/password/ src/app/api/user/delete/
```

**Phase 2 (Foundational):**
```bash
# T004-T005 sıralı (aynı dosya)
# T006 paralel çalıştırılabilir
T006: settings-tabs.tsx (farklı dosya)
```

**User Stories (Phase 3-6):**
```bash
# Farklı geliştiriciler paralel çalışabilir:
Developer A: US1 (T007-T010)
Developer B: US2 (T011-T014)
Developer C: US3 (T015-T018)
Developer D: US4 (T019-T022)
```

---

## Parallel Example: User Story 1

```bash
# Sıralı çalıştırılmalı (bağımlılık var):
T007 (API) → T008 (Hooks) → T009 (UI) → T010 (Page)

# Sebep: Hook API'ye, UI Hook'a, Page UI'a bağımlı
```

## Parallel Example: All User Stories

```bash
# Phase 2 tamamlandıktan sonra:
# Tüm user story'ler paralel başlayabilir

Agent 1: "US1 - Profile API ve UI implementasyonu"
Agent 2: "US2 - Password change implementasyonu"
Agent 3: "US3 - Theme system implementasyonu"
Agent 4: "US4 - Delete account implementasyonu"
```

---

## Implementation Strategy

### MVP First (Sadece User Story 1)

1. ✅ Phase 1: Setup tamamla
2. ✅ Phase 2: Foundational tamamla
3. ✅ Phase 3: User Story 1 tamamla
4. 🧪 **DURDUR ve DOĞRULA**: US1'i bağımsız test et
5. 🚀 Deploy/demo hazır

### Incremental Delivery

```
Setup + Foundational → Foundation hazır
       ↓
+ User Story 1 → Test → Deploy (MVP!)
       ↓
+ User Story 2 → Test → Deploy
       ↓
+ User Story 3 → Test → Deploy
       ↓
+ User Story 4 → Test → Deploy
       ↓
+ Polish → Final Release
```

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1)**

Bu kapsam ile:
- Ayarlar sayfası açılır
- Kullanıcı profilini görüntüler
- Adını değiştirebilir
- Temel değer sunulmuş olur

---

## Notes

- [P] görevler = farklı dosyalar, bağımlılık yok
- [Story] label = görevin ait olduğu user story (US1-US4)
- Her user story bağımsız olarak tamamlanabilir ve test edilebilir
- Her görev veya mantıksal grup sonrası commit yapın
- Herhangi bir checkpoint'te durarak story'yi bağımsız doğrulayın
- Kaçının: belirsiz görevler, aynı dosya çakışmaları, story bağımsızlığını bozan bağımlılıklar
