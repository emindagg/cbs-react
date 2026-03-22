import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { expect, afterEach } from 'vitest'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Mock URL.createObjectURL for maplibre-gl in jsdom
if (typeof window !== 'undefined' && !window.URL.createObjectURL) {
  window.URL.createObjectURL = () => ''
}
if (typeof window !== 'undefined' && !window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = () => {}
}

// Cleanup after each test
afterEach(() => {
  cleanup()
})
