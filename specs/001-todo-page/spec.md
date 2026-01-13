# Feature Specification: To-Do Sayfası

**Feature Branch**: `001-todo-page`
**Created**: 2025-01-13
**Status**: Draft
**Input**: User description: "To-Do sayfasının oluşturulması"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - To-Do Listesi Görüntüleme (Priority: P1)

Kullanıcı, tüm yapılacak görevlerini tek bir sayfada listeleyebilir ve durumlarını görebilir.

**Why this priority**: Temel kullanım senaryosu - kullanıcıların görevlerini görmeden yönetemezler.

**Independent Test**: Kullanıcı giriş yaptıktan sonra To-Do sayfasına gidip mevcut görevlerini listeleyebilir.

**Acceptance Scenarios**:

1. **Given** kullanıcı giriş yapmış, **When** To-Do sayfasına gider, **Then** tüm görevleri öncelik sırasına göre listeler
2. **Given** kullanıcının görevleri var, **When** sayfayı görüntüler, **Then** her görevin başlığı, durumu ve önceliği görünür
3. **Given** kullanıcının hiç görevi yok, **When** sayfayı görüntüler, **Then** "Henüz görev yok" mesajı ve yeni görev ekleme butonu görünür

---

### User Story 2 - Yeni Görev Oluşturma (Priority: P1)

Kullanıcı, hızlıca yeni bir görev ekleyebilir.

**Why this priority**: Görev ekleme olmadan uygulama kullanışsız olur - temel fonksiyon.

**Independent Test**: Kullanıcı "Yeni Görev" butonuna tıklayıp görev başlığı girerek yeni görev oluşturabilir.

**Acceptance Scenarios**:

1. **Given** kullanıcı To-Do sayfasında, **When** "Yeni Görev" butonuna tıklar, **Then** görev oluşturma formu açılır
2. **Given** form açık, **When** başlık girer ve kaydeder, **Then** görev listeye eklenir ve form kapanır
3. **Given** form açık, **When** başlık boş bırakılıp kaydedilmeye çalışılır, **Then** hata mesajı gösterilir

---

### User Story 3 - Görev Tamamlama (Priority: P1)

Kullanıcı, bir görevi tamamlandı olarak işaretleyebilir veya işareti kaldırabilir.

**Why this priority**: Görev yönetiminin temel amacı ilerlemeyi takip etmek.

**Independent Test**: Kullanıcı herhangi bir görevin yanındaki checkbox'a tıklayarak durumunu değiştirebilir.

**Acceptance Scenarios**:

1. **Given** tamamlanmamış bir görev var, **When** checkbox'a tıklar, **Then** görev tamamlandı olarak işaretlenir ve görsel olarak farklılaşır
2. **Given** tamamlanmış bir görev var, **When** checkbox'a tekrar tıklar, **Then** görev tamamlanmamış durumuna döner
3. **Given** görev tamamlandı, **When** liste görüntülenir, **Then** tamamlanan görevler listenin altında görünür

---

### User Story 4 - Görev Düzenleme ve Silme (Priority: P2)

Kullanıcı, mevcut bir görevi düzenleyebilir veya silebilir.

**Why this priority**: Hata düzeltme ve temizlik için önemli, ama temel akıştan sonra gelebilir.

**Independent Test**: Kullanıcı bir görevin üzerine tıklayarak düzenleyebilir veya sil butonuyla kaldırabilir.

**Acceptance Scenarios**:

1. **Given** bir görev var, **When** düzenle butonuna tıklar, **Then** başlık düzenlenebilir hale gelir
2. **Given** düzenleme modunda, **When** yeni başlık girip kaydeder, **Then** görev güncellenir
3. **Given** bir görev var, **When** sil butonuna tıklar, **Then** onay istenir
4. **Given** silme onayı istendi, **When** kullanıcı onaylar, **Then** görev listeden kaldırılır

---

### User Story 5 - Görev Önceliklendirme (Priority: P2)

Kullanıcı, görevlere öncelik atayabilir (düşük, orta, yüksek).

**Why this priority**: Organizasyon için önemli ama temel CRUD'dan sonra eklenebilir.

**Independent Test**: Kullanıcı görev oluştururken veya düzenlerken öncelik seçebilir.

**Acceptance Scenarios**:

1. **Given** görev oluşturma formu açık, **When** öncelik seçer, **Then** görev seçilen öncelikle kaydedilir
2. **Given** görevler listede, **When** sayfa görüntülenir, **Then** yüksek öncelikli görevler görsel olarak vurgulanır
3. **Given** farklı önceliklerde görevler var, **When** liste görüntülenir, **Then** görevler öncelik sırasına göre sıralanır

---

### User Story 6 - Alt Görevler (Priority: P3)

Kullanıcı, bir göreve alt görevler ekleyebilir.

**Why this priority**: Gelişmiş özellik - temel görev yönetimi tamamlandıktan sonra eklenebilir.

**Independent Test**: Kullanıcı bir göreve alt görev ekleyerek hiyerarşik yapı oluşturabilir.

