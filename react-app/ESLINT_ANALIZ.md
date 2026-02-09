# ESLint Analiz Raporu

## Feature-based kurallar uygulanmış mı? **Evet**

`eslint.config.js` içinde **FEATURE-BASED ARCHITECTURE RULES** bölümü tanımlı:

| Kural | Ayar | Amaç |
|-------|------|------|
| `max-lines` | 400 (warn) | Dosya boyutu limiti |
| `max-lines-per-function` | 200 (warn) | Fonksiyon boyutu limiti |
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
- **max-lines-per-function (200):** DataMapper (387), VizWizardStep3 (487), Legend (346), LegendConfig (283), CustomRangeConfig (212)
- **max-lines (400):** DataMapper (432), VizWizardStep3 (549), classificationMethods (440)
- **Öneri:** Büyük bileşenleri alt bileşenlere veya hook/utils dosyalarına böl.

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

## Sonuç

- Feature-based kurallar **tanımlı ve aktif**.
- İhlaller çoğunlukla: **import/order**, **indent**, **max-lines/max-lines-per-function**, **react-hooks**, **no-alert**, **no-magic-numbers**.
- Önce `pnpm run lint:fix` çalıştırın; kalan hatalar için yukarıdaki önerilere göre manuel düzenleme veya refactor yapın.
