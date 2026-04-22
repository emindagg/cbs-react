# PRD: CBS Data Share — Görselleştirme ve Veri Paylaşım Sistemi

**Versiyon:** 1.0
**Tarih:** 2026-04-22
**Durum:** 📝 TASLAK (Planlama)
**Sahip:** Ürün / Frontend
**Hedef Sürüm:** v0.2.x

---

## 1. Özet

CBS React uygulamasında üretilen **koroplet harita**, **kabarcık harita**, **nokta yoğunluk haritası** ve **veri oluşturma** çıktılarının link + kod ile paylaşılabildiği bir sistemin kurulması. İki paylaşım modu: **sadece görüntüleme** ve **düzenleme**. Kullanıcı uygulamayı kimliksiz kullanmaya devam eder; paylaşım tetiklendiği anda MEBBİS girişi istenir.

---

## 2. Amaç ve Motivasyon

### 2.1 Problem
Şu an kullanıcı bir görselleştirme ürettiğinde çıktı sadece ekranda kalıyor. Başkalarına göstermek için ekran görüntüsü, dışa aktarım (GeoJSON/KML) veya canlı sunum dışında yol yok. Öğretmen–öğrenci, birimler arası veya sunum senaryolarında **canlı, interaktif** bir link gerekli.

### 2.2 Hedef
- Öğretmen öğrencilerle tek tıkla link paylaşabilsin
- Ekip lideri harita üzerinde birlikte çalışılabilecek düzenleme linki gönderebilsin
- İzleyiciler sadece okuma izniyle görüntüleyebilsin
- Giriş zorunluluğu yalnızca paylaşım anında ortaya çıksın

### 2.3 Kapsam dışı (v1)
- Real-time çoklu kullanıcı senkronizasyon (WebSocket/SSE)
- Edit conflict resolution (basit "son yazan kazanır" yeterli)
- Versiyon geçmişi, yorum/annotation
- Kullanıcı kayıt akışı (MEBBİS OAuth zorunlu)
- Gelişmiş yetki yönetimi (owner / anonim viewer / anonim editor yeterli)
- Paylaşım analizi (kim kaç kez açtı vb.)

---

## 3. Kullanıcı Hikâyeleri

### H1. Öğretmen → Öğrenci (Görüntüleme)
> Tarih öğretmeni "Türkiye İl Nüfus Yoğunluğu" koroplet haritasını hazırlar, **Görüntüleme Linki** üretir, WhatsApp grubuna atar. Öğrenciler linke tıklayıp haritayı interaktif olarak inceler; hiçbir şey değiştiremez.

### H2. Ekip Çalışması (Düzenleme)
> CBS birimi üyesi okul konumlarını çizer, **Düzenleme Linki** üretir. Ekip üyeleri linke girer, eksik okulları ekler veya mevcut noktaları düzeltir. Değişiklikler merkezi olarak kaydedilir.

### H3. Kimliksiz Kullanıcı
> Kullanıcı uygulamayı açar, veri yükler, koroplet harita üretir — hiçbir aşamada giriş istenmez. Yalnızca "Paylaş" butonuna bastığında MEBBİS girişi önüne gelir.

### H4. Paylaşım Kodu ile Erişim
> Bir kullanıcı iletişim kanalında sadece kod (örn. `KX7M-92A`) gördü. Uygulamayı açar, üst bardaki "Paylaşım Aç" kutusuna kodu girer → harita yüklenir.

### H5. Paylaşımı İptal Etme
> Sahip paylaşımını artık istemiyor → paylaşım panelinden "İptal Et" → eski link 404 döner.

---

## 4. Fonksiyonel Gereksinimler

### 4.1 Paylaşım tetikleyici konumları
- `VizWizardStep3` render sonrası → "Paylaş" butonu (koroplet / bubble / dot)
- `DataCreationSection` / `DataManagementSection` → "Projeyi Paylaş" butonu (kullanıcı çizimleri + içe aktarılan veri)
- Opsiyonel: `AppLayout` üst barında global "Paylaş" kısayolu

