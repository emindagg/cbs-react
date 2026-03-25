# Renk Ölçeği ve Sınıflandırma Özellikleri

Bu doküman, projedeki güncel renk ölçeği akışını kod tabanına göre özetler. Odak noktası `VizWizardStep3` içinde kullanılan renk paleti, sınıflandırma, sürekli ölçek, özel aralık ve legend entegrasyonudur.

## Kapsam

Renk ölçeği akışı şu senaryolarda kullanılır:

- **Koroplet harita**: ana renk ölçeği akışı doğrudan kullanılır.
- **Bubble harita**: yalnızca `colorColumn` seçilmişse renk ölçeği paneli aktif biçimde kullanılır.
- **Dot density**: ayrı renk/dot legend akışı vardır; bu dokümandaki stepped/continuous renk ölçeği paneli aynı şekilde kullanılmaz.

İlgili merkez dosya:

- `src/features/viz-wizard/steps/Step3/index.tsx`

## Mevcut Özellik Özeti

### 1. İki ölçek türü

`ColorScaleConfig` iki temel ölçek türü sunar:

- `steps`: sınıflı/basamaklı renkler
- `continuous`: sürekli gradyan

UI bileşeni:

- `src/features/viz-wizard/components/ColorScale/Config.tsx`

Store tipi:

- `src/types/visualization.ts` içindeki `ColorScaleType = 'steps' | 'continuous'`

### 2. Basamaklı sınıflandırma yöntemleri

Step3 içindeki `StepsSection` bugün şu yöntemleri gösterir:

- `jenks`
- `equal`
- `quantile`
- `kmeans`
- `custom`

İlgili dosyalar:

- `src/features/viz-wizard/steps/Step3/components/StepsSection.tsx`
- `src/utils/classification.ts`

Notlar:

- `custom` seçildiğinde sınır değerleri `CustomBreaksInput` ile elle girilir.
- `stddev` desteği `src/utils/classification.ts` ve bazı legend akışlarında mevcut olsa da mevcut Step3 sınıflandırma açılır menüsünde sunulmaz.

### 3. Sürekli ölçek interpolasyon preset'leri

Sürekli modda serbest renk uzayı seçimi değil, hazır interpolasyon preset'leri kullanılır:

- `equidistant`
- `quantiles-4`
- `quantiles-5`
- `quantiles-10`
- `natural-9`

İlgili dosya:

- `src/utils/interpolation.ts`

Bu dosya şu görevleri üstlenir:

- preset'e göre break hesaplama: `calculateBreaksFromInterpolation`
- preset'e göre sınıf sayısı belirleme: `getClassCountFromInterpolation`
- sürekli renkte 0-1 normalizasyonu: `normalizeValue`
- UI açıklama metinleri: `INTERPOLATION_INFO`

### 4. Renk paletleri

Paletler `src/constants/colorSchemes.ts` içinde tanımlıdır. UI tarafında kullanılan liste `COLOR_SCHEME_LIST` ile gelir.

Öne çıkan sıralı paletler:

- `greenBlue`
- `teal`
- `sunset`
- `orange`
- `amber`
- `yellowGreen`
- `pinkPurple`
- `yellowBlue`
- `rosePurple`
- `slate`
- `plasma`
- `viridis`

Ayrık paletler:

- `brownTeal`
- `pinkGreen`
- `redBlue`
- `redBlueDiverging`
- `redTeal`
- `redGreen`
- `centeredPink`

Temel yardımcılar:

- `getColorPalette`
- `getInterpolatedColorPalette`
- `getContinuousColor`
- `getColorForValue`
- `getContinuousColorForValue`

### 5. Özel aralık

Step3 içinde `CustomRangeConfig` her zaman görünür ve şu alanları içerir:

- `min`
- `center`
- `max`
- `outOfRangeMode`

İlgili dosyalar:

- `src/features/viz-wizard/components/CustomRange/Config.tsx`
- `src/features/viz-wizard/components/CustomRange/useCustomRange.ts`
- `src/features/visualization/shared/customRange.ts`

Gerçek render davranışı:

- Render katmanı bugün yalnızca `min`, `max` ve `outOfRangeMode` değerlerini kullanır.
- `center` alanı UI ve validasyon akışında vardır; mevcut renderer/legend hesaplarında aktif kullanılmaz.
- `outOfRangeMode` seçenekleri:
  - `gray`
  - `transparent`

### 6. Veri dağılımı önizlemesi

