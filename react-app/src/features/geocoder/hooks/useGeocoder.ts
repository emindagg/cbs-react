import { useState, useEffect, useRef, useCallback } from 'react'

export interface GeocoderState {
    isOpen: boolean
    query: string
    setQuery: (query: string) => void
    open: () => void
    close: () => void
    inputRef: React.RefObject<HTMLInputElement | null>
}

/**
 * useGeocoder Hook
 * Manages geocoder/search box state with ESC key handling
 */
export function useGeocoder(): GeocoderState {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                close()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    // Auto-focus on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    const open = useCallback(() => {
        setIsOpen(true)
    }, [])

    const close = useCallback(() => {
        setIsOpen(false)
        setQuery('') // Clear on close (legacy behavior)
    }, [])

    return {
        isOpen,
        query,
        setQuery,
        open,
        close,
        inputRef
    }
}
