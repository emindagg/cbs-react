# ESLint Analiz Raporu

## Feature-based kurallar uygulanmış mı? **Evet**

`eslint.config.js` içinde **FEATURE-BASED ARCHITECTURE RULES** bölümü tanımlı:

| Kural | Ayar | Amaç |
|-------|------|------|
| `max-lines` | 600 (warn), skipBlankLines + skipComments | Dosya boyutu limiti (pragmatik) |
| `max-lines-per-function` | 300 (warn), skipBlankLines + skipComments | Fonksiyon boyutu limiti (pragmatik) |
| `import/order` | gruplar + alfabetik (error) | Tutarlı import sırası |
| `import/no-duplicates` | error | Tekrarlı import yasak |
| `@typescript-eslint/no-explicit-any` | warn | any kullanımı |
| `@typescript-eslint/no-unused-vars` | error | Kullanılmayan değişken |
| `@typescript-eslint/consistent-type-imports` | error | type import ayrımı |
| `react-hooks/*` | recommended | Hooks kuralları |
| `no-console` | warn | console.log uyarısı |
| `no-debugger` | error | debugger yasak |
| `no-alert` | warn | alert uyarısı |
| `prefer-const` / `no-var` | error | const/let tercihi |
| `eqeqeq` | error | === zorunlu |
| `no-magic-numbers` | warn + ignore listesi | Sabitler için |
| `@stylistic/semi` | never | Noktalı virgül yok |
| `@stylistic/quotes` | single | Tek tırnak |
| `@stylistic/comma-dangle` | always-multiline | Trailing virgül |
| `@stylistic/indent` | 2 | 2 boşluk girinti |

---

## Mevcut ihlal özeti

### 1. Import sırası (import/order) – birçok dosya
- `DynamicLegend.tsx`, `DataMapper.tsx`, `DatawrapperStyleConfig.tsx`, `LegendContainer.tsx`, `VizWizardStep2.tsx`, `VizWizardStep3.tsx`, `DataMapperModal.tsx`
- **Öneri:** `pnpm run lint:fix` ile otomatik düzeltilebilir.

### 2. Girinti (@stylistic/indent) – 2 space bekleniyor
- `DataMapperModal.tsx`, `DataMapper.tsx`, `CustomRangeConfig.tsx`, `LegendConfig.tsx`, `Legend.tsx` ve diğerleri
- **Öneri:** `lint:fix` veya editörde “Indent: 2 spaces” ile düzelt.

### 3. Feature-based limit aşımları
- **Güncel (300/600 pragmatik):** ESLint kuralları 300 (fonksiyon) / 600 (dosya) olarak güncellendi; **VizWizardStep3** refactor edildi (SymbolSettings, StepsSection, MapTitleSection ayrı dosyalara taşındı).
- **Hâlâ limit aşan:** DataMapper (fonksiyon ~387, dosya ~432), Legend (fonksiyon ~346), LegendConfig (283), CustomRangeConfig (226), classificationMethods (dosya 440).
- **Öneri:** DataMapper / Legend benzer şekilde alt bileşenlere bölünebilir.

### 4. React Hooks
- **Conditional hooks (rules-of-hooks):** `DynamicLegend.tsx`, `Legend.tsx` – early return sonrası hook çağrısı
- **setState in effect:** `CustomRangeConfig.tsx` – effect içinde senkron setState
- **exhaustive-deps:** Legend, MapTitle, SearchContainer – dependency array eksik/yanlış
- **Öneri:** Hook’ları her zaman üstte, koşulsuz çağır; effect’te setState yerine derived state veya callback kullan.

### 5. Diğer
- **no-alert:** SidebarDataCreation, VizWizardStep1/2, useDataExport, useFileImport, useUrlImport – toast/modal ile değiştirilebilir.
- **no-magic-numbers:** Birçok dosya – sabitleri named constant yapın veya ignore listesine ekleyin.
- **comma-dangle:** LegendLabels.tsx – lint:fix ile düzelir.

---

## Import order (örn. DynamicLegend) nasıl test edilir?

1. **ESLint (import/order kuralı):**
   ```bash
   pnpm run lint -- src/components/Legend/DynamicLegend.tsx
   ```
   Bu dosyada `import/order` **error** çıkmıyorsa sıra doğrudur. (Sadece warning’ler kalabilir.)