**Acceptance Scenarios**:

1. **Given** bir görev var, **When** "Alt görev ekle" butonuna tıklar, **Then** alt görev formu açılır
2. **Given** alt görev eklendi, **When** ana görev görüntülenir, **Then** alt görevler ana görevin altında girintili gösterilir
3. **Given** tüm alt görevler tamamlandı, **When** ana görev görüntülenir, **Then** ilerleme %100 olarak gösterilir

---

### Edge Cases

- Kullanıcı çok uzun bir görev başlığı girerse ne olur? (Maksimum 200 karakter ile sınırlandırılır)
- Kullanıcı aynı anda birden fazla görev düzenlemeye çalışırsa? (Sadece bir görev düzenlenebilir, diğerleri kapanır)
- Offline durumda görev eklenirse ne olur? (Yerel olarak kaydedilir, çevrimiçi olunca senkronize edilir)
- Yanlışlıkla silinen görev kurtarılabilir mi? (30 gün boyunca çöp kutusundan geri alınabilir)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem, kullanıcının tüm görevlerini sayfalanmış liste olarak göstermeli
- **FR-002**: Sistem, kullanıcının yeni görev oluşturmasına izin vermeli (başlık zorunlu)
- **FR-003**: Sistem, görevlerin tamamlandı/tamamlanmadı durumunu toggle edebilmeli
- **FR-004**: Sistem, mevcut görevlerin başlığını düzenlemeye izin vermeli
- **FR-005**: Sistem, görevlerin silinmesine izin vermeli (onay gerekli)
- **FR-006**: Sistem, görevlere öncelik atanmasına izin vermeli (düşük, orta, yüksek)
- **FR-007**: Sistem, görevleri öncelik sırasına göre sıralamalı
- **FR-008**: Sistem, ana görevlere alt görev eklenmesine izin vermeli
- **FR-009**: Sistem, tamamlanan görevleri görsel olarak farklı göstermeli
- **FR-010**: Sistem, görev değişikliklerini çevrimdışı olarak yerel depolamaya kaydetmeli
- **FR-011**: Sistem, görevleri duruma göre filtrelemeye izin vermeli (tümü, aktif, tamamlanan)

### Key Entities

- **Todo (Görev)**: Kullanıcının yapması gereken bir iş. Başlık, durum (tamamlandı/tamamlanmadı), öncelik (düşük/orta/yüksek), oluşturulma tarihi, üst görev referansı (isteğe bağlı), not referansı (isteğe bağlı). Not: Son tarih ve hatırlatıcı özellikleri bu sürümde kapsam dışı.
- **User (Kullanıcı)**: Görevlerin sahibi. Her kullanıcı sadece kendi görevlerini görebilir ve yönetebilir

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kullanıcılar yeni bir görev oluşturma işlemini 5 saniye içinde tamamlayabilmeli
- **SC-002**: Sayfa 100 görev içerdiğinde bile 2 saniye içinde yüklenmeli
- **SC-003**: Görev durumu değişikliği anlık olarak (500ms altında) görsel yansımalı
- **SC-004**: Çevrimdışı eklenen görevler, çevrimiçi olunduğunda 30 saniye içinde senkronize olmalı
- **SC-005**: Kullanıcıların %90'ı ilk kullanımda yardım almadan görev ekleyebilmeli
- **SC-006**: Tamamlanan görevler açıkça ayırt edilebilmeli (görsel fark kullanıcı testlerinde %95 doğru tanımlanmalı)

## Clarifications

### Session 2025-01-13

- Q: Görev-Not ilişkisi nasıl olmalı? → A: Hibrit - Görevler opsiyonel olarak notlara bağlanabilir
- Q: Son tarih (due date) desteği olmalı mı? → A: Hayır - Sadece öncelik sistemi yeterli, son tarih ve hatırlatıcı özellikleri bu kapsamda yok
- Q: Görev filtreleme nasıl olmalı? → A: Temel filtreler - Sadece durum bazlı (tümü/aktif/tamamlanan)

## Assumptions

Bu spesifikasyon aşağıdaki varsayımlara dayanmaktadır:

1. **Kimlik Doğrulama**: Kullanıcılar mevcut kimlik doğrulama sistemi ile giriş yapmış olacak
2. **Veri Saklama**: Mevcut sunucu ve yerel depolama altyapısı kullanılacak
3. **Sayfa Erişimi**: To-Do sayfası sidebar'dan erişilebilir olacak (mevcut navigasyon yapısına entegre)
4. **Mobil Uyumluluk**: Sayfa responsive olacak ve mobil cihazlarda kullanılabilir olacak
5. **Offline Desteği**: Mevcut PWA altyapısı kullanılarak offline çalışma desteklenecek
6. **Görev Başlığı**: Maksimum 200 karakter ile sınırlı olacak
7. **Varsayılan Öncelik**: Yeni görevler varsayılan olarak "orta" öncelikte oluşturulacak
