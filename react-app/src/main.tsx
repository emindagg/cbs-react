import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'

async function clearDevStorage() {
  localStorage.clear()
  sessionStorage.clear()

  if ('caches' in window) {
    try {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((key) => caches.delete(key)))
    } catch (error) {
      console.warn('Cache Storage temizlenemedi:', error)
    }
  }

  if ('indexedDB' in window && 'databases' in indexedDB) {
    try {
      const databases = await indexedDB.databases()
      await Promise.all(
        databases
          .map((database) => database.name)
          .filter((name): name is string => Boolean(name))
          .map((name) => new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase(name)
            request.onsuccess = () => resolve()
            request.onerror = () => resolve()
            request.onblocked = () => resolve()
          })),
      )
    } catch (error) {
      console.warn('IndexedDB temizlenemedi:', error)
    }
  }
}

if (import.meta.env.DEV) {
  void clearDevStorage()
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element (#root) not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
