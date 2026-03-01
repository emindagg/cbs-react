# PRD: Storymap Giriş ve Ana Sayfa Tasarımı

## 📋 Durum: ✅ TAMAMLANDI

Bu PRD'de tanımlanan tüm özellikler başarıyla implemente edilmiştir.

---

## 1. Özet

Storymap uygulamasına giriş akışı ve ana sayfa tasarımı. Kullanıcılar CBS Analiz uygulamasından butona tıklayarak Storymap'e gelecek. Ana sayfada üç seçenek sunulacak: paylaşım kodu ile görüntüleme, öğretmen girişi ve öğrenci girişi.

---

## 2. Kullanıcı Akışları

### 2.1 Genel Akış
```
CBS Analiz (herkese açık)
         │
    [Storymap Butonu]
         │
         ▼
   Storymap Ana Sayfa (index.html)
         │
    ┌────┼────┐
    ▼    ▼    ▼
  Kod   Öğr.  Öğr.
  Gir   Giriş Giriş
```

### 2.2 Paylaşım Kodu ile Görüntüleme ✅
1. Kullanıcı publicKey kodunu girer
2. "Görüntüle" butonuna tıklar
3. `view.html?code={publicKey}` sayfasına yönlendirilir
4. View mode'da paylaşılan storymap açılır
5. Giriş gerektirmez

### 2.3 Öğretmen/Öğrenci Girişi ✅
1. Kullanıcı "Öğretmen Girişi" veya "Öğrenci Girişi" butonuna tıklar
2. MEBBİS login sayfasına yönlendirilir
   - Öğretmen: `cbs/1`
   - Öğrenci: `cbs/0`
3. MEBBİS'te giriş yapar
4. `LoginRedirect.html?user={URL_ENCODED_TOKEN}` ile geri döner
5. Token backend'e gönderilir (`POST /api/Login`)
6. JWT Bearer token alınır ve sessionStorage'a kaydedilir
7. `app.html` sayfasına yönlendirilir
8. StorymapManager gösterilir (harita listesi)

---

## 3. Ana Sayfa Bileşenleri ✅

### 3.1 Paylaşım Kodu Alanı
- Text input (publicKey için)
- "Görüntüle" butonu
- Açıklama metni

### 3.2 Giriş Butonları
- Öğretmen Girişi butonu (MEBBİS cbs/1)
- Öğrenci Girişi butonu (MEBBİS cbs/0)
- Her iki giriş sonrası aynı yetkiler

### 3.3 Görsel Tasarım
- Minimalist, temiz arayüz
- İki bölüm: Kod girişi (üst) ve Giriş butonları (alt)
- "veya" ayırıcısı ile ayrılmış
- StoryMap logosu ve branding

---

## 4. Teknik Gereksinimler ✅

### 4.1 Sayfalar
| Sayfa | Dosya | Durum | Açıklama |
|-------|-------|-------|----------|
| Landing | `index.html` | ✅ | Giriş seçenekleri |
| OAuth Callback | `LoginRedirect.html` | ✅ | MEBBİS token işleme |
| Uygulama | `app.html` | ✅ | Ana uygulama (auth gerekli) |
| Public View | `view.html` | ✅ | Paylaşılan harita görüntüleme |
| Admin | `admin/index.html` | ✅ | Yönetim paneli |

### 4.2 JavaScript Modülleri
| Modül | Dosya | Durum | Açıklama |
|-------|-------|-------|----------|
| API Service | `src/services/apiService.js` | ✅ | Backend API wrapper |
| Auth Manager | `src/services/authManager.js` | ✅ | Token yönetimi |
| Storage Manager | `src/utils/storageManager.js` | ✅ | Dual-mode storage |
| Landing Main | `src/landingMain.js` | ✅ | Landing page logic |
| Login Redirect | `src/loginRedirectMain.js` | ✅ | OAuth callback handler |
| View Main | `src/viewMain.js` | ✅ | Public view logic |