### 4.2 Paylaşım paneli

```
┌──────────────────────────────────────────┐
│  Haritayı Paylaş                         │
├──────────────────────────────────────────┤
│  Paylaşım Türü                           │
│  ○ Görüntüleme (sadece okuma)            │
│  ● Düzenleme (okuma + yazma)             │
│                                           │
│  Başlık (opsiyonel)                      │
│  [İstanbul Nüfus Yoğunluğu_________]     │
│                                           │
│  [  Paylaşım Oluştur  ]                  │
├──────────────────────────────────────────┤
│  ✓ Paylaşım hazır                         │
│                                           │
│  Link:                                    │
│  [https://.../cbs-react/?share=KX7M92A…] │
│  [ Kopyala ] [ QR Kod ]                  │
│                                           │
│  Kod: KX7M-92A    [ Kopyala ]            │
│                                           │
│  [ Paylaşımı İptal Et ]                  │
└──────────────────────────────────────────┘
```

### 4.3 Giriş akışı (paylaşım anında)

```
1. "Paylaş" tıklanır
2. authService.isAuthenticated() kontrol
   ├─ true  → SharePanel açılır
   └─ false → ShareAuthPrompt modal:
              "Paylaşım linkinizi oluşturmak için
               MEBBİS ile giriş yapın"
              [ Giriş Yap ]  [ Vazgeç ]
3. Giriş → MEBBİS OAuth → /login-redirect
4. Token alınır → sessionStorage
5. Kullanıcı kaldığı yerden devam (store state korunur)
6. SharePanel otomatik açılır
```

### 4.4 Kod formatı
- **publicKey / editKey:** 8–10 karakter, base32 (I/O/0/1 hariç) — `KX7M92AB`
- URL gösterimi: segmentli, `KX7M-92AB` (okunabilirlik)
- Backend üretir, frontend format only

### 4.5 URL şeması

| URL | Mod | Auth |
|---|---|---|
| `/cbs-react/` | Normal | Hayır |
| `/cbs-react/?share=<key>&mode=view` | Sadece görüntüleme | Hayır |
| `/cbs-react/?share=<key>&mode=edit` | Düzenleme | Hayır |
| `/cbs-react/login-redirect` | MEBBİS callback | Hayır (parse-only) |

### 4.6 Public view davranışı (`mode=view`)
- Sidebar sihirbaz gizli (Step1/2/3 render edilmez)
- Paylaş, Dışa Aktar, Veri Yükleme butonları gizli
- Basemap seçici, zoom, tıklama/tooltip **aktif**
- Üst rozet: "Görüntüleme Modu" (gri)
- Lejant, harita başlığı, viz render ayarları **yüklenir ve uygulanır**

### 4.7 Public edit davranışı (`mode=edit`)
- Tüm kontroller aktif (sihirbaz hariç — yeni viz başlatmak paylaşımı bozar)
- "Kaydet" butonu paneli: değişiklikleri PUT eder
- Üst rozet: "Düzenleme Modu" (turuncu) + "Son kayıt: 2 dk önce"
- Conflict yok — son yazan kazanır
- Her kaydet → backend'e tam payload PUT

### 4.8 İptal akışı (unshare)
- Owner giriş yapar → "Paylaşımlarım" listesi (opsiyonel v1.1) veya paylaşım paneli "İptal Et" → `PATCH /unshare`
- İptal sonrası aynı key ile gelen istek: **410 Gone** (404 değil — iptal edildiği net görünsün)
- UI: "Bu paylaşım sahibi tarafından iptal edildi."

---

## 5. Teknik Gereksinimler

### 5.1 Yeni feature modülü

