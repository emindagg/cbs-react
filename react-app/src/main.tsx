import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')
const LARGE_MESH_VERTEX_WARNING = 'Max vertices per segment is 65535'

const hasLargeMeshVertexWarning = (args: unknown[]): boolean =>
  args.some((arg) => {
    if (typeof arg === 'string') return arg.includes(LARGE_MESH_VERTEX_WARNING)
    if (arg instanceof Error) return arg.message.includes(LARGE_MESH_VERTEX_WARNING)
    return false
  })

const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  if (hasLargeMeshVertexWarning(args)) return

  originalConsoleError(...args)
}

const originalConsoleWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (hasLargeMeshVertexWarning(args)) return

  originalConsoleWarn(...args)
}

if (!rootElement) {
  throw new Error('Root element (#root) not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
