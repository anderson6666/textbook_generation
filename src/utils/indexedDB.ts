// IndexedDB 存储工具

const DB_NAME = 'textbook_editor'
const DB_VERSION = 1
const STORE_NAME = 'workflow_data'

let dbInstance: IDBDatabase | null = null

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

export const indexedDBStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put({ key, value, timestamp: Date.now() })
        
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to save to IndexedDB'))
      })
    } catch (error) {
      console.error('IndexedDB setItem error:', error)
      throw error
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(key)
        
        request.onsuccess = () => {
          resolve(request.result?.value ?? null)
        }
        request.onerror = () => reject(new Error('Failed to get from IndexedDB'))
      })
    } catch (error) {
      console.error('IndexedDB getItem error:', error)
      return null
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(key)
        
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to delete from IndexedDB'))
      })
    } catch (error) {
      console.error('IndexedDB removeItem error:', error)
    }
  },

  async clear(): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()
        
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Failed to clear IndexedDB'))
      })
    } catch (error) {
      console.error('IndexedDB clear error:', error)
    }
  }
}