```
src/features/share/
├── components/
│   ├── ShareButton.tsx           # Viz ve veri oluşturma ekranlarında
│   ├── SharePanel.tsx            # Mod seçimi + link/kod gösterimi
│   ├── ShareAuthPrompt.tsx       # "Giriş gerekli" modal
│   ├── ShareCodeInput.tsx        # Üst barda kod girişi
│   ├── ShareModeBadge.tsx        # "Görüntüleme Modu" / "Düzenleme Modu"
│   └── ShareCancelConfirm.tsx
├── hooks/
│   ├── useShare.ts               # create / cancel / load
│   ├── useSharedMode.ts          # URL'den mod+key parse
│   └── useAuth.ts                # isAuthenticated, login, logout
├── services/
│   ├── shareApi.ts               # Backend çağrıları
│   ├── sharePayload.ts           # buildShareablePayload / applySharedPayload
│   └── authService.ts            # MEBBİS URL, token yönetimi
├── types.ts
└── index.ts                      # VSA public barrel
```

### 5.2 Paylaşılan altyapı (shared/)

```
src/shared/api/
└── apiService.ts                 # fetch wrapper, Bearer inject, 401 handler

src/shared/auth/
├── authStorage.ts                # sessionStorage token
└── mebbisUrl.ts                  # MEBBİS login URL builder
```

**Not:** `src/features/share/services/authService.ts` bu shared katmanı sarmalar; feature dışı taraflardan (AppLayout vb.) çağrı gerekirse `@/shared/auth/` kullanılır.

### 5.3 Payload şeması

```typescript
interface SharedVizPayload {
  version: 1
  createdAt: string            // ISO
  kind: 'viz' | 'data-creation' | 'mixed'
  title?: string

  map: {
    center: [number, number]
    zoom: number
    basemapId: string          // ID only — URL/style dışarıda
  }

  viz?: {
    type: 'choropleth' | 'bubble' | 'dot'
    settings: VisualizationSettings
    columnMapping: ColumnMapping
    colorConfig: ColorConfiguration
    mapTitle: MapTitleConfiguration
    excludedRows: number[]
    userData: {                // Kullanıcının yüklediği Excel/CSV
      rows: unknown[]
      columns: string[]
    }
  }

  dataCreation?: {
    items: DataItem[]          // Çizilen + içe aktarılan GeoJSON
    layerStyles: LayerStyles
  }

  clustering?: ClusteringState
  heatmap?: HeatmapState
  // ... ihtiyaç duyulan diğer store snapshot'ları
}
```

### 5.4 🚫 Payload'a ASLA Dahil Edilmeyecekler

> **Kritik kural.** Büyük statik veriler tekrarlanmaz; alıcı uygulama bunları kendi bundle'ından / cache'inden alır.

- `provincesGeoJSON` (~35 MB)
- `districtsGeoJSON` (~10 MB)
- `provinceIndex`, `districtIndex` (lookup yapıları)
- CORINE, arazi örtüsü, diğer overlay layer GeoJSON'ları
- Basemap tile URL / style JSON (yalnızca `basemapId` yeterli)
- GeoJSON'ların türediği herhangi bir cache alanı

**Uygulama tekniği:** Serializer **allowlist** kullanır — store'daki alanlar açıkça listelenir. Blacklist değil, çünkü yeni cache alanı eklendiğinde unutulup payload'a sızabilir.

```typescript
// sharePayload.ts
const VIZ_ALLOWED_FIELDS = [
  'currentStep',
  'columnMapping',
  'vizSettings',
  'colorConfig',
  'mapTitle',
  'excludedRows',
  'rawData',        // kullanıcı verisi — bu gerekli
  'columns',
] as const
// provincesGeoJSON, districtsGeoJSON, provinceIndex, districtIndex LİSTEDE DEĞİL
```

### 5.5 Tahmini payload boyutu

| Senaryo | Boyut |
|---|---|
| Koroplet, 81 il × 1 kolon | ~10 KB |
| Koroplet, 973 ilçe × 3 kolon | ~80 KB |
| Kullanıcı noktaları (1000 adet, öznitelik dahil) | ~400 KB |
| Veri oluşturma, 50 poligon (orta karmaşıklık) | ~200 KB |
| **Uç senaryo** (büyük çizim + tam ilçe veri) | ~1 MB |

