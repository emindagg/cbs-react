import { useState } from 'react'

import { useGeolocation } from '../hooks/useGeolocation'

/** Apple Maps / Lucide tarzı outline navigation arrow */
function NavArrowSVG({ style }: { style?: React.CSSProperties }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            width="15"
            height="15"
            style={style}
        >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
    )
}

/**
 * GeolocationButton
 *
 * - idle    → gri outline ok
 * - loading → dönen daire
 * - success → yeşil outline ok + yeşil ring
 * - error (izin reddedildi) → çapraz ok + rehber panel
 * - error (diğer) → kırmızı ok + kırmızı ring + tooltip
 */
export function GeolocationButton() {
    const { status, errorMessage, isPermissionDenied, locate } = useGeolocation()
    const [showGuide, setShowGuide] = useState(false)

    const isLoading = status === 'loading'
    const isSuccess = status === 'success'
    const isError = status === 'error'

    const buttonColor = isSuccess
        ? 'text-emerald-400'
        : (isError && !isPermissionDenied)
            ? 'text-red-400'
            : 'text-[#8e8e93] hover:text-white active:text-white'

    const handleClick = () => {
        if (isPermissionDenied) {
            setShowGuide(prev => !prev)
            locate()
        } else {
            setShowGuide(false)
            locate()
        }
    }

    return (
        <div className="relative">
            <button
                id="geolocation-button"
                type="button"
                onClick={handleClick}
                disabled={isLoading}
                aria-label="Konumuma git"
                title={
                    isLoading ? 'Konum aranıyor…'
                        : isPermissionDenied ? 'Konum izni engellendi'
                            : isError ? (errorMessage ?? 'Konum hatası')
                                : 'Konumuma git'
                }
                className={[
                    'w-9 h-9 bg-[#1c1c1e] rounded-[12px]',
                    'shadow-[0_2px_8px_rgba(34,34,34,0.35)]',
                    'border-none flex items-center justify-center',
                    'text-sm transition-colors cursor-pointer',
                    buttonColor,
                    isLoading ? 'opacity-70 cursor-not-allowed' : '',
                ].join(' ')}
            >
                {isPermissionDenied ? (
                    <span className="relative inline-flex items-center justify-center w-[14px] h-[14px]">
                        <NavArrowSVG style={{ opacity: 0.45 }} />
                        <i
                            className="fa-solid fa-slash absolute"
                            style={{
                                fontSize: '1.05em',
                                color: '#8e8e93',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    </span>
                ) : isLoading ? (
                    <i className="fa-solid fa-circle-notch animate-spin" />
                ) : (
                    <NavArrowSVG />
                )}
            </button>

            {/* Diğer hata tooltip */}
            {isError && !isPermissionDenied && errorMessage && (
                <div style={{
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
                }}>
                    {errorMessage}
                </div>
            )}

            {/* İzin reddedildi rehber paneli */}
            {isPermissionDenied && showGuide && (
                <div style={{
                    position: 'absolute',
                    left: 'calc(100% + 10px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#1c1c1e',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    width: 230,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                    zIndex: 1600,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowGuide(false) }}
                        style={{
                            position: 'absolute', top: 8, right: 8,
                            background: 'none', border: 'none',
                            color: '#475569', cursor: 'pointer', fontSize: 12,
                            lineHeight: 1, padding: '2px 4px',
                        }}
                    >
                        <i className="fa-solid fa-times" />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                        <i className="fa-solid fa-lock" style={{ color: '#f59e0b', fontSize: 12 }} />
                        <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 12 }}>
                            Konum İzni Gerekli
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <Step n={1} text="Adres çubuğundaki kilit 🔒 ikonuna tıklayın" />
                        <Step n={2} text="«Konum» iznini «İzin Ver» olarak değiştirin" />
                        <Step n={3} text="Sayfayı yenileyin, ardından tekrar deneyin" />
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); locate() }}
                        style={{
                            marginTop: 12,
                            width: '100%',
                            padding: '6px 0',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            borderRadius: 6,
                            color: '#94a3b8',
                            fontSize: 11,
                            fontWeight: 500,
                            cursor: 'pointer',
                            letterSpacing: '0.02em',
                        }}
                    >
                        Tekrar Dene
                    </button>
                </div>
            )}
        </div>
    )
}

function Step({ n, text }: { n: number; text: string }) {
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{
                width: 16, height: 16, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                color: '#64748b', fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
            }}>
                {n}
            </span>
            <span style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.5 }}>{text}</span>
        </div>
    )
}

export default GeolocationButton
