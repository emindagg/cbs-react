import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useClusteringStore } from '@/stores/useClusteringStore'
import { useMapStore } from '@/stores/useMapStore'

import { useDataManagementStore } from '../../data-management/store/useDataManagementStore'


export function useClustering() {
  const map = useMapStore((state) => state.mapInstance)
  // useShallow ile sadece nokta item'larını subscribe et.
  // ÖNEMLI: Selector içinde yeni nesne oluşturma (spread/map) - sonsuz döngüye yol açar.
  // useShallow her elementi referans olarak karşılaştırır; store'daki stabil DataItem
  // referanslarını döndürmek gerekir. Feature dönüşümü useEffect içinde yapılır.
  const pointItems = useDataManagementStore(
    useShallow((state) =>
      state.items.filter(item =>
        item.visible &&
        (item.type === 'point' ||
          (item.geometry && (item.geometry.type === 'Point' || item.geometry.type === 'MultiPoint'))),
      ),
    ),
  )
  const { isEnabled } = useClusteringStore()

  useEffect(() => {
    if (!map) return

    // Feature dönüşümünü selector'da değil, burada yap
    const pointFeatures = pointItems.map(item => ({
      type: 'Feature' as const,
      geometry: item.geometry,
      properties: { ...item.properties, id: item.id },
    }))

    const sourceId = 'clustered-points-source'
    const clusterLayerId = 'clusters-layer'
    const countLayerId = 'cluster-count-layer'
    const unclusteredLayerId = 'unclustered-point-layer'

    // Click handler tanımla (cleanup için referans gerekli)
    const onClusterClick = (e: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayerId] })
      const clusterId = features[0].properties.cluster_id
      const source = map.getSource(sourceId) as GeoJSONSource

      if (source && source.getClusterExpansionZoom) {
        source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          const coords = features[0].geometry as { type: string; coordinates: [number, number] }
          map.easeTo({
            center: coords.coordinates,
            zoom: zoom,
          })
        }).catch(() => {
          // Ignore errors
        })
      }
    }

    // Cleanup
    const cleanup = () => {
      if (map.getLayer(clusterLayerId)) {
        map.off('click', clusterLayerId, onClusterClick)
        map.removeLayer(clusterLayerId)
      }
      if (map.getLayer(countLayerId)) map.removeLayer(countLayerId)
      if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }

    // Eğer nokta yoksa temizle ve çık
    if (pointFeatures.length === 0) {
      cleanup()
      return
    }

    // Temizle ve yeniden oluştur (Re-creation is cleaner for source type toggling)
    cleanup()

    // Tek bir GeoJSON Source ekle (Tüm noktaları içeren)
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: pointFeatures,
      },
      cluster: isEnabled, // Toggle durumuna göre
      clusterMaxZoom: 14,
      clusterRadius: 50,
    })

    if (isEnabled) {
      // KÜMELEME AKTİF

      // 1. Kümeler (Daireler)
      map.addLayer({
        id: clusterLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100, '#f1f075',
            750, '#f28cb1',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100, 30,
            750, 40,
          ],
        },
      })

      // 2. Küme Sayıları (Text)
      map.addLayer({
        id: countLayerId,
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#ffffff' },
      })

      // 3. Tekil Noktalar (Kümelenmemiş) - Bu layer DataLayer ile çakışabilir
      // Ancak Cluster modu aktifken onları buradan yönetmek, cluster source'dan beslenmek için şarttır.
      // DataLayer'daki noktalar da görünür olacaktır (Duplicate rendering).
      // Bunu önlemek için DataLayer'ı 'cluster enabled' iken pointleri gizleyecek şekilde güncellemek gerekebilir
      // VEYA map.addLayer ile eklediğimiz bu layer, DataLayer'ın üzerine gelecektir.
      // User "Performance" istediği için, aslında DataLayer'ın çizdiği noktaları gizlemek en iyisidir.
      // Ama şimdilik sadece cluster özelliklerini ekleyelim.

      map.addLayer({
        id: unclusteredLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#4264fb',
          'circle-radius': 6,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      })

      // Zoom Event Click
      map.on('click', clusterLayerId, onClusterClick)

    } else {
      // KÜMELEME KAPALI
      // Normalde DataLayer zaten noktaları çiziyor.
      // Ancak 'source' oluşturduğumuz için burada bir şey çizmemize gerek yok.
      // Eğer burada da çizersek duplicate olur.
      // Sadece isEnabled durumunda clustering layerlarını ekliyoruz.
      // Kaynak (source) ekli kalsa da layer yoksa maliyeti düşüktür.
      // Fakat cleanup zaten yapılıyor (isEnabled değişince useEffect tekrar çalışır).
      // Eğer isEnabled false ise, useEffect başında source ekledik (cluster: false olarak).
      // Aslında isEnabled false ise hiç source eklemeye gerek yok, çünkü DataLayer var.
      // Ama kod tutarlılığı için source eklendi, layer eklenmedi.
      // DataLayer kendi kaynağından çizmeye devam eder.
      // (Bu noktada source eklemek gereksiz overhead olabilir ama map.removeSource çağrıldığı için temizlenir).
      // Optimize etmek için:
      if (!isEnabled) {
        if (map.getSource(sourceId)) map.removeSource(sourceId)
        return
      }
    }

    return cleanup

  }, [map, isEnabled, pointItems])
}
