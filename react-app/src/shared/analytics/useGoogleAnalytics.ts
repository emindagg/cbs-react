import { useEffect } from 'react'

import { initGoogleAnalytics, trackPageView } from './googleAnalytics'

/**
 * Google Analytics Hook
 * Uygulama yüklendiğinde Google Analytics'i initialize eder
 */
export function useGoogleAnalytics(): void {
  useEffect(() => {
    // İlk yüklemede initialize et
    initGoogleAnalytics()
    
    // İlk sayfa görüntülemesini gönder
    trackPageView(window.location.pathname + window.location.search, document.title)
  }, [])
}
