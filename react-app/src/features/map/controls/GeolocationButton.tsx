import { useGeolocation } from '../hooks/useGeolocation'

/**
 * GeolocationButton
 *
 * Zoom kontrolleri altında yer alan yuvarlak konum butonu.
 * Stil, projedeki diğer harita kontrolleriyle birebir aynı (koyu yuvarlak).
 * Tüm mantık useGeolocation hook'unda yaşar; bu bileşen sadece UI'dır.
 */
export function GeolocationButton() {
    const { status, errorMessage, locate } = useGeolocation()

    const isLoading = status === 'loading'
    const isSuccess = status === 'success'
    const isError = status === 'error'

    const icon = isLoading
        ? 'fa-solid fa-circle-notch fa-spin'
        : 'fa-solid fa-location-arrow'

    // Aktif/hata durumuna göre ikon rengi
    const iconColor = isSuccess
        ? 'text-emerald-400'
        : isError
            ? 'text-red-400'
            : 'text-white'

    const ringClass = isSuccess
        ? 'ring-2 ring-emerald-400'
        : isError
            ? 'ring-2 ring-red-400'
            : ''

    return (
        <div className="relative">
            <button
                id="geolocation-button"
                type="button"
                onClick={locate}
                disabled={isLoading}
                aria-label="Konumuma git"
                title={
                    isLoading ? 'Konum aranıyor…'
                        : isError ? (errorMessage ?? 'Konum hatası')
                            : 'Konumuma git'
                }
                className={[
                    'w-9 h-9 bg-[#1c1c1e] rounded-full',
                    'shadow-[0_2px_8px_rgba(34,34,34,0.35)]',
                    'border-none flex items-center justify-center',
                    'text-sm hover:bg-black/90 active:scale-95',
                    'transition-all cursor-pointer',
                    isLoading ? 'opacity-70 cursor-not-allowed' : '',
                    ringClass,
                ].join(' ')}
            >
                <i className={`${icon} ${iconColor}`} />
            </button>

            {/* Hata tooltip */}
            {isError && errorMessage && (
                <div
                    style={{
                        position: 'absolute',
                        left: 'calc(100% + 8px)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(18,18,20,0.88)',
                        color: '#fca5a5',
                        fontSize: 11,
                        padding: '4px 8px',
                        borderRadius: 5,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        zIndex: 10,
                    }}
                >
                    {errorMessage}
                </div>
            )}
        </div>
    )
}

export default GeolocationButton
