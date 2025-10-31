/**
 * Avatar image caching using IndexedDB for offline storage
 */

const DB_NAME = 'CastinglyAvatarCache'
const DB_VERSION = 1
const STORE_NAME = 'avatars'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface CachedAvatar {
  id: string
  blob: Blob
  url: string
  timestamp: number
  originalUrl: string
  variant?: 'thumbnail' | 'medium' | 'full'
}

class AvatarCache {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async cacheAvatar(userId: string, imageUrl: string, variant: 'thumbnail' | 'medium' | 'full' = 'full'): Promise<string | null> {
    if (!this.db) await this.init()
    
    try {
      const cacheKey = `${userId}_${variant}`
      
      // Check if already cached and fresh
      const cached = await this.getCachedAvatar(userId, variant)
      if (cached && cached.originalUrl === imageUrl) {
        // cache hit
        return cached.url
      }

      // Skip cross-origin images to avoid CORS errors
      try {
        const u = new URL(imageUrl, window.location.origin)
        if (u.origin !== window.location.origin) {
          return null
        }
      } catch {}
      
      // Fetch the image
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error('Failed to fetch avatar')
      
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      
      // Store in IndexedDB
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const avatarData: CachedAvatar = {
        id: cacheKey,
        blob,
        url: objectUrl,
        timestamp: Date.now(),
        originalUrl: imageUrl,
        variant
      }
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(avatarData)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
      
      // cached
      return objectUrl
      
    } catch (error) {
      // suppress noisy failures in prod; return null gracefully
      return null
    }
  }

  async cacheAvatarFromBlob(userId: string, blob: Blob, originalUrl: string, variant: 'thumbnail' | 'medium' | 'full' = 'full'): Promise<string | null> {
    if (!this.db) await this.init()
    
    try {
      const cacheKey = `${userId}_${variant}`
      const objectUrl = URL.createObjectURL(blob)
      
      // Store in IndexedDB
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const avatarData: CachedAvatar = {
        id: cacheKey,
        blob,
        url: objectUrl,
        timestamp: Date.now(),
        originalUrl,
        variant
      }
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(avatarData)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
      
      console.log(`Avatar cached from blob (${variant}):`, objectUrl.substring(0, 60) + '...')
      return objectUrl
      
    } catch (error) {
      console.error('Failed to cache avatar from blob:', error)
      return null
    }
  }

  async getCachedAvatar(userId: string, variant: 'thumbnail' | 'medium' | 'full' = 'full'): Promise<CachedAvatar | null> {
    if (!this.db) await this.init()
    
    const cacheKey = `${userId}_${variant}`
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(cacheKey)
      
      request.onsuccess = () => {
        const result = request.result
        if (!result) {
          resolve(null)
          return
        }
        
        // Check if cache is still fresh
        const age = Date.now() - result.timestamp
        if (age > CACHE_DURATION) {
          console.log(`Avatar cache expired for user (${variant}):`, userId)
          this.removeCachedAvatar(userId, variant) // Clean up expired cache
          resolve(null)
          return
        }
        
        // Recreate object URL from blob
        const objectUrl = URL.createObjectURL(result.blob)
        resolve({
          ...result,
          url: objectUrl
        })
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async removeCachedAvatar(userId: string, variant?: 'thumbnail' | 'medium' | 'full'): Promise<void> {
    if (!this.db) await this.init()
    
    if (variant) {
      // Remove specific variant
      const cacheKey = `${userId}_${variant}`
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(cacheKey)
        
        request.onsuccess = () => {
          console.log(`Removed cached avatar (${variant}) for user:`, userId)
          resolve()
        }
        request.onerror = () => reject(request.error)
      })
    } else {
      // Remove all variants for this user
      const variants = ['thumbnail', 'medium', 'full'] as const
      const promises = variants.map(v => this.removeCachedAvatar(userId, v))
      await Promise.allSettled(promises)
      console.log('Removed all cached avatars for user:', userId)
    }
  }

  async clearCache(): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()
      
      request.onsuccess = () => {
        console.log('Avatar cache cleared')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getCacheSize(): Promise<number> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.count()
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// Export singleton instance
export const avatarCache = new AvatarCache()

// Utility hook for React components
export function useAvatarCache() {
  return {
    cacheAvatar: avatarCache.cacheAvatar.bind(avatarCache),
    cacheAvatarFromBlob: avatarCache.cacheAvatarFromBlob.bind(avatarCache),
    getCachedAvatar: avatarCache.getCachedAvatar.bind(avatarCache),
    removeCachedAvatar: avatarCache.removeCachedAvatar.bind(avatarCache),
    clearCache: avatarCache.clearCache.bind(avatarCache),
    getCacheSize: avatarCache.getCacheSize.bind(avatarCache)
  }
}
