// Atlas Geocoder SDK placeholder type
interface AtlasGeocoderSDK {
    search: (options: {
        query: string
        lng?: number
        lat?: number
        onload: (response: unknown, error: boolean) => void
    }) => void
    reverse: (options: {
        lng: number
        lat: number
        type: number
        onload: (response: unknown, error: boolean) => void
    }) => void
}