`DataDistributionPreview` bileşeni seçilen ölçeğin veriyi nasıl böleceğini özetler.

Gösterilen başlıca bilgiler:

- minimum
- maksimum
- ortalama
- medyan
- CV
- çarpıklık ve varyasyon uyarıları
- yönteme göre açıklama metni

İlgili dosyalar:

- `src/features/viz-wizard/components/ColorScale/DistributionPreview.tsx`
- `src/utils/dataStats.ts`

`calculateDataStats` şu alanları hesaplar:

- `min`
- `max`
- `mean`
- `median`
- `stdDev`
- `cv`
- `range`
- `skewness`
- `hasOutliers`

### 7. Akıllı öneri

Akıllı öneri akışı:

- `src/features/viz-wizard/hooks/useVizSuggestion.ts`
- `src/utils/dataStats.ts`

Bugünkü davranış:

- öneri motoru pratikte `jenks` veya `quantile` önerir
- karar verirken CV, çarpıklık ve aykırı değer sinyallerini kullanır
- logaritmik veya rounded gibi yöntemler önerilmez, çünkü projede böyle bir UI akışı yoktur

### 8. Legend entegrasyonu

Legend yapılandırması Step3 içinde ayrı bir panel olarak açılır:

- `src/shared/legend/index.ts`
- `src/features/legend/components/Config.tsx`
- `src/features/legend/components/Container.tsx`

Desteklenen başlıca ayarlar:

- görünürlük
- boyut
- yön: `horizontal | vertical`
- etiket türü: `ruler | ranges | custom`
- sayı formatı
- başlık metni ve başlık font boyutu
- hover vurgulama
- sıralamayı ters çevirme
- yön oku ayarları

Legend konum tipleri:

- `above`
- `below`
- `inside-left-top`
- `inside-center-top`
- `inside-right-top`
- `inside-left-bottom`
- `inside-center-bottom`
- `inside-right-bottom`

Legend üretimi:

- continuous modda: LAB tabanlı 30 renkli gradyan örneklenir
- steps modda: sınıf sayısı veya custom break sayısı kadar renk üretilir

## Wizard Akışı

Renk ölçeği davranışının ana orkestrasyonu `VizWizardStep3` içindedir.

### Sürekli moda geçiş

`scaleType = 'continuous'` seçildiğinde Step3 şunları senkronize eder:

- `classificationMethod = 'continuous-linear'`
- `legendType = 'continuous'`
- `interpolation = colorConfig.interpolation ?? 'equidistant'`

Interpolasyon preset'i değiştiğinde Step3, bunu uygun sürekli sınıflandırma türüne map eder:

- `equidistant` -> `continuous-linear`
- `quantiles-4` / `quantiles-5` / `quantiles-10` -> `continuous-quantile`
- `natural-9` -> `continuous-natural`

### Basamaklı moda dönüş

`scaleType = 'steps'` seçildiğinde Step3 varsayılan olarak şunları kurar:

- `classificationMethod = 'equal'`
- `legendType = 'discrete'`

### Render zinciri

Renk ölçeğiyle ilgili ayarlar önce store'da tutulur, sonra render katmanına taşınır:

- store: `src/stores/useVisualizationStore.ts`
- render köprüsü: `src/features/viz-wizard/hooks/useVizRender.ts`
- render servisleri:
  - `src/features/visualization/choropleth/services/ChoroplethRenderer.ts`
  - `src/features/visualization/bubble/services/BubbleRenderer.ts`
  - `src/features/visualization/point/services/PointRenderer.ts`

`useVizRender`, `colorConfig.customRange` değerini `VisualizationSettings` içine taşıyarak renderer'lara iletir.

## Renderer Davranışı

### Choropleth

`ChoroplethRenderer` içinde:

- steps modda `calculateBreaks` + `buildStepExpression` kullanılır
- continuous modda 16 duraklı (`CONTINUOUS_STOPS = 16`) interpolate ifadesi üretilir
- continuous renkte `normalizeValue(..., interpolation, values)` ile quantile/natural warping uygulanır
- custom range açıksa değerler önce min/max aralığına clamp edilir
- `gray` dış aralık modunda aralık dışı alanlar gri boyanır
- `transparent` modunda aralık dışı davranış görünüm mantığına göre ayrı ele alınır

### Bubble

`BubbleRenderer` içinde:

