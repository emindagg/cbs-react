# Renk Ölçeği ve Sınıflandırma Özellikleri

Güncellendi: 2026-05-01

Bu doküman, projedeki güncel renk ölçeği özelliklerini kaynak koda göre özetler. Entegrasyon zinciri için `docs/COLOR_SCALE_INTEGRATION.md`, üst seviye mimari için `docs/ARCHITECTURE.md` referans alınmalıdır.

## Kapsam

Renk ölçeği akışı üç görselleştirme türünde farklı davranır:

| Görselleştirme | Renk ölçeği davranışı |
|---|---|
| Koroplet harita | Basamaklı veya sürekli renk ölçeği doğrudan polygon dolgusuna uygulanır. |
| Kabarcık harita | `colorColumn` seçilirse bivariate renk ölçeği çalışır; seçilmezse kabarcıklar tek `symbolFillColor` ile çizilir. |
| Nokta yoğunluk | Basamaklı/sürekli renk ölçeği kullanılmaz; nokta rengi, nokta değeri ve nokta boyutu ayrı ayarlanır. |

Ana UI orkestrasyonu:

- `src/features/viz-wizard/steps/Step3/index.tsx`
- `src/features/viz-wizard/steps/Step3/useVizWizardStep3.ts`

## Tip Sözleşmesi

Güncel tipler `src/types/visualization.ts` içindedir.

`ClassificationMethod`:

- `quantile`
- `equal`
- `jenks`
- `custom`
- `stddev`
- `continuous-linear`
- `continuous-quantile`
- `continuous-natural`

`ColorScaleType`:

- `steps`
- `continuous`

`InterpolationMethod`:

- `equidistant`
- `quantiles-4`
- `quantiles-5`
- `quantiles-10`
- `natural-9`

Not: Projede `kmeans` sınıflandırma tipi yoktur. Eski dokümanlarda görülen `classificationMethods.ts` dosyası da mevcut değildir.

## Ölçek Türleri

`ColorScaleConfig` iki ölçek türü sunar:

- `steps`: sınıflı/basamaklı renkler
- `continuous`: sürekli gradyan

İlgili bileşen:

- `src/features/viz-wizard/components/ColorScale/Config.tsx`

Step 3 görünürlük koşulları:

| UI parçası | Gösterim koşulu |
|---|---|
| `ColorScaleConfig` | `choropleth` veya `bubble + colorColumn` |
| `ColorSchemePicker` | `ColorScaleConfig` ile aynı |
| `StepsSection` | `scaleType === 'steps'`, `dot` değil, tek renkli `bubble` değil |
| `CustomRangeConfig` | Her zaman "Değer Aralığı" kartında görünür, iç alanlar toggle ile açılır |
| `DataDistributionPreview` | `showDataPreview === true` ve `dataValues.length > 0` |
| Akıllı öneri | Sadece koroplet akışında görünür |
| `BubbleSettings` | Sadece `bubble` |
| `DotDensitySettings` | Sadece `dot` |

## Basamaklı Sınıflandırma

Step 3'te görünen yöntemler `src/features/viz-wizard/steps/Step3/components/StepsSection.tsx` içinde tanımlıdır:

- `jenks`: Doğal kırılmalar
- `equal`: Eşit aralık
- `quantile`: Eşit sayım/yüzdelik
- `custom`: Kullanıcı tanımlı sınır değerleri

`custom` seçildiğinde `CustomBreaksInput` devreye girer:

- En az 4 sınır değeri girilir ve 3 sınıf oluşur.
- En fazla 8 sınır değeri girilir ve 7 sınıf oluşur.
- Değerlerin artan sırada olması gerekir.
- Türkçe binlik ayraçlı giriş desteklenir.

Sınıf sayısı kuralları `src/utils/legendClassCount.ts` üzerinden gelir:

- `classCount`: 3 ile 7 arasında tutulur.
- `bubbleLegendCount`: aynı clamp kuralını kullanır.
- Geçerli `customBreaks` gelirse `classCount = customBreaks.length - 1` olarak normalize edilir.

`stddev` desteği:

