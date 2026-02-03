import AppLayout from '@/components/layout/AppLayout'
import { MapProvider } from 'react-map-gl/maplibre'

function App() {
  return (
    <MapProvider>
      <AppLayout />
    </MapProvider>
  )
}

export default App
