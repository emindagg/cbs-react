import { useState, useEffect } from 'react'

/**
 * useMediaQuery Hook
 * Responds to CSS media query changes
 * 
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns boolean - Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia(query).matches
    })

    useEffect(() => {
        if (typeof window === 'undefined') return

        const mediaQuery = window.matchMedia(query)
        setMatches(mediaQuery.matches)

        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches)
        }

        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [query])

    return matches
}