- `ClassificationMethod` tipinde ve `src/utils/classification.ts` içinde vardır.
- Dereceli bubble boyut lejantında kullanılır.
- Ana koroplet `StepsSection` açılır menüsünde sunulmaz.

## Sürekli Ölçek

Sürekli moddaki preset'ler `src/utils/interpolation.ts` içinde tanımlıdır:

| Preset | Sınıf sayısı | Render sınıflandırması |
|---|---:|---|
| `equidistant` | 5 | `continuous-linear` |
| `quantiles-4` | 4 | `continuous-quantile` |
| `quantiles-5` | 5 | `continuous-quantile` |
| `quantiles-10` | 10 | `continuous-quantile` |
| `natural-9` | 9 | `continuous-natural` |

Step 3, preset değişiminde `vizSettings.classificationMethod` ve `vizSettings.interpolation` alanlarını senkronize eder. Renderer tarafında sürekli renk için 16 stop'lu MapLibre `interpolate` ifadesi üretilir; lejant tarafında gradyan için 30 renk örneklenir.

Sürekli normalizasyon:

- `equidistant`: min/max aralığında doğrusal normalizasyon
- `quantiles-*`: quantile break'leri üzerinden segmentli normalizasyon
- `natural-9`: Jenks break'leri üzerinden segmentli normalizasyon

## Renk Paletleri

Paletler `src/constants/colorSchemes.ts` içinde tanımlıdır. UI listesi `COLOR_SCHEME_LIST` sırasını kullanır.

Tek renkli/sıralı paletler:

- `blues`: Maviler
- `reds`: Kırmızılar
- `greens`: Yeşiller
- `purples`: Morlar
- `amber`: Kehribar
- `greenBlue`: Yeşil-Mavi
- `teal`: Deniz Yeşili
- `yellowGreen`: Sarı-Yeşil
- `yellowBlue`: Sarı-Mavi
- `sunset`: Gün Batımı
- `orange`: Turuncu
- `pinkPurple`: Pembe-Mor
- `rosePurple`: Gül-Mor
- `slate`: Arduvaz
- `plasma`: Plazma
- `viridis`: Viridis

Yükseklik paletleri:

- `elevationTerrain`: Yükseklik - Arazi
- `elevationLand`: Yükseklik - Kara
- `elevationAnalytic`: Yükseklik - Analitik
- `elevationArctic`: Yükseklik - Arktik

Kategorik amaçlı paletler:

- `tropicalBliss`: Boncuklu Pastel
- `colorblindSafe`: Renk Körü Güvenli

Ayrık paletler:

- `brownTeal`: Kahve-Deniz
- `redTeal`: Kırmızı-Deniz
- `redBlue`: Kırmızı-Mavi
- `redBlueDiverging`: Kırmızı-Mavi Ayrık
- `tealPurple`: Mor-Yeşil
- `pinkGreen`: Pembe-Yeşil

Temel yardımcılar:

- `getColorPalette`
- `getInterpolatedColorPalette`
- `getContinuousColor`
- `getColorForValue`
- `getContinuousColorForValue`

## Özel Aralık

`CustomRangeConfig` şu alanları yönetir:

- `enabled`
- `min`
- `center`
- `max`
- `outOfRangeMode`

`outOfRangeMode` seçenekleri:

- `gray`: Aralık dışı öğeleri griye boyar.
- `transparent`: Aralık dışı öğeleri filtreler veya görünmez yapar.

Gerçek render davranışı:

- Renderer'lar `min`, `max` ve `outOfRangeMode` kullanır.
- `center` UI ve doğrulama state'inde bulunur, render hesaplarına bugün bağlanmamıştır.
- Koroplet akışında özel aralık renk değerlerini clamp eder.
- Bubble akışında özel aralık renk değerlerine uygulanır, boyut hesabına uygulanmaz.
- Dot density akışında özel aralık nokta üretimi ve görünürlüğü için kullanılır.

İlgili dosyalar:

- `src/features/viz-wizard/components/CustomRange/Config.tsx`
- `src/features/viz-wizard/components/CustomRange/ConfigFields.tsx`
- `src/features/viz-wizard/components/CustomRange/useCustomRange.ts`
- `src/features/visualization/shared/customRange.ts`