Backend tarafında 2 MB hard cap öneriliyor.

### 5.6 Backend endpoint seti

Base: `https://ogmmateryal.eba.gov.tr/cbs-backend/api`
Response format: `{ data, errorMessage }` (mevcut storymap sözleşmesiyle uyumlu, lowercase key)

#### Auth (mevcut — storymap ile paylaşılan)
- `POST /Login` — MEBBİS token → JWT Bearer

#### Yeni: Viz CRUD
- `GET /Viz` — kullanıcının paylaşımları (v1.1, liste UI için)
- `GET /Viz/{id}` — sahibi olarak detay
- `POST /Viz` — yeni görselleştirme kaydet
- `PUT /Viz/{id}` — güncelle
- `DELETE /Viz/{id}` — sil

#### Yeni: Paylaşım
- `PATCH /Viz/share/{id}` — body: `{ mode: 'view' | 'edit' }` → response: `{ publicKey, editKey, mode }`
- `PATCH /Viz/unshare/{id}` — paylaşım iptal
- `GET /Viz/public/{publicKey}` — auth yok, sadece `isshared=true` ve `mode=view|edit` ise payload döner
- `PUT /Viz/edit/{editKey}` — auth yok, sadece `mode=edit` ise güncelleme kabul

#### Schema (öneri)
```sql
Viz {
  id            GUID PK
  ownerId       GUID FK (user)
  title         VARCHAR(200)
  kind          VARCHAR(20)      -- 'viz' | 'data-creation' | 'mixed'
  payload       TEXT             -- SharedVizPayload JSON
  isShared      BOOL
  shareMode     VARCHAR(10)      -- 'view' | 'edit' | NULL
  publicKey     VARCHAR(16) UNIQUE NULL
  editKey       VARCHAR(16) UNIQUE NULL
  createdAt     DATETIME
  updatedAt     DATETIME
  lastEditedAt  DATETIME NULL    -- edit linki ile yapılan son değişiklik
}
```

### 5.7 Güvenlik

- **Edit key rotation:** `unshare` → eski keyler ölür; tekrar `share` → yeni keyler üretilir
- **Rate limit:** `PUT /Viz/edit/{editKey}` için IP bazlı 60 req/dk
- **Payload sanitization:** XSS'e karşı başlık/açıklama alanları escape edilir
- **CORS:** Mevcut backend CORS policy devam eder (backendrehber.md)
- **JWT TTL:** sessionStorage, tab kapanınca silinir (kabul edilen davranış)

### 5.8 Mimari kısıtlamalar (CLAUDE.md uyumu)

- `share` feature yalnızca `@/stores/`, `@/shared/`, `@/utils/`, `@/types/`, `@/constants/`'dan import edebilir
- Store'lardan veri okumak `sharePayload.ts` içinde olmalı — diğer feature'lardan **direkt import yok**
- Barrel: `@/features/share` — deep import yasak
- ESLint config'e whitelist gerekiyorsa: `AppLayout` paylaşım modunu okumak için `@/features/share` kullanır (orchestrator zaten feature barrel import ediyor, sorun olmamalı)

### 5.9 Performans

- Public view açılışında 81 il GeoJSON cache warm-up (zaten yapılıyor) **BEKLENMEDEN** payload fetch paralel yapılabilir
- `applySharedPayload` React `startTransition` ile sarmalanır (mevcut INP pattern)
- Büyük `userData.rows` için `IntersectionObserver` bazlı pagination **gerekmez** — Excel boyutları hedef kitle için yeterli

### 5.10 Hata durumları

