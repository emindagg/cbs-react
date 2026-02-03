import { MapProvider } from 'react-map-gl/maplibre'

import AppLayout from '@/components/layout/AppLayout'

function App() {
  return (
    <MapProvider>
      <AppLayout />
    </MapProvider>
  )
}

export default App
