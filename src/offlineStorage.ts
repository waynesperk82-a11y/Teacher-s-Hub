import AsyncStorage from '@react-native-async-storage/async-storage'

// ==================== TYPES ====================

export interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

export interface CacheConfig {
  ttl: number // Default TTL in milliseconds
  maxItems?: number // Maximum items to store per cache
  enabled: boolean
}

export type CacheKey = 
  | 'programmes'
  | 'teachers'
  | 'lessons'
  | 'messages'
  | 'attendance'
  | 'analytics'
  | 'users'
  | 'permissions'

// ==================== CONSTANTS ====================

const CACHE_PREFIX = '@school_cache_'
const CACHE_METADATA_KEY = '@school_cache_metadata'

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
const LONG_TTL = 30 * 60 * 1000 // 30 minutes
const SHORT_TTL = 60 * 1000 // 1 minute

export const CACHE_KEYS: Record<CacheKey, string> = {
  programmes: `${CACHE_PREFIX}programmes`,
  teachers: `${CACHE_PREFIX}teachers`,
  lessons: `${CACHE_PREFIX}lessons`,
  messages: `${CACHE_PREFIX}messages`,
  attendance: `${CACHE_PREFIX}attendance`,
  analytics: `${CACHE_PREFIX}analytics`,
  users: `${CACHE_PREFIX}users`,
  permissions: `${CACHE_PREFIX}permissions`,
}

export const CACHE_TTL: Record<CacheKey, number> = {
  programmes: LONG_TTL,
  teachers: LONG_TTL,
  lessons: SHORT_TTL,
  messages: SHORT_TTL,
  attendance: SHORT_TTL,
  analytics: DEFAULT_TTL,
  users: LONG_TTL,
  permissions: DEFAULT_TTL,
}

// ==================== CACHE MANAGER ====================

interface CacheMetadata {
  [key: string]: {
    size: number
    lastUpdated: number
    itemCount: number
  }
}

class OfflineStorageManager {
  private config: CacheConfig = {
    ttl: DEFAULT_TTL,
    enabled: true,
  }

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  // ==================== CORE METHODS ====================

  private getKey(key: CacheKey): string {
    return CACHE_KEYS[key] || `${CACHE_PREFIX}${key}`
  }

  private getTTL(key: CacheKey): number {
    return CACHE_TTL[key] || this.config.ttl
  }

  private isExpired(item: CacheItem): boolean {
    const now = Date.now()
    return now - item.timestamp > item.ttl
  }