- tek renkli bubble modunda renk ölçeği yerine sabit `symbolFillColor` kullanılır
- bivariate bubble modunda renk sütunu için aynı stepped/continuous akış devreye girer
- continuous modda yine 16 duraklı LAB tabanlı interpolate ifadesi üretilir
- color range clamp ve `outOfRangeMode` mantığı choropleth ile uyumludur

## Utility Düzeyi ile UI Düzeyi Arasındaki Fark

`src/utils/colorInterpolation.ts` utility düzeyinde şu yetenekleri sağlar:

- renk uzayları: `rgb`, `hsl`, `lab`, `hcl`
- `interpolateColor`
- `generateColorScale`
- `generateDivergingScale`
- `bezierInterpolate`
- `generateBezierColorScale`

Ancak mevcut wizard UI bu yetenekleri doğrudan açmaz:

- kullanıcıya açık bir **color space selector** yoktur
- kullanıcıya açık bir **Bezier / Linear interpolation mode** anahtarı yoktur
- render ve legend entegrasyonunun pratikte kullandığı renk uzayı çoğunlukla **LAB**'dır

Bu nedenle utility katmanı, UI'nin sunduğundan daha geniş kapasiteye sahiptir.

## Destek Matrisi

| Alan | Gerçek destek | UI'de görünür mü? | Ana dosya |
|------|---------------|-------------------|-----------|
| Basamaklı sınıflandırma | `jenks`, `equal`, `quantile`, `kmeans`, `custom` | Evet | `src/features/viz-wizard/steps/Step3/components/StepsSection.tsx` |
| Ek sınıflandırma | `stddev` | Hayır | `src/utils/classification.ts` |
| Sürekli preset'ler | `equidistant`, `quantiles-4`, `quantiles-5`, `quantiles-10`, `natural-9` | Evet | `src/utils/interpolation.ts` |
| Renk uzayları | `rgb`, `hsl`, `lab`, `hcl` | Hayır | `src/utils/colorInterpolation.ts` |
| Bezier renk üretimi | Var | Hayır | `src/utils/colorInterpolation.ts` |
| Custom range min/max | Var | Evet | `src/features/viz-wizard/components/CustomRange/*` |
| Custom range center | Var | Evet | `src/features/viz-wizard/components/CustomRange/*` |
| Render'da center kullanımı | Yok | Hayır | `src/features/visualization/shared/customRange.ts` ve renderer'lar |

## Test Kapsamı

Renk ölçeği akışını doğrudan destekleyen testler:

- `src/utils/classification.test.ts`
- `src/utils/interpolation.test.ts`
- `src/constants/colorSchemes.test.ts`
- `src/features/visualization/shared/customRange.test.ts`
- `src/features/viz-wizard/steps/Step3/components/StepsSection.test.tsx`
- `src/features/legend/components/BarContent.test.tsx`
- `src/features/legend/components/LegendLabels.test.tsx`

Not:

- `src/utils/colorInterpolation.ts` için ayrı bir test dosyası bulunmaz.

## Mevcut Kısıtlar

- Step3 dokümantasyonunda bazen bahsedilen `VizWizardStep4` bu projede yoktur; renk ölçeği akışı Step3 içindedir.
- `src/utils/classificationMethods.ts` adlı bir dosya yoktur; gerçek ayrım `classification.ts`, `interpolation.ts` ve `dataStats.ts` üzerindedir.
- Logaritmik, rounded veya kullanıcıya açık color-space seçimi bugün wizard UI'nin parçası değildir.
- `customRange.center` alanı henüz renderer hesaplarına bağlanmamıştır.

## Başvuru Dosyaları

- `src/types/visualization.ts`
- `src/stores/useVisualizationStore.ts`
- `src/utils/colorInterpolation.ts`
- `src/utils/classification.ts`
- `src/utils/interpolation.ts`
- `src/utils/dataStats.ts`
- `src/constants/colorSchemes.ts`
- `src/features/viz-wizard/components/ColorScale/Config.tsx`
- `src/features/viz-wizard/components/ColorScale/DistributionPreview.tsx`
- `src/features/viz-wizard/components/CustomRange/Config.tsx`
- `src/features/viz-wizard/hooks/useVizSuggestion.ts`
- `src/features/viz-wizard/hooks/useVizRender.ts`
- `src/features/viz-wizard/steps/Step3/index.tsx`
- `src/features/legend/components/Config.tsx`
- `src/features/legend/components/Container.tsx`
- `src/features/visualization/choropleth/services/ChoroplethRenderer.ts`
- `src/features/visualization/bubble/services/BubbleRenderer.ts`
