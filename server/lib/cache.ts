import { logger } from '../api/logs';

/**
 * Simple in-memory cache with TTL support
 */
export class MemoryCache<T = any> {
  private cache: Map<string, { value: T; expires: number }> = new Map();
  private defaultTTL: number;
  private maxSize: number;
  
  /**
   * @param defaultTTL Default time-to-live in milliseconds
   * @param maxSize Maximum number of items to store in cache
   */
  constructor(defaultTTL = 60000, maxSize = 1000) {
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
    
    // Start periodic cleanup
    setInterval(() => this.cleanup(), defaultTTL / 2);
  }
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time-to-live in milliseconds (optional, uses default if not provided)
   */
  set(key: string, value: T, ttl?: number): void {
    // Enforce cache size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expires });
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value, or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    // Return undefined if not in cache or expired
    if (!entry || entry.expires < Date.now()) {
      if (entry) {
        // Delete expired entry
        this.cache.delete(key);
      }
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Check if a key exists and is not expired
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    // Return false if not in cache or expired
    if (!entry || entry.expires < Date.now()) {
      if (entry) {
        // Delete expired entry
        this.cache.delete(key);
      }
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get the current cache size
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.debug(`Cache cleanup removed ${expiredCount} expired entries`);
    }
  }
  
  /**
   * Evict the oldest entry to make room for new entries
   */
  private evictOldest(): void {
    // Find the key with the earliest expiration time
    let oldestKey: string | undefined;
    let oldestExpires = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < oldestExpires) {
        oldestKey = key;
        oldestExpires = entry.expires;
      }
    }
    
    // Delete the oldest entry
    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Cache evicted oldest entry: ${oldestKey}`);
    }
  }
}

/**
 * Get a value from cache or compute it if not cached
 * @param cache Cache instance
 * @param key Cache key
 * @param fn Function to compute the value if not cached
 * @param ttl Optional TTL for this specific item
 * @returns The cached or computed value
 */
export async function getOrCompute<T>(
  cache: MemoryCache<T>,
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cachedValue = cache.get(key);
  if (cachedValue !== undefined) {
    return cachedValue;
  }
  
  // Compute value
  const value = await fn();
  
  // Cache result
  cache.set(key, value, ttl);
  
  return value;
}

// Export singleton cache instances for different data types
export const userCache = new MemoryCache<any>(5 * 60 * 1000); // 5 minutes
export const agentCache = new MemoryCache<any>(2 * 60 * 1000); // 2 minutes
export const promptCache = new MemoryCache<any>(3 * 60 * 1000); // 3 minutes
export const conversationCache = new MemoryCache<any>(1 * 60 * 1000); // 1 minute 