2. **TypeScript / build:**
   ```bash
   pnpm run build
   ```
   Build başarılıysa tüm import’lar (type dahil) doğru çözülüyor demektir. Build başka bir dosyada (örn. DataMapper) hata veriyorsa, o dosyayı ayrı düzeltmek gerekir.

3. **Çalışma zamanı (isteğe bağlı):** `pnpm run dev` ile uygulamayı açıp harita üzerinde lejandı kullan (görselleştirme adımlarında DynamicLegend, LegendContainer üzerinden render edilir). Görünüm ve davranış normalse import değişikliği sorun çıkarmıyordur.

---

## Kritik warning'ler ve iyileştirme durumu

### 1. Legend / MapTitle / SearchContainer – exhaustive-deps (handleMouseMove / handleSearchSubmit)

| Durum | Açıklama |
|-------|----------|
| **Yapılmadı** | `Legend.tsx:72` → `useEffect` dependency array'de `handleMouseMove` eksik. |
| **Yapılmadı** | `MapTitle.tsx:90` → `useEffect` dependency array'de `handleMouseMove` eksik. |
| **Yapılmadı** | `SearchContainer.tsx:108` → `useEffect` dependency array'de `handleSearchSubmit` eksik. |

**Nasıl düzeltilir:** Handler'ı `useCallback` ile sarıp dependency listesine eklemek veya (stabil referans istiyorsanız) `useRef` ile tutup effect içinde ref üzerinden çağırmak. Gereksiz re-subscribe’ları önlemek için dependency’yi bilinçli bırakıp satır üstü `// eslint-disable-next-line react-hooks/exhaustive-deps` da kullanılabilir.

---

### 2. alert → toast / snackbar

| Durum | Açıklama |
|-------|----------|
| **Yapılmadı** | Projede **toast/snackbar/notification** altyapısı yok (paket veya ortak bileşen yok). |
| **Yapılmadı** | **alert** kullanılan yerler: `useDataExport.ts` (4), `useFileImport.ts` (3), `useUrlImport.ts` (2), `useMatching.ts` (1), `useVizRender.ts` (2), `SidebarDataCreation.tsx` (4), `VizWizardStep1.tsx` (1). Toplam ~17 kullanım. |

**Nasıl ilerlenir:** Önce `react-hot-toast`, `sonner` veya `notistack` gibi bir kütüphane ekleyip uygulama kökünde Provider kurun; sonra bu dosyalardaki `alert(...)` çağrılarını `toast.success()` / `toast.error()` (veya seçtiğiniz API) ile değiştirin.

---

### 3. max-lines / max-lines-per-function – uzun dosya ve fonksiyonlar

**Yapılanlar:**
- ESLint kuralları **300 (fonksiyon) / 600 (dosya)** pragmatik değerlere güncellendi (`skipBlankLines`, `skipComments` açık).
- **VizWizardStep3** refactor edildi: `VizWizardStep3SymbolSettings`, `VizWizardStep3StepsSection`, `VizWizardStep3MapTitleSection` ayrı dosyalara taşındı; ana dosya ~333 satıra indi.

| Durum | Dosya / bileşen | Limit | Mevcut |
|-------|-----------------|-------|--------|
| **Yapıldı** | VizWizardStep3 (refactor) | 300/600 | ~333 satır |
| **Yapıldı** | DataMapper (refactor) | 300/600 | ~254 satır (toolbar, sidebar form, grid, hook ayrıldı) |
| **Yapıldı** | Legend (refactor) | 300/600 | ~182 satır (LegendBarContent, legendItemGenerators ayrıldı) |
| **Kalan** | `LegendConfig.tsx` (fonksiyon) | 300 | 283 |
| **Kalan** | `CustomRangeConfig.tsx` (fonksiyon) | 300 | 226 |
| **Kalan** | `classificationMethods.ts` (dosya) | 600 | 440 |

**Nasıl ilerlenir:** DataMapper / Legend benzer şekilde alt bileşenlere böl; `classificationMethods` util dosyasını mantıksal modüllere böl.

---

## Sonuç

- Feature-based kurallar **tanımlı ve aktif**.
- İhlaller çoğunlukla: **import/order**, **indent**, **max-lines/max-lines-per-function**, **react-hooks**, **no-alert**, **no-magic-numbers**.
- Önce `pnpm run lint:fix` çalıştırın; kalan hatalar için yukarıdaki önerilere göre manuel düzenleme veya refactor yapın.
