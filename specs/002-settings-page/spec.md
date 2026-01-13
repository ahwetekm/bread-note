# Feature Specification: Ayarlar Sayfası (Settings Page)

**Feature Branch**: `002-settings-page`
**Created**: 2026-01-13
**Status**: Draft
**Input**: User description: "ayarlar sayfasını oluşturalım"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Profil Bilgileri Görüntüleme ve Düzenleme (Priority: P1)

Kullanıcı, ayarlar sayfasına giderek mevcut profil bilgilerini (ad, email, avatar) görüntüleyebilir ve güncelleyebilir.

**Why this priority**: Kullanıcıların temel kimlik bilgilerini yönetebilmesi en kritik ayarlar fonksiyonudur. Tüm uygulamada kullanıcı adı ve avatarı gösterilmektedir.

**Independent Test**: Ayarlar sayfasına gidip ad değiştirip kaydettikten sonra sidebar'da yeni adın görünmesiyle test edilebilir.

**Acceptance Scenarios**:

1. **Given** kullanıcı giriş yapmış durumda, **When** sidebar'dan "Settings" linkine tıklar, **Then** ayarlar sayfası açılır ve mevcut profil bilgileri (ad, email) gösterilir
2. **Given** kullanıcı ayarlar sayfasında, **When** ad alanını değiştirip "Kaydet" butonuna tıklar, **Then** değişiklik veritabanına kaydedilir ve başarı mesajı gösterilir
3. **Given** kullanıcı ayarlar sayfasında, **When** boş bir ad girip kaydetmeye çalışır, **Then** hata mesajı gösterilir ve kaydetme engellenir

---

### User Story 2 - Şifre Değiştirme (Priority: P2)

Kullanıcı mevcut şifresini doğrulayarak yeni şifre belirleyebilir.

**Why this priority**: Güvenlik açısından önemli ancak profil bilgilerinden sonra gelir çünkü günlük kullanımda daha az ihtiyaç duyulur.

**Independent Test**: Mevcut şifre ile giriş yapıp, yeni şifre belirleyip, çıkış yapıp yeni şifre ile tekrar giriş yaparak test edilebilir.

**Acceptance Scenarios**:

1. **Given** kullanıcı ayarlar sayfasında "Güvenlik" sekmesinde, **When** mevcut şifre ve yeni şifre (2 kez) girip "Şifre Değiştir" butonuna tıklar, **Then** şifre güncellenir ve başarı mesajı gösterilir
2. **Given** kullanıcı şifre değiştirme formunda, **When** yanlış mevcut şifre girer, **Then** "Mevcut şifre hatalı" hatası gösterilir
3. **Given** kullanıcı şifre değiştirme formunda, **When** yeni şifre ve onay şifresi eşleşmiyorsa, **Then** "Şifreler eşleşmiyor" hatası gösterilir

---

### User Story 3 - Tema Tercihi (Priority: P3)

Kullanıcı açık/koyu tema veya sistem teması arasında seçim yapabilir.

**Why this priority**: Kullanıcı deneyimini iyileştirir ancak uygulama zaten dark tema ile çalışmaktadır, bu nedenle önceliği düşük.

**Independent Test**: Tema değiştirip sayfayı yeniledikten sonra seçilen temanın korunduğunu doğrulayarak test edilebilir.

**Acceptance Scenarios**:

1. **Given** kullanıcı ayarlar sayfasında "Görünüm" sekmesinde, **When** tema seçeneğini "Açık" olarak değiştirir, **Then** uygulama açık temaya geçer ve tercih kaydedilir
2. **Given** kullanıcı "Sistem" temasını seçmiş, **When** işletim sistemi teması değişir, **Then** uygulama otomatik olarak yeni temaya uyum sağlar

---

### User Story 4 - Hesap Silme (Priority: P4)

Kullanıcı hesabını kalıcı olarak silebilir.

**Why this priority**: Nadir kullanılan ancak KVKK/GDPR uyumu için gerekli bir özellik.

**Independent Test**: Test hesabı oluşturup, silme işlemi yapıp, aynı email ile tekrar kayıt olmayı deneyerek test edilebilir.

**Acceptance Scenarios**:

1. **Given** kullanıcı ayarlar sayfasında "Hesap" sekmesinde, **When** "Hesabı Sil" butonuna tıklar, **Then** onay dialogu açılır
2. **Given** onay dialogu açık, **When** kullanıcı şifresini girip onaylar, **Then** hesap ve tüm veriler silinir, kullanıcı login sayfasına yönlendirilir
3. **Given** onay dialogu açık, **When** kullanıcı iptal eder, **Then** hiçbir değişiklik yapılmaz

---

### Edge Cases

- Kullanıcı aynı email ile farklı bir kullanıcı varken email değiştirmeye çalışırsa ne olur? → Hata mesajı gösterilir
- Çok kısa veya güvensiz şifre girilirse ne olur? → Validation hatası gösterilir (min 8 karakter)
- Avatar yüklenirken bağlantı kesilirse ne olur? → Hata mesajı ve tekrar deneme seçeneği
- Tema değişikliği localStorage'da saklanırken hata olursa ne olur? → Varsayılan tema kullanılır

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem, kullanıcının profil bilgilerini (ad, email, avatar) görüntülemesine izin vermeli
- **FR-002**: Sistem, kullanıcının adını güncelleyebilmesine izin vermeli
- **FR-003**: Sistem, kullanıcının mevcut şifresini doğrulayarak yeni şifre belirleyebilmesine izin vermeli
- **FR-004**: Sistem, yeni şifrenin minimum 8 karakter olmasını zorunlu kılmalı
- **FR-005**: Sistem, kullanıcının tema tercihini (açık/koyu/sistem) kaydedebilmeli
- **FR-006**: Sistem, tema tercihini tarayıcı localStorage'da saklamalı (server-side gerektirmez)
- **FR-007**: Sistem, kullanıcının hesabını kalıcı olarak silmesine izin vermeli (şifre doğrulaması ile)
- **FR-008**: Hesap silindiğinde, kullanıcıya ait tüm veriler (notlar, klasörler, etiketler, todolar) cascade olarak silinmeli
- **FR-009**: Sistem, form validation hatalarını kullanıcıya açık bir şekilde göstermeli
- **FR-010**: Email alanı salt-okunur olmalı (email değişikliği bu fazda desteklenmeyecek)

### Key Entities

- **User**: Mevcut kullanıcı bilgileri (id, name, email, avatar, password hash)
- **UserPreferences**: Tema tercihi gibi kullanıcı ayarları (localStorage'da saklanacak)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kullanıcılar profil bilgilerini 30 saniye içinde güncelleyebilmeli
- **SC-002**: Şifre değiştirme işlemi doğru validation mesajları ile kullanıcıyı yönlendirmeli
- **SC-003**: Tema değişikliği anında uygulanmalı (sayfa yenilemesi gerektirmemeli)
- **SC-004**: Hesap silme işlemi geri alınamaz olduğu konusunda kullanıcıyı uyarmalı
- **SC-005**: Tüm form işlemleri sırasında loading state gösterilmeli
