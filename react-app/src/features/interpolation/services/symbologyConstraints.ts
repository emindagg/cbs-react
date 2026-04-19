import type { InterpolationConfig, InterpolationGridType } from '../types'

/**
 * Sembolojı kısıtları
 *
 * Pürüzsüz (raster) modda her piksel ayrı bir değere sahiptir, dolayısıyla
 * "sınıflandırılmış" görünümün mantıksal karşılığı yoktur. Bu modda her zaman
 * sürekli (stretch) renk geçişi uygulanır.
 *
 * Bu kuralı tek noktadan yöneterek hem UI (panelde seçeneği gizleme) hem de
 * renderer (defansif kontrol) tarafının senkron kalmasını sağlıyoruz.
 */

export const isClassifySupported = (gridType: InterpolationGridType): boolean =>
  gridType !== 'smooth'

/**
 * İlgili config için fiilen uygulanacak symbology değerini döndürür.
 * Pürüzsüz modda symbology=classify seçili olsa bile stretch'e düşer.
 */
export const resolveEffectiveSymbology = (
  config: InterpolationConfig,
): InterpolationConfig['symbology'] =>
  isClassifySupported(config.gridType) ? config.symbology : 'stretch'
