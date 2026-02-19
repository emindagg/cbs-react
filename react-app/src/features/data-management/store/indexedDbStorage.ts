import type { StateStorage } from 'zustand/middleware'

const DB_NAME = 'cbs-react-db'
const STORE_NAME = 'zustand'

let dbPromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

async function readFromIndexedDb(name: string): Promise<string | null> {
  const db = await openDatabase()
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(name)

    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function writeToIndexedDb(name: string, value: string): Promise<void> {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(value, name)

    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function removeFromIndexedDb(name: string): Promise<void> {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(name)

    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

const isBrowser = typeof window !== 'undefined'

export const indexedDbStorage: StateStorage = {
  getItem: async (name) => {
    if (!isBrowser) return null
    try {
      return await readFromIndexedDb(name)
    } catch {
      return window.localStorage.getItem(name)
    }
  },
  setItem: async (name, value) => {
    if (!isBrowser) return
    try {
      await writeToIndexedDb(name, value)
    } catch {
      window.localStorage.setItem(name, value)
    }
  },
  removeItem: async (name) => {
    if (!isBrowser) return
    try {
      await removeFromIndexedDb(name)
    } catch {
      window.localStorage.removeItem(name)
    }
  },
}