### 4.3 API Entegrasyonu ✅
| Endpoint | Method | Durum | Açıklama |
|----------|--------|-------|----------|
| `/api/Login` | POST | ✅ | MEBBİS token ile giriş |
| `/api/Storymap` | GET | ✅ | Tüm haritaları listele |
| `/api/Storymap/{id}` | GET | ✅ | Tekil harita getir |
| `/api/Storymap` | POST | ✅ | Yeni harita oluştur |
| `/api/Storymap/{id}` | PUT | ✅ | Harita güncelle |
| `/api/Storymap/{id}` | DELETE | ✅ | Harita sil |
| `/api/Storymap/share/{id}` | PATCH | ✅ | Paylaşımı aç |
| `/api/Storymap/unshare/{id}` | PATCH | ✅ | Paylaşımı kapat |
| `/api/Storymap/public/{key}` | GET | ✅ | Public harita getir |
| `/api/Dosya` | POST | ✅ | Dosya yükle (CDN) |

### 4.4 Token Yönetimi ✅
- Bearer token `sessionStorage`'da saklanır
- Key: `storymap_auth_token`
- Her API isteğine `Authorization: Bearer {token}` header eklenir
- 401 durumunda otomatik logout ve landing'e yönlendirme

---

## 5. Kullanıcı Yetkileri ✅

| Özellik | Öğretmen | Öğrenci | Misafir (Kod ile) |
|---------|----------|---------|-------------------|
| Storymap görüntüle | ✅ | ✅ | ✅ (sadece paylaşılan) |
| Storymap oluştur | ✅ | ✅ | ❌ |
| Storymap düzenle | ✅ | ✅ | ❌ |
| Storymap sil | ✅ | ✅ | ❌ |
| Storymap paylaş | ✅ | ✅ | ❌ |
| Dosya yükle (CDN) | ✅ | ✅ | ❌ |

---

## 6. URL Yapısı ✅

| URL | Açıklama |
|-----|----------|
| `/index.html` | Landing page (giriş seçenekleri) |
| `/LoginRedirect.html?user={token}` | MEBBİS OAuth callback |
| `/app.html` | Ana uygulama (auth gerekli) |
| `/view.html?code={publicKey}` | Public harita görüntüleme |
| `/admin/index.html` | Admin paneli |

---

## 7. Implementasyon Detayları

### 7.1 MEBBİS Token İşleme

**Kritik:** MEBBİS token'ı URL-encoded formatta gelir ve backend bu formatta bekler.

```javascript
// LoginRedirect.html - Token parsing
// URLSearchParams.get() decode eder, bu YANLIŞ
// Regex ile ham değeri almalıyız

const userMatch = window.location.search.match(/[?&]user=([^&]*)/);
const mebbisToken = userMatch ? userMatch[1] : null;
// Token URL-encoded kalmalı, decode ETMEYİN
```

### 7.2 Backend Response Format

Tüm backend response'ları şu formatta:

```json
{
    "data": { ... },
    "errorMessage": null
}
```

**Key isimleri küçük harf:** `kullaniciid`, `token`, `baslik`, `aciklama`, vb.

### 7.3 Dual-Mode Storage

- **Backend Mode:** Authenticated kullanıcılar için
- **IndexedDB Mode:** Offline/fallback için
- `storageManager.isBackendMode()` ile kontrol

---

## 8. Kapsam Dışı (Gelecek Versiyonlar)

- [ ] Öğretmen/Öğrenci yetki farkları
- [ ] Token refresh mekanizması
- [ ] Rate limiting
- [ ] Collaboration (ortak düzenleme)

---

## 9. Referanslar

- Backend Rehberi: `backendrehber.md`
- API Referansı: `docs/API_REFERENCE.md`
- Mimari: `docs/ARCHITECTURE.md`
- Ana Uygulama: `src/main.js`
- Auth Manager: `src/services/authManager.js`
- API Service: `src/services/apiService.js`

---

**Son Güncelleme:** 27 Şubat 2026  
**Versiyon:** 2.1.0 (Tamamlandı)
