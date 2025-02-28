import { logger } from '../api/logs';

/**
 * Cache entry with value and expiration
 */
interface CacheEntry<T> {
  value: T;
  expires: number;
  key: string;
  size: number;
  lastAccessed: number;
}

/**
 * Cache options for configuration
 */
interface CacheOptions {
  /** Default time-to-live in milliseconds */
  defaultTTL?: number;
  /** Maximum number of items to store in cache */
  maxSize?: number;
  /** Maximum memory size in bytes (approximate) */
  maxMemorySize?: number;
  /** How often to run cleanup in milliseconds */
  cleanupInterval?: number;
  /** Whether to use LRU eviction (vs. TTL-based) */
  useLRU?: boolean;
}

/**
 * Enhanced in-memory cache with TTL support, LRU eviction, and memory limits
 */
export class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;
  private maxSize: number;
  private maxMemorySize: number;
  private currentMemorySize: number = 0;
  private cleanupInterval: number;
  private useLRU: boolean;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  /**
   * Create a new memory cache
   * @param options Cache configuration options
   */
  constructor(options: CacheOptions = {}) {
    const {
      defaultTTL = 60000,
      maxSize = 1000,
      maxMemorySize = 50 * 1024 * 1024, // 50MB default
      cleanupInterval = defaultTTL / 2,
      useLRU = true,
    } = options;

    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
    this.maxMemorySize = maxMemorySize;
    this.cleanupInterval = cleanupInterval;
    this.useLRU = useLRU;

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Start the cleanup timer
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval);

    // Ensure the timer doesn't prevent the process from exiting
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Stop the cleanup timer
   */
  public stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Estimate the size of a value in bytes
   * @param value The value to measure
   * @returns Approximate size in bytes
   */
  private estimateSize(value: any): number {
    try {
      // For strings, use the length as an approximation
      if (typeof value === 'string') {
        return value.length * 2; // UTF-16 characters are 2 bytes
      }

      // For objects, use JSON stringification as an approximation
      const json = JSON.stringify(value);
      return json.length * 2; // UTF-16 characters are 2 bytes
    } catch (e) {
      // If we can't stringify, use a conservative estimate
      logger.warn(`Failed to estimate size for cache value: ${e}`);
      return 1024; // 1KB default
    }
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time-to-live in milliseconds (optional, uses default if not provided)
   */
  set(key: string, value: T, ttl?: number): void {
    try {
      // Don't cache null or undefined values
      if (value === null || value === undefined) {
        return;
      }

      // Check if key already exists and update memory size
      if (this.cache.has(key)) {
        const oldEntry = this.cache.get(key)!;
        this.currentMemorySize -= oldEntry.size;
      }

      // Estimate the size of the new value
      const size = this.estimateSize(value);

      // Enforce cache size limit
      if (
        this.cache.size >= this.maxSize ||
        this.currentMemorySize + size > this.maxMemorySize
      ) {
        this.evictEntries(size);
      }

      const expires = Date.now() + (ttl || this.defaultTTL);
      const entry: CacheEntry<T> = {
        value,
        expires,
        key,
        size,
        lastAccessed: Date.now(),
      };

      this.cache.set(key, entry);
      this.currentMemorySize += size;

      logger.debug(
        `Cache set: ${key}, size: ${size} bytes, expires: ${new Date(expires).toISOString()}`,
      );
    } catch (error) {
      logger.error(`Error setting cache key ${key}: ${error}`);
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value, or undefined if not found or expired
   */
  get(key: string): T | undefined {
    try {
      const entry = this.cache.get(key);

      // Return undefined if not in cache or expired
      if (!entry || entry.expires < Date.now()) {
        if (entry) {
          // Delete expired entry
          this.delete(key);
          logger.debug(`Cache miss (expired): ${key}`);
        } else {
          logger.debug(`Cache miss (not found): ${key}`);
        }

        this.misses++;
        return undefined;
      }

      // Update last accessed time for LRU
      if (this.useLRU) {
        entry.lastAccessed = Date.now();
      }

      this.hits++;
      logger.debug(`Cache hit: ${key}`);
      return entry.value;
    } catch (error) {
      logger.error(`Error getting cache key ${key}: ${error}`);
      return undefined;
    }
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return !!entry && entry.expires > Date.now();
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    try {
      const entry = this.cache.get(key);
      if (entry) {
        this.currentMemorySize -= entry.size;
        this.cache.delete(key);
        logger.debug(`Cache delete: ${key}`);
      }
    } catch (error) {
      logger.error(`Error deleting cache key ${key}: ${error}`);
    }
  }

  /**
   * Delete all values from the cache
   */
  clear(): void {
    try {
      this.cache.clear();
      this.currentMemorySize = 0;
      this.hits = 0;
      this.misses = 0;
      this.evictions = 0;
      logger.debug('Cache cleared');
    } catch (error) {
      logger.error(`Error clearing cache: ${error}`);
    }
  }

  /**
   * Delete all values with keys matching a pattern
   * @param pattern Regular expression pattern to match keys
   * @returns Number of keys deleted
   */
  deletePattern(pattern: RegExp): number {
    try {
      let count = 0;
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.delete(key);
          count++;
        }
      }

      logger.debug(`Cache deleted ${count} keys matching pattern: ${pattern}`);
      return count;
    } catch (error) {
      logger.error(`Error deleting cache keys by pattern: ${error}`);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    memorySize: number;
    maxSize: number;
    maxMemorySize: number;
    hits: number;
    misses: number;
    evictions: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      size: this.cache.size,
      memorySize: this.currentMemorySize,
      maxSize: this.maxSize,
      maxMemorySize: this.maxMemorySize,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    try {
      const now = Date.now();
      let expiredCount = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expires <= now) {
          this.currentMemorySize -= entry.size;
          this.cache.delete(key);
          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        logger.debug(`Cache cleanup removed ${expiredCount} expired entries`);
      }
    } catch (error) {
      logger.error(`Error during cache cleanup: ${error}`);
    }
  }

  /**
   * Evict entries to make room for new entries
   * @param sizeNeeded Size needed for the new entry
   */
  private evictEntries(sizeNeeded: number): void {
    try {
      // If using LRU, evict least recently used entries
      if (this.useLRU) {
        this.evictLRU(sizeNeeded);
      } else {
        // Otherwise, evict entries closest to expiration
        this.evictOldest();
      }
    } catch (error) {
      logger.error(`Error evicting cache entries: ${error}`);
    }
  }

  /**
   * Evict the least recently used entries
   * @param sizeNeeded Size needed for the new entry
   */
  private evictLRU(sizeNeeded: number): void {
    // Sort entries by last accessed time
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => entry)
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    let freedSize = 0;
    let evictedCount = 0;

    // Evict entries until we have enough space
    for (const entry of entries) {
      if (
        this.cache.size <= this.maxSize * 0.9 &&
        this.currentMemorySize + sizeNeeded - freedSize <=
          this.maxMemorySize * 0.9
      ) {
        break;
      }

      this.cache.delete(entry.key);
      freedSize += entry.size;
      this.currentMemorySize -= entry.size;
      evictedCount++;
      this.evictions++;
    }

    if (evictedCount > 0) {
      logger.debug(
        `Cache evicted ${evictedCount} LRU entries, freed ${freedSize} bytes`,
      );
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
      const entry = this.cache.get(oldestKey)!;
      this.currentMemorySize -= entry.size;
      this.cache.delete(oldestKey);
      this.evictions++;
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
  ttl?: number,
): Promise<T> {
  try {
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
  } catch (error) {
    logger.error(`Error in getOrCompute for key ${key}: ${error}`);
    throw error;
  }
}

/**
 * Create a memoized version of a function using the cache
 * @param fn Function to memoize
 * @param keyFn Function to generate cache key from arguments
 * @param cache Cache instance to use
 * @param ttl Optional TTL for cached results
 * @returns Memoized function
 */
export function memoize<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  keyFn: (...args: Args) => string,
  cache: MemoryCache<T>,
  ttl?: number,
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    const key = keyFn(...args);
    return getOrCompute(cache, key, () => fn(...args), ttl);
  };
}

// Export singleton cache instances for different data types
export const userCache = new MemoryCache<any>({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  useLRU: true,
});

export const agentCache = new MemoryCache<any>({
  defaultTTL: 2 * 60 * 1000, // 2 minutes
  maxSize: 500,
  useLRU: true,
});

export const promptCache = new MemoryCache<any>({
  defaultTTL: 3 * 60 * 1000, // 3 minutes
  maxSize: 200,
  useLRU: true,
});

export const conversationCache = new MemoryCache<any>({
  defaultTTL: 1 * 60 * 1000, // 1 minute
  maxSize: 100,
  useLRU: true,
});

// Cache for static assets and other rarely changing data
export const staticCache = new MemoryCache<any>({
  defaultTTL: 60 * 60 * 1000, // 1 hour
  maxSize: 200,
  useLRU: false, // TTL-based eviction for static content
});
