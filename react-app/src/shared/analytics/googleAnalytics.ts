/**
 * Google Analytics Utility
 * VSA mimarisine uygun Google Analytics entegrasyonu
 */

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = 'UA-114103913-1'

/**
 * Google Analytics script'ini dinamik olarak yükler
 */
function loadGoogleAnalytics(): void {
  // Script zaten yüklenmişse tekrar yükleme
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    return
  }

  // dataLayer'ı initialize et
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }

  // gtag.js script'ini yükle
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // Config'i ayarla
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID)
}

/**
 * Google Analytics'i initialize eder
 */
export function initGoogleAnalytics(): void {
  if (typeof window === 'undefined') return

  // Production ortamında veya her zaman çalıştırılabilir
  loadGoogleAnalytics()
}

/**
 * Event gönderir
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number,
): void {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

/**
 * Sayfa görüntüleme gönderir
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
  })
}