## Veri Dağılımı Önizlemesi

`DataDistributionPreview`, seçilen ölçeğin veri dağılımını nasıl böleceğini gösterir.

İlgili dosyalar:

- `src/features/viz-wizard/components/ColorScale/DistributionPreview.tsx`
- `src/utils/dataStats.ts`

Gösterilen istatistikler:

- en küçük değer
- en büyük değer
- ortalama
- medyan
- CV
- çarpıklık uyarısı
- aykırı değer uyarısı

Hesaplama davranışı:

- `steps` modunda `calculateBreaks(values, classificationMethod, classCount)` kullanılır.
- `continuous` modunda `calculateBreaksFromInterpolation(values, interpolation)` kullanılır.
- Sürekli moddaki efektif sınıf sayısı `getClassCountFromInterpolation()` ile alınır.

## Akıllı Öneri

Akıllı öneri akışı:

- `src/features/viz-wizard/hooks/useVizSuggestion.ts`
- `src/utils/dataStats.ts`

Güncel öneri motoru yalnızca şu iki yöntemi döndürür:

- `jenks`
- `quantile`

Karar verirken CV, çarpıklık ve aykırı değer sinyallerini kullanır. Logaritmik, rounded veya color-space tabanlı yöntem önermez.

## Bubble Özellikleri

Bubble ayarları:

- `src/features/visualization/bubble/components/BubbleSettings.tsx`
- `src/features/visualization/bubble/services/BubbleRenderer.ts`

Desteklenen boyut modları:

- `proportional`: Oransal boyutlandırma
- `graduated`: Sınıflı/dereceli boyutlandırma

Oransal boyut ölçekleri:

- `sqrt`
- `log`

Dereceli bubble boyut sınıflandırması:

- `jenks`
- `quantile`
- `equal`
- `stddev`

Renk davranışı:

- `colorColumn` yoksa bubble tek renkli çalışır.
- `colorColumn` varsa bivariate modda renk sütunu ayrı sınıflandırılır.
- Tek renkli bubble modunda renk lejantı gösterilmez, boyut lejantı anlamlıdır.
- Bivariate bubble modunda renk lejantı ve boyut lejantı birlikte gösterilebilir.

## Dot Density Özellikleri

Dot density akışı:

- `src/features/visualization/point/components/DotDensitySettings.tsx`
- `src/features/visualization/point/services/PointRenderer.ts`
- `src/features/visualization/point/utils/dot-density.ts`

Desteklenen ayarlar:

- `dotValue`: 1 noktanın temsil ettiği değer
- `dotSize`: nokta boyutu
- `dotColor`: nokta rengi
- `dotOpacity`: nokta opaklığı
- `dotLabel`: lejant etiketi

Davranış:

- Noktalar seeded PRNG ile deterministik saçılır.
- Global ve feature başına nokta limitleri uygulanır.
- Basamaklı veya sürekli renk sınıflandırması kullanılmaz.
- Özel aralık açıkken `gray` modu aralık dışı noktaları gri yapar, `transparent` modu filtreler.

## Lejant Özellikleri

Lejant yapılandırması:

- `src/shared/legend/index.ts`
- `src/features/legend/components/Config.tsx`
- `src/features/legend/components/Container.tsx`

Config panelinde görünen ayarlar:

- Lejant görünürlüğü
- Boyut
- Yönlendirme: `horizontal` veya `vertical`
- Etiket tipi: `ruler`, `ranges`, `custom`
- Sayı formatı
- Başlık görünürlüğü, metni ve yazı boyutu
- Lejant sırasını tersine çevirme
- Yön oku görünürlüğü, modeli, pusula yönü ve boyutu

`LegendPosition` tipi şu değerleri destekler:

- `above`
- `below`
- `inside-left-top`
- `inside-center-top`
- `inside-right-top`
- `inside-left-bottom`
- `inside-center-bottom`
- `inside-right-bottom`

Not: Güncel `LegendConfig` paneli konum seçicisi göstermiyor; render bileşenleri `config.position` değerini destekliyor.