  async set<T>(
    key: CacheKey,
    data: T,
    ttl?: number
  ): Promise<void> {
    if (!this.config.enabled) return

    try {
      const cacheKey = this.getKey(key)
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.getTTL(key),
      }
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem))
      await this.updateMetadata(key, data)
    } catch (error) {
      console.error(`Error setting cache for ${key}:`, error)
    }
  }

  async get<T>(key: CacheKey): Promise<T | null> {
    if (!this.config.enabled) return null

    try {
      const cacheKey = this.getKey(key)
      const itemStr = await AsyncStorage.getItem(cacheKey)
      
      if (!itemStr) return null

      const item: CacheItem<T> = JSON.parse(itemStr)
      
      // Check if cache is expired
      if (this.isExpired(item)) {
        await this.remove(key)
        return null
      }

      return item.data
    } catch (error) {
      console.error(`Error getting cache for ${key}:`, error)
      return null
    }
  }

  async remove(key: CacheKey): Promise<void> {
    try {
      const cacheKey = this.getKey(key)
      await AsyncStorage.removeItem(cacheKey)
      await this.removeMetadata(key)
    } catch (error) {
      console.error(`Error removing cache for ${key}:`, error)
    }
  }

  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(CACHE_KEYS)
      await AsyncStorage.multiRemove(keys)
      await AsyncStorage.removeItem(CACHE_METADATA_KEY)
    } catch (error) {
      console.error('Error clearing all caches:', error)
    }
  }

  // ==================== METADATA METHODS ====================

  private async updateMetadata(key: CacheKey, data: any): Promise<void> {
    try {
      const metadataStr = await AsyncStorage.getItem(CACHE_METADATA_KEY)
      const metadata: CacheMetadata = metadataStr ? JSON.parse(metadataStr) : {}
      
      const itemCount = Array.isArray(data) ? data.length : 1
      const size = JSON.stringify(data).length

      metadata[key] = {
        size,
        lastUpdated: Date.now(),
        itemCount,
      }

      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      console.error('Error updating metadata:', error)
    }
  }

  private async removeMetadata(key: CacheKey): Promise<void> {
    try {
      const metadataStr = await AsyncStorage.getItem(CACHE_METADATA_KEY)
      if (metadataStr) {
        const metadata: CacheMetadata = JSON.parse(metadataStr)
        delete metadata[key]
        await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata))
      }
    } catch (error) {
      console.error('Error removing metadata:', error)
    }
  }

  async getMetadata(): Promise<CacheMetadata | null> {
    try {
      const metadataStr = await AsyncStorage.getItem(CACHE_METADATA_KEY)
      return metadataStr ? JSON.parse(metadataStr) : null
    } catch (error) {
      console.error('Error getting metadata:', error)
      return null
    }
  }

  // ==================== BATCH OPERATIONS ====================

  async setBatch(items: Array<{ key: CacheKey; data: any; ttl?: number }>): Promise<void> {
    if (!this.config.enabled) return

    try {
      await Promise.all(
        items.map(({ key, data, ttl }) => this.set(key, data, ttl))
      )
    } catch (error) {
      console.error('Error setting batch cache:', error)
    }
  }

  async getBatch(keys: CacheKey[]): Promise<Record<CacheKey, any>> {
    if (!this.config.enabled) return {} as Record<CacheKey, any>

    try {
      const results = await Promise.all(
        keys.map(async (key) => {
          const data = await this.get(key)
          return { key, data }
        })
      )

      return results.reduce((acc, { key, data }) => {
        acc[key] = data
        return acc
      }, {} as Record<CacheKey, any>)
    } catch (error) {
      console.error('Error getting batch cache:', error)
      return {} as Record<CacheKey, any>
    }
  }

  // ==================== UTILITY METHODS ====================

  async has(key: CacheKey): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key)
      const itemStr = await AsyncStorage.getItem(cacheKey)
      if (!itemStr) return false

      const item: CacheItem = JSON.parse(itemStr)
      return !this.isExpired(item)
    } catch {
      return false
    }
  }

  async getSize(key: CacheKey): Promise<number> {
    try {
      const cacheKey = this.getKey(key)
      const itemStr = await AsyncStorage.getItem(cacheKey)
      return itemStr ? itemStr.length : 0
    } catch {
      return 0
    }
  }

  async getTotalSize(): Promise<number> {
    try {
      const metadata = await this.getMetadata()
      if (!metadata) return 0
      return Object.values(metadata).reduce((sum, m) => sum + m.size, 0)
    } catch {
      return 0
    }
  }

  async clearExpired(): Promise<void> {
    try {
      const keys = Object.keys(CACHE_KEYS) as CacheKey[]
      for (const key of keys) {
        const item = await this.get(key)
        if (item === null) {
          await this.remove(key)
        }
      }
    } catch (error) {
      console.error('Error clearing expired caches:', error)
    }
  }

  // ==================== CONFIGURATION ====================

  setConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): CacheConfig {
    return { ...this.config }
  }

  enable(): void {
    this.config.enabled = true
  }

  disable(): void {
    this.config.enabled = false
  }

  // ==================== SPECIFIC CACHE METHODS ====================

  // Programmes
  async setProgrammes(data: any): Promise<void> {
    return this.set('programmes', data, CACHE_TTL.programmes)
  }

  async getProgrammes(): Promise<any> {
    return this.get('programmes')
  }

  // Teachers
  async setTeachers(data: any): Promise<void> {
    return this.set('teachers', data, CACHE_TTL.teachers)
  }

  async getTeachers(): Promise<any> {
    return this.get('teachers')
  }

  // Lessons
  async setLessons(data: any): Promise<void> {
    return this.set('lessons', data, CACHE_TTL.lessons)
  }

  async getLessons(): Promise<any> {
    return this.get('lessons')
  }

  // Messages
  async setMessages(data: any): Promise<void> {
    return this.set('messages', data, CACHE_TTL.messages)
  }

  async getMessages(): Promise<any> {
    return this.get('messages')
  }

  // Attendance
  async setAttendance(data: any): Promise<void> {
    return this.set('attendance', data, CACHE_TTL.attendance)
  }

  async getAttendance(): Promise<any> {
    return this.get('attendance')
  }

  // Analytics
  async setAnalytics(data: any): Promise<void> {
    return this.set('analytics', data, CACHE_TTL.analytics)
  }

  async getAnalytics(): Promise<any> {
    return this.get('analytics')
  }

  // Users
  async setUsers(data: any): Promise<void> {
    return this.set('users', data, CACHE_TTL.users)
  }

  async getUsers(): Promise<any> {
    return this.get('users')
  }

  // Permissions
  async setPermissions(data: any): Promise<void> {
    return this.set('permissions', data, CACHE_TTL.permissions)
  }

  async getPermissions(): Promise<any> {
    return this.get('permissions')
  }
}

// ==================== INSTANCE ====================

export const offlineStorage = new OfflineStorageManager()

// ==================== HOOKS ====================

import { useState, useEffect } from 'react'

interface UseCacheOptions<T> {
  key: CacheKey
  fetcher: () => Promise<T>
  ttl?: number
  enabled?: boolean
}

export function useCache<T>({
  key,
  fetcher,
  ttl,
  enabled = true,
}: UseCacheOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled) return

    const loadData = async () => {
      setLoading(true)
      try {
        // Try to get from cache first
        let cached = await offlineStorage.get<T>(key)
        
        if (cached) {
          setData(cached)
        }

        // Always fetch fresh data in background
        const freshData = await fetcher()
        
        // Update cache with fresh data
        await offlineStorage.set(key, freshData, ttl)
        
        // Update state with fresh data
        setData(freshData)
        setError(null)
      } catch (err) {
        setError(err as Error)
        // If we have cached data, keep it
        if (!data) {
          const cached = await offlineStorage.get<T>(key)
          if (cached) {
            setData(cached)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [key, fetcher, ttl, enabled])

  const refresh = async () => {
    try {
      const freshData = await fetcher()
      await offlineStorage.set(key, freshData, ttl)
      setData(freshData)
      setError(null)
    } catch (err) {
      setError(err as Error)
    }
  }

  const clear = async () => {
    await offlineStorage.remove(key)
    setData(null)
  }

  return { data, loading, error, refresh, clear }
}

// ==================== EXPORTS ====================

export default offlineStorage
