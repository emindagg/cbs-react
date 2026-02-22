import { Toaster } from 'react-hot-toast'
import { MapProvider } from 'react-map-gl/maplibre'

import AppLayout from '@/components/layout/AppLayout'
import { useGoogleAnalytics } from '@/shared/analytics'

function App() {
  // Google Analytics'i initialize et
  useGoogleAnalytics()

  return (
    <MapProvider>
      <AppLayout />
      <Toaster
        position="top-right"
        toastOptions={{ duration: 4000 }}
        containerStyle={{ right: 'calc(1rem + 5vw)' }}
      />
    </MapProvider>
  )
}

export default App
