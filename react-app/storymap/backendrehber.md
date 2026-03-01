# StoryMap Backend Entegrasyon Rehberi

Bu doküman, StoryMap frontend uygulamasının backend gereksinimleri ve entegrasyon detaylarını içerir.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [CORS Yapılandırması](#cors-yapılandırması)
3. [API Endpoints](#api-endpoints)
4. [Authentication Flow](#authentication-flow)
5. [Data Formatları](#data-formatları)
6. [Dosya Upload](#dosya-upload)
7. [Error Handling](#error-handling)
8. [Test Senaryoları](#test-senaryoları)

---

## Genel Bakış

### Backend URL
```
Base URL: https://ogmmateryal.eba.gov.tr/cbs-backend/api
CDN URL: https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles
```

### Frontend Flow
```
1. Kullanıcı index.html açar
2. MEBBİS ile giriş yapar (öğretmen/öğrenci)
3. LoginRedirect.html'e yönlendirilir
4. Backend'e POST /api/Login ile token gönderilir
5. Backend JWT token döner
6. Frontend token'ı sessionStorage'da saklar
7. Tüm isteklerde Bearer token kullanılır
```

---

## CORS Yapılandırması

### ⚠️ KRİTİK: CORS Hatası Çözümü

**Mevcut Sorun:**
```
Access to fetch at 'https://ogmmateryal.eba.gov.tr/cbs-backend/api/Login'
from origin 'http://127.0.0.1:5500' has been blocked by CORS policy
```

**Çözüm (ASP.NET Core):**

```csharp
// Program.cs veya Startup.cs

// Development ortamı için
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowDevelopment", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// Production ortamı için
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowProduction", policy =>
    {
        policy.WithOrigins(
            "https://storymap.eba.gov.tr",  // Production domain
            "https://www.storymap.eba.gov.tr"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// Middleware
var app = builder.Build();

#if DEBUG
    app.UseCors("AllowDevelopment");
#else
    app.UseCors("AllowProduction");
#endif

app.UseAuthentication();
app.UseAuthorization();
```

**Gerekli Headers:**
```
Access-Control-Allow-Origin: http://127.0.0.1:5500
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
```

---

## API Endpoints

### 1. Authentication

#### POST /api/Login
MEBBİS token ile kullanıcı girişi.

**Request:**
```json
{
  "token": "cGct0byJp91ZoJOFWk3pcWAuCsuyCOeL8%2BbJC8M%2Bd9vmTWLayG5U%2Bvh1WOXEd3iY..."
}
```

**Response (200):**
```json
{
  "data": {
    "kullaniciid": "550e8400-e29b-41d4-a716-446655440000",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "errorMessage": null
}
```

**⚠️ Önemli:** Key isimleri küçük harf (`kullaniciid`, `token`).

**Error (401):**
```json
{
  "data": null,
  "errorMessage": "Invalid MEBBİS token"
}
```

**Frontend Kullanımı:**
```javascript
const response = await fetch('https://ogmmateryal.eba.gov.tr/cbs-backend/api/Login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: mebbisToken })
});
```

---

### 2. Storymap CRUD

#### GET /api/Storymap
Kullanıcının tüm storymaplerini listele.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sablon": "Nokta Bazlı",
      "baslik": "İstanbul Gezisi",
      "aciklama": "İstanbul tarihi yerler",
      "isshared": true,
      "publickey": "abc123xyz456",
      "olusturmaturihi": "2024-01-15T10:30:00Z"
    }
  ],
  "errorMessage": null
}
```

**⚠️ Tüm key isimleri küçük harf.** Frontend'de fallback: `item.id || item.Id`

---

#### GET /api/Storymap/{id}
Tek bir storymapın detaylarını getir (full data).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "kullaniciid": "user-guid",
    "sablon": "Nokta Bazlı",
    "baslik": "İstanbul Gezisi",
    "aciklama": "İstanbul tarihi yerler",
    "jsondata": "{\"mapData\":{\"center\":[28.9784,41.0082],\"zoom\":10},\"steps\":[],\"points\":[{\"id\":1,\"title\":\"Ayasofya\"}]}",
    "isshared": true,
    "publickey": "abc123xyz456",
    "olusturmaturihi": "2024-01-15T10:30:00Z"
  },
  "errorMessage": null
}
```

**Jsondata İçeriği:**
```json
{
  "mapData": {
    "center": [28.9784, 41.0082],
    "zoom": 10,
    "basemap": "osm"
  },
  "steps": [],
  "points": [
    {
      "id": 1,
      "title": "Ayasofya",
      "subtitle": "Müze",
      "description": "Tarihi yapı",
      "coords": [28.9802, 41.0086],
      "zoom": 15,
      "media": [
        {
          "type": "image",
          "url": "https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles/202601/abc123.jpg",
          "caption": "Ayasofya dış görünüm",
          "source": "cdn"
        }
      ],
      "facts": ["İnşa: 537", "Mimar: İsidoros"],
      "tags": ["tarih", "müze"],
      "isDrawing": false
    }
  ]
}
```

---

#### POST /api/Storymap
Yeni storymap oluştur.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "Sablon": "Nokta Bazlı",
  "Baslik": "Ankara Gezisi",
  "Aciklama": "Başkent turu",
  "Jsondata": "{\"mapData\":{},\"steps\":[],\"points\":[]}"
}
```

**Response (200):**
```json
{
  "data": "550e8400-e29b-41d4-a716-446655440001",
  "errorMessage": null
}
```
(Yeni oluşturulan storymapın GUID'i `data` alanında döner)

---

#### PUT /api/Storymap/{id}
Mevcut storymapı güncelle.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "Sablon": "Nokta Bazlı",
  "Baslik": "Ankara Gezisi (Güncel)",
  "Aciklama": "Başkent turu - güncellendi",
  "Jsondata": "{\"mapData\":{},\"steps\":[],\"points\":[...]}"
}
```

**Response (200):**
```json
{
  "data": null,
  "errorMessage": null
}
```

---

#### DELETE /api/Storymap/{id}
Storymapı sil.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": null,
  "errorMessage": null
}
```

---

### 3. Share/Unshare

#### PATCH /api/Storymap/share/{id}
Storymapı paylaşıma aç (public key oluştur).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": {
    "publickey": "generated-public-key"
  },
  "errorMessage": null
}
```

**Backend İşlemi:**
1. Storymap'in `Isshared` alanını `true` yap
2. Eğer `Publickey` boşsa, yeni bir unique key oluştur
3. Örnek: `abc123xyz456` (10-12 karakter, URL-safe)

---

#### PATCH /api/Storymap/unshare/{id}
Paylaşımı iptal et.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": null,
  "errorMessage": null
}
```

**Backend İşlemi:**
1. Storymap'in `Isshared` alanını `false` yap
2. `Publickey` silinmez (gelecekte tekrar paylaşım için)

---

### 4. Public View (Auth Gerektirmez!)

#### GET /api/Storymap/public/{publicKey}
Public key ile storymapı görüntüle (authentication **GEREKMEZ**).

**Headers:**
```
Content-Type: application/json
(Authorization header YOK!)
```

**Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "kullaniciid": "user-guid",
    "sablon": "Storymap Bazlı",
    "baslik": "İstanbul Gezisi",
    "aciklama": "İstanbul tarihi yerler",
    "jsondata": "{...}",
    "isshared": true,
    "publickey": "abc123xyz456",
    "olusturmaturihi": "2024-01-15T10:30:00Z"
  },
  "errorMessage": null
}
```

**Response (404) - Geçersiz key veya paylaşılmamış:**
```json
{
  "error": "Storymap not found or not shared"
}
```

**Backend Kontrol:**
```sql
SELECT * FROM Storymaps
WHERE Publickey = @publicKey
AND Isshared = 1
```

---

### 5. File Upload

#### POST /api/Dosya
Dosya yükle (multipart/form-data).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request (Form Data):**
```
File: [binary file]
```

**Response (200):**
```json
{
  "data": "d66fc060-8eec-48ff-9bb7-ec18a54e1c29.webp",
  "errorMessage": null
}
```
(CDN dosya adı `data` alanında döner)

**Full CDN URL:**
```
https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles/202601/abc123def456.jpg
```

**Frontend Kullanımı:**
```javascript
const formData = new FormData();
formData.append('File', file);

const response = await fetch('https://ogmmateryal.eba.gov.tr/cbs-backend/api/Dosya', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
});

const result = await response.json();
const filename = result.data; // "d66fc060-8eec-48ff-9bb7-ec18a54e1c29.webp"
const cdnUrl = `https://ogm-large-cdn.eba.gov.tr/Cbs/Userfiles/${filename}`;
```

**Desteklenen Formatlar:**
- Images: jpg, jpeg, png, gif, webp
- Videos: mp4, webm, mov
- Max size: 30MB (önerilir)

---

## Authentication Flow

### MEBBİS OAuth Akışı

```
1. USER: index.html'de "Öğretmen Girişi" tıklar
   └─> Frontend: MEBBİS login URL'e yönlendirir
       └─> https://mebi.eba.gov.tr/login/cbs/1?redirectUrl=https://storymap.eba.gov.tr/LoginRedirect.html

2. USER: MEBBİS'te giriş yapar
   └─> MEBBİS: LoginRedirect.html?user={MEBBİS_TOKEN} yönlendirir

3. FRONTEND: LoginRedirect.html MEBBİS token'ı alır
   └─> POST /api/Login { "token": "{MEBBİS_TOKEN}" }

4. BACKEND: MEBBİS token'ı doğrular
   └─> JWT token oluşturur
   └─> Response: { "data": { "kullaniciid": "...", "token": "..." }, "errorMessage": null }

5. FRONTEND: JWT token'ı sessionStorage'a kaydeder
   └─> sessionStorage.setItem('storymap_auth_token', token)

6. FRONTEND: app.html'e yönlendirir
   └─> Her API isteğinde: Authorization: Bearer {token}

7. BACKEND: JWT token'ı doğrular
   └─> 401 ise: Frontend logout + index.html'e yönlendirir
```

### Token Yönetimi

**Storage:**
```javascript
// Frontend (sessionStorage)
sessionStorage.setItem('storymap_auth_token', token);
sessionStorage.setItem('storymap_user_id', userId);
```

**Expiry:**
- Token süresi backend tarafından belirlenir
- Önerilir: 8 saat (oturum süresi)
- Expire olduğunda: 401 error → Frontend logout

**Logout:**
```javascript
// Frontend
sessionStorage.removeItem('storymap_auth_token');
sessionStorage.removeItem('storymap_user_id');
window.location.href = '/index.html';
```

---

## Data Formatları

### Storymap Model (Backend DB)

```csharp
public class Storymap
{
    public Guid Id { get; set; }                    // Primary key
    public Guid Kullaniciid { get; set; }           // Foreign key (User)
    public string Sablon { get; set; }              // Template: "Nokta Bazlı", "Rota Bazlı", "Zaman Çizelgesi", "Storymap Bazlı"
    public string Baslik { get; set; }              // Title (max 200 chars)
    public string Aciklama { get; set; }            // Description (max 1000 chars)
    public string Jsondata { get; set; }            // JSON string (mapData, steps, points)
    public bool Isshared { get; set; }              // Is publicly shared?
    public string Publickey { get; set; }           // Public share key (10-12 chars, URL-safe)
    public DateTime Olusturmaturihi { get; set; }   // Created at (UTC)
}
```

### Jsondata Yapısı

**Point Template (Nokta Bazlı):**
```json
{
  "mapData": {
    "center": [28.9784, 41.0082],
    "zoom": 10,
    "basemap": "osm",
    "template": "point"
  },
  "steps": [],
  "points": [
    {
      "id": 1,
      "title": "Nokta 1",
      "subtitle": "Alt başlık",
      "description": "Açıklama",
      "coords": [28.9802, 41.0086],
      "zoom": 15,
      "media": [],
      "facts": [],
      "tags": [],
      "markerStyle": "red-pin",
      "isDrawing": false
    }
  ]
}
```

**Route Template (Rota Bazlı):**
```json
{
  "mapData": {
    "template": "route"
  },
  "points": [
    {
      "id": 1,
      "number": 1,
      "title": "Başlangıç",
      "coords": [28.9784, 41.0082],
      "day": 1,
      "duration": "2 saat"
    },
    {
      "id": 2,
      "number": 2,
      "title": "Durak 1",
      "coords": [29.0082, 41.0186]
    }
  ]
}
```

**Timeline Template (Zaman Çizelgesi):**
```json
{
  "mapData": {
    "template": "timeline"
  },
  "points": [
    {
      "id": 1,
      "title": "Olay 1",
      "date": "2024-01-15",
      "time": "10:00",
      "category": "Önemli",
      "importance": 3,
      "era": "Modern Dönem"
    }
  ]
}
```

**StoryMap Template (Hikâye):**
```json
{
  "mapData": {
    "template": "storymap"
  },
  "steps": [
    {
      "id": 1,
      "title": "Bölüm 1",
      "subtitle": "Başlangıç",
      "content": "Hikâye içeriği...",
      "coords": [28.9784, 41.0082],
      "zoom": 12,
      "media": [
        {
          "type": "image",
          "url": "https://...",
          "caption": "Görsel açıklaması"
        }
      ]
    }
  ]
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Anlamı | Frontend Aksiyonu |
|------|--------|-------------------|
| 200 | Success | Normal işlem |
| 401 | Unauthorized | Logout + index.html redirect |
| 403 | Forbidden | Toast error mesajı |
| 404 | Not Found | Toast error + IndexedDB fallback |
| 500 | Server Error | Toast error + retry option |

### Response Wrapper Format

Tüm backend endpoint'leri aşağıdaki wrapper formatında döner:

```json
{
  "data": { ... },        // Asıl veri (object, array veya string)
  "errorMessage": null     // Hata varsa string mesaj
}
```

### Frontend Error Handling

```javascript
// apiService.js
async _handleHTTPError(response) {
    const status = response.status;

    switch (status) {
        case 401:
            // Token expired/invalid
            authManager.logout(); // Clears session + redirects
            throw new Error('Oturum süresi doldu');

        case 403:
            throw new Error('Yetkiniz bulunmuyor');

        case 404:
            throw new Error('Kaynak bulunamadı');

        case 500:
            throw new Error('Sunucu hatası');
    }
}
```

---

## Test Senaryoları

### 1. Authentication Test

**Adımlar:**
```bash
# 1. Landing page aç
http://127.0.0.1:5500/index.html

# 2. "Öğretmen Girişi" tıkla
→ MEBBİS login sayfası açılır

# 3. MEBBİS'te giriş yap
→ LoginRedirect.html?user={token} yönlendirilir

# 4. Backend'e token gönderilir
POST /api/Login
Expected: 200 OK + JWT token

# 5. app.html açılır
→ StorymapManager görünür
```

**Beklenen:**
- ✅ CORS hatası YOK
- ✅ 200 OK response
- ✅ JWT token dönüyor
- ✅ sessionStorage'da token var

---

### 2. Storymap CRUD Test

**Create:**
```bash
# 1. "Yeni Harita Oluştur" tıkla
# 2. Template seç → "Devam Et"
# 3. Harita oluştur → "Kaydet"

POST /api/Storymap
Expected: 200 OK + GUID

# 4. Liste yenilenir
GET /api/Storymap
Expected: Yeni harita listede görünür
```

**Update:**
```bash
# 1. Harita aç → Değişiklik yap → "Güncelle"

PUT /api/Storymap/{id}
Expected: 200 OK
```

**Delete:**
```bash
# 1. Harita kartında "Sil" → Confirm

DELETE /api/Storymap/{id}
Expected: 200 OK
```

---

### 3. Share/Public View Test

**Share:**
```bash
# 1. Harita editörde → Toolbar → "Paylaş" toggle ON

PATCH /api/Storymap/share/{id}
Expected: 200 OK

# 2. Public link gösterilir
GET /api/Storymap/{id}
Expected: Publickey dolu, Isshared = true
```

**Public View:**
```bash
# 1. Public linki kopyala
https://storymap.eba.gov.tr/view.html?code=abc123xyz456

# 2. Yeni incognito sekmede aç (auth olmadan)

GET /api/Storymap/public/abc123xyz456
Expected: 200 OK + Full storymap data
```

**Unshare:**
```bash
# 1. "Paylaş" toggle OFF

PATCH /api/Storymap/unshare/{id}
Expected: 200 OK, Isshared = false

# 2. Public link artık çalışmıyor
GET /api/Storymap/public/abc123xyz456
Expected: 404 Not Found
```

---

### 4. File Upload Test

```bash
# 1. Harita editörde → Nokta detay → "Medya Ekle"
# 2. Resim seç (JPG, 2MB)

POST /api/Dosya (multipart/form-data)
Expected: 200 OK + "202601/abc123.jpg"

# 3. CDN URL oluşturulur
https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles/202601/abc123.jpg

# 4. Resim haritada görünür
```

**Fallback Test:**
```bash
# 1. Backend'i kapat (offline test)
# 2. Medya yükle

→ CDN upload fails
→ Base64 fallback kullanılır
→ Resim IndexedDB'ye base64 olarak kaydedilir
```

---

### 5. Migration Test

```bash
# 1. Offline modda 3 harita oluştur (IndexedDB)
# 2. MEBBİS ile giriş yap (authenticated)

→ StorymapManager açılır
→ "3 adet lokal haritanız var" banner görünür

# 3. "Yükle" tıkla

→ Progress modal açılır
→ Her harita için:
   POST /api/Storymap
   Expected: 200 OK + GUID

→ Progress: 3/3 complete
→ "3 harita başarıyla yüklendi" toast
→ Liste yenilenir (artık "Backend" badge)
```

---

## Güvenlik

### Token Güvenliği

**DO:**
- ✅ JWT token kullan (signed, expiring)
- ✅ HTTPS only (production)
- ✅ Token expiry: 8 saat
- ✅ Refresh token mekanizması (opsiyonel)

**DON'T:**
- ❌ Token'ı URL'de gönderme
- ❌ Token'ı localStorage'da saklama (XSS riski)
- ❌ Token'ı log'lama

### Public Key Güvenliği

**DO:**
- ✅ Random, unique, URL-safe key üret
- ✅ `Isshared = false` kontrolü yap
- ✅ Rate limiting (abuse prevention)

**DON'T:**
- ❌ Sequential ID kullanma (tahmin edilebilir)
- ❌ User ID'yi key olarak kullanma

### File Upload Güvenliği

**DO:**
- ✅ File type validation (MIME + extension)
- ✅ File size limit (30MB)
- ✅ Virus scanning (production)
- ✅ Unique filename (collision prevention)

**DON'T:**
- ❌ Orijinal filename kullanma
- ❌ Executable file upload (exe, bat, sh)

---

## Performance

### Optimizasyon Önerileri

**Database:**
```sql
-- Indexler
CREATE INDEX idx_storymap_user ON Storymaps(Kullaniciid);
CREATE INDEX idx_storymap_publickey ON Storymaps(Publickey);
CREATE INDEX idx_storymap_shared ON Storymaps(Isshared);

-- Query optimization
SELECT * FROM Storymaps
WHERE Kullaniciid = @userId
ORDER BY Olusturmaturihi DESC;
```

**Caching:**
- Public storymaps için Redis cache (1 saat)
- User storymap listesi için cache (5 dakika)

**CDN:**
- CloudFlare/Azure CDN kullan
- Image optimization (WebP, compression)
- Lazy loading

---

## Deployment Checklist

### Production Hazırlık

- [ ] CORS production domain'e ayarlandı
- [ ] HTTPS enabled
- [ ] JWT secret güvenli
- [ ] File upload limit ayarlandı
- [ ] Database indexler oluşturuldu
- [ ] Error logging aktif (Sentry, AppInsights)
- [ ] Rate limiting aktif
- [ ] CDN yapılandırıldı
- [ ] Backup stratejisi var
- [ ] Monitoring aktif (uptime, performance)

### Environment Variables

```bash
# .env (Production)
JWT_SECRET=super-secret-key-change-me
JWT_EXPIRY=8h
MEBBIS_API_URL=https://mebi.eba.gov.tr
CDN_BASE_URL=https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles
MAX_FILE_SIZE=31457280  # 30MB
ALLOWED_ORIGINS=https://storymap.eba.gov.tr
```

---

## Sorun Giderme

### CORS Hatası
```
Hata: Access to fetch ... has been blocked by CORS policy
Çözüm: Backend'de CORS middleware ekle (yukarıdaki örneği kullan)
```

### 401 Unauthorized
```
Hata: Oturum süresi doldu
Sebep: Token expired veya invalid
Çözüm: Frontend logout + tekrar giriş
```

### Public Key 404
```
Hata: Storymap not found
Sebep: Isshared = false veya geçersiz key
Çözüm: Isshared kontrolü yap, SQL sorgusu düzelt
```

### File Upload 413
```
Hata: Request Entity Too Large
Sebep: Dosya boyutu limiti
Çözüm: Backend max file size artır (30MB)
```

---

## İletişim

### Frontend Ekip
- Kullanılan teknolojiler: Vanilla JS, ES6 modules
- Storage: sessionStorage (auth), IndexedDB (fallback)

### Backend Gereksinimleri
- Framework: ASP.NET Core
- Auth: JWT Bearer token
- Database: SQL Server
- CDN: Azure/CloudFlare

### Support
- Frontend GitHub: https://github.com/emindagg/storymap
- API Dokümantasyon: Bu dosya
- Test URL: http://127.0.0.1:5500

---

## Versiyon Geçmişi

### v1.0.0 (2024-01-06)
- ✅ Initial backend integration
- ✅ MEBBİS OAuth authentication
- ✅ CRUD operations
- ✅ Share/unshare functionality
- ✅ Public view
- ✅ File upload to CDN
- ✅ Migration support

### v2.1.0 (2026-02-27)
- ✅ Response format düzeltmeleri (`{ data, errorMessage }` wrapper)
- ✅ Key isimleri küçük harf standardizasyonu
- ✅ `getMediaUrl()` fonksiyonu eklendi (backwards compatible)
- ✅ Dev mode desteği (`?dev` parametresi)
- ✅ Dosya upload response formatı güncellendi (JSON wrapper)

---

**Son Güncelleme:** 2026-02-27
**Doküman Versiyonu:** 2.1.0
**Backend API Versiyonu:** v1
