import { useCoordinateDisplay } from '../hooks/useCoordinateDisplay'

interface CoordinateDisplayProps {
    /** Sidebar durumuna göre AppLayout'tan gelen dinamik left değeri */
    leftPosition: string
    /** Mobilde sidebar açıkken true — kartı gizler */
    hidden?: boolean
}

/**
 * CoordinateDisplay
 *
 * Harita üzerinde mouse gezindikçe anlık koordinatları sol-alt köşede gösterir.
 * Mantığı useCoordinateDisplay hook'unda yaşar; bu bileşen yalnızca UI'dır.
 *
 * AppLayout'ta fixed pozisyonlu olarak render edilir.
 * Sidebar açıldığında leftPosition prop'u güncellenerek sidebar'ın altına
 * girmesi önlenir.
 */
export function CoordinateDisplay({ leftPosition, hidden = false }: CoordinateDisplayProps) {
    const { coords, isVisible } = useCoordinateDisplay()

    if (!coords || hidden) return null

    return (
        <div
            id="coordinate-display"
            style={{
                position: 'fixed',
                bottom: '0.75rem',
                left: leftPosition,
                zIndex: 1400,
                pointerEvents: 'none',
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.18s ease, left 0.3s ease',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#1c1c1e',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '7px',
                    padding: '5px 11px',
                    color: '#e2e8f0',
                    fontFamily: '"SF Mono", "Fira Mono", "Cascadia Code", monospace',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    letterSpacing: '0.025em',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                }}
            >
                {/* Pulsing kırmızı nokta */}
                <span
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#ef4444',
                        flexShrink: 0,
                        boxShadow: '0 0 6px #ef4444aa',
                        animation: 'coordPulse 1.6s ease-in-out infinite',
                    }}
                />
                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                    {coords.lat.toFixed(5)},&nbsp;{coords.lng.toFixed(5)}
                </span>
            </div>

            <style>{`
        @keyframes coordPulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
        </div>
    )
}

export default CoordinateDisplay