| Durum | Kullanıcı mesajı |
|---|---|
| 404 key | "Paylaşım bulunamadı. Link silinmiş veya hiç oluşturulmamış olabilir." |
| 410 unshared | "Bu paylaşım sahibi tarafından iptal edildi." |
| 401 token expired (paylaşım sırasında) | Sessiz logout → login modal |
| Payload parse error (version mismatch) | "Bu paylaşım daha yeni bir sürümle oluşturulmuş. Uygulamayı güncelleyin." |
| Edit için write 409 conflict (ileride) | v1 kapsam dışı — son yazan kazanır |
| Network | Toast + "Tekrar Dene" |

---

## 6. UX Detayları

### 6.1 Paylaşım rozeti
- Görüntüleme modu: gri zemin, göz ikonu
- Düzenleme modu: turuncu zemin, kalem ikonu + "Son kayıt: Xm önce"
- Üst bardan bağımsız, map container köşesinde sticky

### 6.2 QR kod
- `qrcode.react` (~4 KB gzipped) paketi
- SVG olarak render, indir butonu yok (v1 — kopyalama yeterli)

### 6.3 Kopyala feedback
- `navigator.clipboard.writeText` + toast "Kopyalandı"
- 2 sn sonra ikon animasyonu (check)

### 6.4 Kod girişi
- Üst barda (veya AppLayout drawer) "Paylaşım Kodu ile Aç" inputu
- Enter veya butonla `?share=<key>&mode=view` URL'e yönlendir

### 6.5 Veri gizlilik uyarısı
İlk paylaşım oluştururken uyarı satırı:
> ⚠️ Yüklediğiniz veri paylaşım linkinde görüntülenecek. Paylaşımdan önce kişisel bilgileri temizleyin.

---

## 7. Başarı Kriterleri (Acceptance)

1. ✅ Kimliksiz kullanıcı uygulamada viz üretebilir (mevcut akış bozulmaz)
2. ✅ "Paylaş" butonuna basıldığında kimliksiz kullanıcıya login modal çıkar
3. ✅ Giriş sonrası kullanıcı aynı yerden devam eder (store state korunmuş)
4. ✅ Mod seçilip paylaşım oluşturulduğunda `publicKey` ve `editKey` döner
5. ✅ Link kopyalanır, başka sekmede açılır → aynı viz render edilir
6. ✅ `mode=view` linkiyle açıldığında wizard/paylaş/dışa aktar butonları gizlidir
7. ✅ `mode=edit` linkiyle yapılan değişiklik PUT ile kaydedilir, owner yenilediğinde görür
8. ✅ Owner "İptal Et" → eski link 410 Gone döner
9. ✅ Paylaşım payload boyutu hiçbir senaryoda 2 MB'ı geçmez
10. ✅ Payload içinde il/ilçe GeoJSON bulunmaz (allowlist testi ile doğrulanır)
11. ✅ VSA cross-feature import ihlali yok (ESLint temiz)
12. ✅ Public view açılış süresi < 3 sn (81 il warm cache varsayımıyla)

---

## 8. Geliştirme Sırası

### Faz 1 — Temel altyapı (2–3 gün)
- `src/shared/api/apiService.ts`
- `src/shared/auth/` katmanı
- `login-redirect` URL handler
- MEBBİS login URL builder
- Toast + sessionStorage testleri

### Faz 2 — Payload serializer (1–2 gün)
- `sharePayload.ts` (allowlist)
- Unit testler: GeoJSON sızıntısı olmadığını doğrula
- `applySharedPayload` + store hidrasyon testleri

### Faz 3 — Share feature UI (3–4 gün)
- `ShareButton`, `SharePanel`, `ShareAuthPrompt`, `ShareModeBadge`
- `useShare`, `useSharedMode`
- URL param parse
- Backend mock (MSW) ile uçtan uca test

### Faz 4 — Backend entegrasyonu (backend ekibi ile paralel)
- Endpoint kontratlarının finalize edilmesi
- Gerçek backend ile smoke test
- CORS doğrulama

