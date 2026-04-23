# PRD: Ortak Çalışma Özelliği (Collaboration Feature)

## 📋 Durum: 🔄 PLANLANMIŞ (Gelecek Versiyon)

Bu PRD, gelecekte implemente edilecek ortak çalışma özelliğini tanımlar. Şu an sadece public paylaşım (read-only) aktiftir.

---

## 📋 Genel Bakış

StoryMap uygulamasına, kullanıcıların hikâyeleri üzerinde ortak çalışabilmesi için paylaşım ve düzenleme yetkisi sistemi eklenmesi.

## 🎯 Amaç

Bir kullanıcının oluşturduğu hikâyeyi, diğer kullanıcıların görüntüleyebilmesi veya düzenleyebilmesi için paylaşım mekanizması sağlamak.

## 👥 Kullanıcı Hikâyeleri

**Senaryo 1: Öğretmen - Öğrenci**
- Öğretmen bir hikâye oluşturur
- Öğrencilerle "düzenleme linki" paylaşır
- Öğrenciler ortak çalışarak hikâyeyi zenginleştirir
- Öğretmen tüm değişiklikleri görür

**Senaryo 2: Sunumcu**
- Kullanıcı bir sunum hazırlar
- "Görüntüleme linki" ile izleyicilerle paylaşır
- İzleyiciler sadece görüntüler, değiştiremez

**Senaryo 3: Ekip Çalışması**
- Ekip lideri proje oluşturur
- Ekip üyelerine "düzenleme linki" gönderir
- Herkes katkıda bulunur
- Değişiklikler otomatik senkronize olur

## ✨ Özellikler

### 1. İki Paylaşım Modu

**📖 Görüntüleme Modu (View Only)**
- Sadece okuma yetkisi
- Hiçbir değişiklik yapılamaz
- URL: `?mode=view&id=123&token=xyz`

**✏️ Düzenleme Modu (Edit Access)**
- Tam düzenleme yetkisi
- Nokta ekleme/silme/güncelleme
- Çizim araçları kullanma
- URL: `?mode=edit&id=123&token=xyz`

### 2. Paylaş Paneli Güncellemesi

Mevcut "Paylaş" butonuna ek özellikler:

```
┌─────────────────────────────────┐
│      Hikâyeyi Paylaş            │
├─────────────────────────────────┤
│ [📖] Görüntüleme Linki Oluştur  │
│ [✏️] Düzenleme Linki Oluştur    │
│                                 │
│ Oluşturulan Link:               │
│ [https://...] [Kopyala] [QR]   │
└─────────────────────────────────┘
```

### 3. Merkezi Veri Saklama

- Hikâyeler MEB sunucusunda (backend database) saklanır
- Kullanıcılar backend'den veri çeker/günceller
- Değişiklikler merkezi olarak kaydedilir

### 4. Otomatik Senkronizasyon

- Bir kullanıcı değişiklik yaptığında
- Diğer kullanıcıların açık sayfaları otomatik güncellenir
- "Hikâye güncellendi" bildirimi gösterilir

## 📝 Gereksinimler

### Backend Gereksinimleri

**MEB Sunucusu Tarafında:**
- Hikâye verilerini saklayan database
- REST API endpoint'leri:
  - `POST /stories` - Yeni hikâye oluştur
  - `GET /stories/:id` - Hikâye getir
  - `PUT /stories/:id` - Hikâye güncelle
  - `DELETE /stories/:id` - Hikâye sil
- Token bazlı yetkilendirme sistemi
- Real-time güncelleme mekanizması (WebSocket veya polling)

### Frontend Gereksinimleri

**Değiştirilecek Dosyalar:**
- `storageManager.js` → Backend API entegrasyonu
- `SharePanel.js` → İki link oluşturma butonu
- `main.js` → Token doğrulama, mod kontrolü
- Yeni: `apiClient.js` → Backend iletişim modülü

## 📊 Başarı Kriterleri

1. ✅ A kullanıcısı düzenleme linki oluşturabilir
2. ✅ B kullanıcısı linke tıklayarak hikâyeyi düzenleyebilir
3. ✅ B'nin yaptığı değişiklikler backend'e kaydedilir
4. ✅ A kullanıcısı sayfayı yenilediğinde B'nin değişikliklerini görür
5. ✅ Görüntüleme linkiyle açanlar sadece okuyabilir, düzenleyemez

## 🔐 Güvenlik

- Her paylaşım linki benzersiz token içerir
- Token olmadan hikâye erişilemez
- Token'lar backend'de saklanır ve doğrulanır
- View token → Sadece okuma
- Edit token → Okuma + yazma

## 🚀 İlk Versiyon Kapsamı Dışı

**Şimdilik YAPILMAYACAK:**
- ❌ Kullanıcı kayıt/giriş sistemi
- ❌ Gelişmiş yetki yönetimi (sadece owner/viewer/editor)
- ❌ Versiyon geçmişi
- ❌ Yorum/annotation özelliği
- ❌ Eş zamanlı çoklu düzenleme conflict çözümü (basit "son yazan kazanır" yeterli)

---

## 📅 Sonraki Adımlar

1. MEB sunucusu backend API spesifikasyonunu netleştirme
2. API endpoint'lerinin belirlenmesi
3. Frontend implementasyon planı
4. Test senaryoları

---

**Versiyon:** 1.0  
**Tarih:** 29 Aralık 2025  
**Durum:** Planlanmış (Gelecek Versiyon)  
**Son Güncelleme:** 11 Ocak 2026

---

## 📌 Mevcut Durum

Şu an implemente edilmiş özellikler:

| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Public Paylaşım | ✅ | `view.html?code={publicKey}` ile read-only görüntüleme |
| Share/Unshare API | ✅ | `PATCH /api/Storymap/share/{id}` ve `unshare` |
| Public Key | ✅ | Backend tarafından otomatik oluşturuluyor |
| Link Kopyalama | ✅ | Paylaş panelinde URL kopyalama |
| Sosyal Medya | ✅ | Twitter, Facebook, WhatsApp, Telegram paylaşımı |

**Eksik Özellikler (Bu PRD Kapsamı):**
- [ ] Düzenleme linki oluşturma
- [ ] Edit token sistemi
- [ ] Real-time senkronizasyon
- [ ] Conflict resolution

---

## 📚 İlgili Dokümantasyon

- [API Referansı](./API_REFERENCE.md) - Mevcut API endpoint'leri
- [Mimari](./ARCHITECTURE.md) - Sistem mimarisi
- [Auth PRD](./AUTH_AND_LANDING_PRD.md) - Authentication sistemi
