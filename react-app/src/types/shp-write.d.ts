declare module 'shp-write' {
  interface ShpWriteOptions {
    folder?: string
    types?: {
      point?: string
      polygon?: string
      line?: string
    }
  }

  interface ShpWriteModule {
    zip: (geojson: GeoJSON.FeatureCollection, options?: ShpWriteOptions) => ArrayBuffer
    download: (geojson: GeoJSON.FeatureCollection, options?: ShpWriteOptions) => void
  }

  const shpwrite: ShpWriteModule
  export default shpwrite
}

declare module 'shp-write/shpwrite.js' {
  interface ShpWriteOptions {
    folder?: string
    types?: {
      point?: string
      polygon?: string
      line?: string
    }
  }

  interface ShpWriteModule {
    zip: (geojson: GeoJSON.FeatureCollection, options?: ShpWriteOptions) => ArrayBuffer
    download: (geojson: GeoJSON.FeatureCollection, options?: ShpWriteOptions) => void
  }

  const shpwrite: ShpWriteModule
  export default shpwrite
}