### Faz 5 — Public view modu (2 gün)
- AppLayout/Sidebar'da mod-aware render
- Rozet, kilit UI
- Edit mod "Kaydet" PUT akışı

### Faz 6 — Cila (1–2 gün)
- QR kod
- Kod giriş inputu
- Hata ekranları (404/410)
- Veri gizlilik uyarısı

**Tahmini toplam:** ~10–14 gün frontend (backend paralel).

---

## 9. Riskler

| Risk | Etki | Olasılık | Azaltma |
|---|---|---|---|
| Backend ekibi gecikir | Tüm özellik bloke | Yüksek | Frontend MSW ile bağımsız geliştirir, kontrat dondurulur |
| Edit link kötüye kullanımı (geniş paylaşım) | Veri kaybı | Orta | Owner unshare → key rotation + UI uyarısı |
| MEBBİS OAuth redirect SPA'de farklı davranır | Login akışı bozulur | Orta | LoginRedirect.html yerine React route + `history.replaceState` ile token yakala, referans projede çalışan desen temel alınır |
| sessionStorage tab kapanıp açılınca token gider | Paylaşım oluşturma sırasında login yeniden gerekir | Düşük | Kabul edilen davranış; refresh token v1 kapsamı dışı |
| Payload şeması ileride değişir | Eski linkler kırılır | Orta | `version: 1` alanı zorunlu + backward-compat loader |
| Büyük `userData.rows` payload şişirir | 2 MB limit aşılır | Düşük | Satır sayısı > 50k ise paylaşım engel + uyarı |
| Yanlışlıkla provincesGeoJSON payload'a girer | Payload 45 MB olur | Düşük (allowlist sayesinde) | CI test: payload boyutu > 2 MB → fail |
| Edit modda conflict | Yazı kaybı | Orta | v1 "son yazan kazanır" kabul, UI uyarısı: "Son kayıt: Xm önce" |

---

## 10. Bağımlılıklar

### Frontend
- `qrcode.react` (yeni) — ~4 KB
- Mevcut: `zustand`, `react-hot-toast`, `maplibre-gl`

### Backend
- Yeni `Viz` tablosu + endpoint seti (bkz. §5.6)
- Mevcut: MEBBİS OAuth, `POST /Login`

### Referans kod
- `react-app/storymap/src/services/authManager.js` — MEBBİS pattern örneği
- `react-app/storymap/src/services/apiService.js` — fetch wrapper örneği
- `react-app/storymap/docs/API_REFERENCE.md` — backend response format sözleşmesi

---

## 11. Açık Sorular

1. **Paylaşımlarım listesi** v1'de mi v1.1'de mi? (Öneri: v1.1, v1 sadece tek paylaşım yönetimi)
2. **Düzenleme bildirimi**: Owner'a "birisi linkinizi düzenledi" mail/bildirim gidecek mi? (Öneri: v1 hayır)
3. **Paylaşım süresi**: Zaman sınırlı link (örn. 30 gün) olacak mı? (Öneri: v1'de süresiz, v2'de opsiyonel TTL)
4. **Anonim tracking**: Edit link ile gelen değişiklikler için anonim oturum ID saklansın mı? (Öneri: v1'de hayır, v1.1'de audit log için evet)
5. **Storymap entegrasyonu**: Storymap modal açıkken paylaşım nasıl çalışır? (Öneri: kapsam dışı — storymap kendi paylaşımını kullanır)

---

## 12. İlgili Dokümantasyon

- `CLAUDE.md` — Proje mimari kuralları (VSA, cross-feature yasağı)
- `storymap/docs/API_REFERENCE.md` — Backend sözleşmesi (referans)
- `storymap/docs/AUTH_AND_LANDING_PRD.md` — MEBBİS auth akışı (referans)
- `storymap/docs/collaboration-feature-prd.md` — Edit token fikri (referans, storymap'te henüz yapılmamış)
- `storymap/backendrehber.md` — Backend CORS/config

---

**Son Güncelleme:** 2026-04-22