Lejant seçim mantığı:

- Dot density için `DotDensityLegend`
- Tek renkli bubble için `BubbleSizeLegend`
- Bivariate bubble için renk lejantı ve boyut lejantı
- Yatay renk lejantı için `DynamicLegend`
- Dikey renk lejantı için `ColorLegend`

## Utility Katmanı

`src/utils/colorInterpolation.ts` utility düzeyinde daha geniş kapasite sağlar:

- renk uzayları: `rgb`, `hsl`, `lab`, `hcl`
- `interpolateColor`
- `generateColorScale`
- `generateDivergingScale`
- `bezierInterpolate`
- `generateBezierColorScale`

Güncel wizard UI bu yeteneklerin tamamını açmaz:

- Kullanıcıya açık color-space seçici yoktur.
- Kullanıcıya açık Bezier/linear interpolation anahtarı yoktur.
- Render ve lejant akışında pratik renk uzayı çoğunlukla `lab` olarak sabittir.

## Destek Matrisi

| Alan | Gerçek destek | UI'de görünür mü? | Ana dosya |
|---|---|---|---|
| Koroplet basamaklı sınıflandırma | `jenks`, `equal`, `quantile`, `custom` | Evet | `src/features/viz-wizard/steps/Step3/components/StepsSection.tsx` |
| Bubble dereceli boyut sınıflandırması | `jenks`, `quantile`, `equal`, `stddev` | Evet | `src/features/visualization/bubble/components/BubbleSettings.tsx` |
| Ek utility sınıflandırması | `stddev`, `continuous-*` | Kısmen | `src/utils/classification.ts` |
| Sürekli preset'ler | `equidistant`, `quantiles-4`, `quantiles-5`, `quantiles-10`, `natural-9` | Evet | `src/utils/interpolation.ts` |
| Renk uzayları | `rgb`, `hsl`, `lab`, `hcl` | Hayır | `src/utils/colorInterpolation.ts` |
| Bezier renk üretimi | Var | Hayır | `src/utils/colorInterpolation.ts` |
| Özel aralık min/max | Var | Evet | `src/features/visualization/shared/customRange.ts` |
| Özel aralık center | State ve validasyon var | Evet | `src/features/viz-wizard/components/CustomRange/*` |
| Render'da center kullanımı | Yok | Hayır | Renderer servisleri |
| `kmeans` | Yok | Hayır | Yok |

## Test Kapsamı

Renk ölçeği akışını doğrudan destekleyen testler:

- `src/utils/classification.test.ts`
- `src/utils/interpolation.test.ts`
- `src/utils/legendClassCount.test.ts`
- `src/constants/colorSchemes.test.ts`
- `src/stores/useVisualizationStore.test.ts`
- `src/features/visualization/shared/customRange.test.ts`
- `src/features/viz-wizard/steps/Step3/components/StepsSection.test.tsx`
- `src/features/viz-wizard/steps/Step3/components/CustomBreaksInput.test.tsx`
- `src/features/viz-wizard/hooks/useVizRender.test.ts`
- `src/features/legend/components/Container.test.tsx`
- `src/features/legend/components/BarContent.test.tsx`
- `src/features/legend/components/LegendLabels.test.tsx`
- `src/features/visualization/choropleth/services/ChoroplethRenderer.test.ts`
- `src/features/visualization/bubble/services/BubbleRenderer.test.ts`
- `src/features/visualization/point/services/PointRenderer.test.ts`

`src/utils/colorInterpolation.ts` için ayrı bir test dosyası bulunmaz.

## Eski Referanslara Dikkat

- `VizWizardStep4` güncel runtime akışında yoktur; görselleştirme ayarları Step 3 içindedir.
- `src/utils/classificationMethods.ts` yoktur.
- `kmeans` sınıflandırması yoktur.
- Logaritmik sınıflandırma renk ölçeği yöntemi değildir; sadece bubble boyut ölçeklemede `symbolScaling = 'log'` olarak vardır.
- `hoverHighlight` benzeri bir lejant config alanı yoktur.
- `CustomRange.center` render sonucunu değiştirmez.
