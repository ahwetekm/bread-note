# Feature Specification: Not Arama Özelliği

**Feature Branch**: `001-search`
**Created**: 2026-01-13
**Status**: Draft
**Input**: User description: "arama kısmı çalılmıyor bunu yapılandıralım."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Başlık ile Not Arama (Priority: P1)

Kullanıcı, header'daki arama kutusuna bir anahtar kelime yazarak notlarını başlık veya içerik üzerinden arayabilmeli.

**Why this priority**: Bu özellik, arama fonksiyonunun temel kullanım senaryosudur. Kullanıcıların hızlıca istedikleri notu bulabilmesi için kritik öneme sahiptir.

**Independent Test**: Arama kutusuna "toplantı" yazıldığında, başlığında veya içeriğinde "toplantı" geçen notların listelenmesiyle test edilebilir.

**Acceptance Scenarios**:

1. **Given** kullanıcı dashboard'da, **When** arama kutusuna "proje" yazarsa, **Then** başlığında veya içeriğinde "proje" geçen tüm notlar listelenir
2. **Given** kullanıcı arama yapıyor, **When** arama terimi notlarla eşleşmezse, **Then** "Sonuç bulunamadı" mesajı gösterilir
3. **Given** kullanıcı arama kutusuna metin giriyor, **When** en az 2 karakter yazarsa, **Then** arama sonuçları gösterilmeye başlar

---

### User Story 2 - Arama Sonuçlarında Navigasyon (Priority: P2)

Kullanıcı, arama sonuçlarından bir nota tıklayarak direkt olarak o notun detay sayfasına gidebilmeli.

**Why this priority**: Arama sonuçlarının kullanılabilir olması, arama özelliğinin tamamlanması için gereklidir.

**Independent Test**: Arama sonucunda görünen bir nota tıklandığında, not detay sayfasına yönlendirme ile test edilebilir.

**Acceptance Scenarios**:

1. **Given** arama sonuçları görüntüleniyor, **When** kullanıcı bir sonuca tıklarsa, **Then** o notun detay sayfasına (`/notes/[id]`) yönlendirilir
2. **Given** arama sonuçları görüntüleniyor, **When** kullanıcı klavye ile sonuçlar arasında gezinirse, **Then** Enter tuşu ile seçili nota gidebilir

---

### User Story 3 - Klavye Kısayolu ile Arama (Priority: P3)

Kullanıcı, Ctrl+K (veya Cmd+K) tuş kombinasyonuyla hızlıca arama kutusuna odaklanabilmeli.

**Why this priority**: Güç kullanıcıları için verimlilik artırıcı bir özelliktir, ancak temel arama işlevselliği olmadan anlamsızdır.

**Independent Test**: Herhangi bir sayfada Ctrl+K tuşlarına basıldığında arama kutusunun aktif olmasıyla test edilebilir.

**Acceptance Scenarios**:

1. **Given** kullanıcı herhangi bir sayfada, **When** Ctrl+K (Mac'te Cmd+K) basarsa, **Then** arama kutusu odaklanır ve yazmaya hazır hale gelir
2. **Given** arama kutusu açık, **When** kullanıcı Escape tuşuna basarsa, **Then** arama kutusu kapanır ve odak kaldırılır

---

### Edge Cases

- Boş arama terimi girildiğinde ne olur? (Sonuç gösterilmez, kullanıcı bilgilendirilir)
- Çok uzun arama terimleri için (100+ karakter) nasıl davranılır? (Makul bir limite kırpılır)
- Özel karakterler (*, ?, ", ') arama teriminde kullanılırsa ne olur? (Güvenli şekilde işlenir, SQL injection engellenir)
- Silinmiş (çöp kutusundaki) notlar arama sonuçlarında gösterilir mi? (Hayır, yalnızca aktif notlar aranır)
- Büyük/küçük harf duyarlılığı var mı? (Hayır, arama büyük/küçük harf duyarsız olmalı)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem, kullanıcının arama kutusuna girdiği terimi notların başlık ve düz metin içeriğinde (plainText) aramalıdır
- **FR-002**: Arama sonuçları, yalnızca oturum açmış kullanıcının kendi notlarını içermelidir
- **FR-003**: Arama sonuçları, eşleşen terim vurgulanarak gösterilmelidir
- **FR-004**: Arama sonuçları, en son güncellenen notlar önce olacak şekilde sıralanmalıdır
- **FR-005**: Arama, silinmiş notları (deletedAt !== null) hariç tutmalıdır
- **FR-006**: Arama, büyük/küçük harf duyarsız olmalıdır
- **FR-007**: Minimum 2 karakter girildikten sonra arama başlamalıdır
- **FR-008**: Arama sonuçları, kullanıcı yazdıkça otomatik olarak güncellenmelidir (debounce ile performans optimize edilmiş)
- **FR-009**: Arama sonuç listesi, not başlığı, içerik önizlemesi ve güncelleme tarihini göstermelidir

### Key Entities

- **Note**: Aranacak ana varlık - başlık (title), düz metin içeriği (plainText), klasör ilişkisi, oluşturma/güncelleme tarihleri
- **Search Result**: Eşleşen not, eşleşme tipi (başlık/içerik), ve vurgulama bilgilerini içerir

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kullanıcılar arama sonuçlarını 1 saniyeden kısa sürede görmelidir (tipik veritabanı boyutu için)
- **SC-002**: Kullanıcıların %90'ı aradıkları notu ilk 5 sonuç içinde bulabilmelidir
- **SC-003**: Arama özelliği, 1000+ not içeren hesaplarda bile performans düşüşü olmadan çalışmalıdır
- **SC-004**: Klavye kısayolu (Ctrl+K) ile arama kutusuna odaklanma anında gerçekleşmelidir

## Assumptions

- Mevcut `notes` tablosundaki `plainText` alanı, Tiptap editor içeriğinin düz metin versiyonunu içermektedir
- Header bileşeninde halihazırda bir arama kutusu UI'ı mevcuttur ve sadece işlevsellik eklenmesi gerekmektedir
- Arama için SQLite'ın `LIKE` operatörü kullanılacaktır (FTS5 daha sonra eklenebilir)
