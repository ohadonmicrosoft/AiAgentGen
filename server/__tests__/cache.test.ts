import { MemoryCache, getOrCompute, memoize } from '../lib/cache';

// Mock the logger
jest.mock('../lib/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

// Helper to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('MemoryCache', () => {
  // Reset timers between tests
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const cache = new MemoryCache();
      expect(cache).toBeDefined();
      expect(cache.getStats().size).toBe(0);
    });

    it('should initialize with custom options', () => {
      const cache = new MemoryCache({
        defaultTTL: 5000,
        maxSize: 50,
        maxMemorySize: 1024 * 1024, // 1MB
        cleanupInterval: 10000,
        useLRU: true,
      });
      
      expect(cache).toBeDefined();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('basic operations', () => {
    let cache: MemoryCache<any>;

    beforeEach(() => {
      cache = new MemoryCache();
    });

    it('should set and get a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if a key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      cache.delete('key1');
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.getStats().size).toBe(0);
    });

    it('should delete values matching a pattern', () => {
      cache.set('user:1', { id: 1, name: 'John' });
      cache.set('user:2', { id: 2, name: 'Jane' });
      cache.set('post:1', { id: 1, title: 'Hello' });
      
      const count = cache.deletePattern(/^user:/);
      
      expect(count).toBe(2);
      expect(cache.get('user:1')).toBeUndefined();
      expect(cache.get('user:2')).toBeUndefined();
      expect(cache.get('post:1')).toBeDefined();
    });
  });

  describe('expiration', () => {
    let cache: MemoryCache<any>;

    beforeEach(() => {
      cache = new MemoryCache({ defaultTTL: 1000 });
    });

    it('should expire items after TTL', () => {
      cache.set('key1', 'value1');
      
      // Fast-forward time by 1100ms
      jest.advanceTimersByTime(1100);
      
      // Item should be expired
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should use custom TTL when provided', () => {
      cache.set('key1', 'value1', 2000); // 2 seconds TTL
      cache.set('key2', 'value2', 500);  // 0.5 seconds TTL
      
      // Fast-forward time by 600ms
      jest.advanceTimersByTime(600);
      
      // key2 should be expired, but key1 should still be valid
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      
      // Fast-forward another 1500ms
      jest.advanceTimersByTime(1500);
      
      // Both should be expired now
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should run cleanup periodically', () => {
      cache.set('key1', 'value1', 500);
      
      // Fast-forward time beyond the cleanupInterval
      jest.advanceTimersByTime(30000);
      
      // The cleanup should have run and removed expired items
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('size limits', () => {
    it('should respect the maximum number of items', () => {
      const cache = new MemoryCache({ maxSize: 2, useLRU: false });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // This should trigger eviction
      
      // Since we're not using LRU, it should evict based on expiration
      expect(cache.getStats().size).toBe(2);
      expect(cache.getStats().evictions).toBe(1);
    });

    it('should respect the maximum memory size', () => {
      // Create a cache with a small memory limit
      const cache = new MemoryCache({ 
        maxMemorySize: 200, // 200 bytes
        useLRU: true 
      });
      
      // Add an item with a large size
      cache.set('key1', 'a'.repeat(150)); // ~150 bytes
      cache.set('key2', 'b'.repeat(100)); // ~100 bytes, should trigger eviction
      
      // Check that the oldest item was evicted
      expect(cache.getStats().size).toBe(1);
      expect(cache.getStats().evictions).toBe(1);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used items first', () => {
      const cache = new MemoryCache({ 
        maxSize: 2,
        useLRU: true
      });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add a new item that triggers eviction
      cache.set('key3', 'value3');
      
      // key2 should be evicted as it's the least recently used
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
    });
  });

  describe('stats', () => {
    it('should track hit and miss statistics', () => {
      const cache = new MemoryCache();
      
      cache.set('key1', 'value1');
      
      // Hit
      cache.get('key1');
      // Miss
      cache.get('nonexistent');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });
});

describe('getOrCompute', () => {
  it('should return cached value if available', async () => {
    const cache = new MemoryCache<string>();
    cache.set('key1', 'cached-value');
    
    const computeFn = jest.fn().mockResolvedValue('computed-value');
    
    const result = await getOrCompute(cache, 'key1', computeFn);
    
    expect(result).toBe('cached-value');
    expect(computeFn).not.toHaveBeenCalled();
  });
  
  it('should compute and cache value if not cached', async () => {
    const cache = new MemoryCache<string>();
    
    const computeFn = jest.fn().mockResolvedValue('computed-value');
    
    const result = await getOrCompute(cache, 'key1', computeFn);
    
    expect(result).toBe('computed-value');
    expect(computeFn).toHaveBeenCalledTimes(1);
    expect(cache.get('key1')).toBe('computed-value');
  });
  
  it('should respect TTL when caching computed value', async () => {
    const cache = new MemoryCache<string>();
    
    const computeFn = jest.fn().mockResolvedValue('computed-value');
    
    await getOrCompute(cache, 'key1', computeFn, 500);
    
    // Advance time by 600ms
    jest.advanceTimersByTime(600);
    
    // Cached value should have expired
    expect(cache.get('key1')).toBeUndefined();
  });
  
  it('should propagate errors from compute function', async () => {
    const cache = new MemoryCache<string>();
    
    const error = new Error('Compute failed');
    const computeFn = jest.fn().mockRejectedValue(error);
    
    await expect(getOrCompute(cache, 'key1', computeFn)).rejects.toThrow(error);
  });
});

describe('memoize', () => {
  it('should memoize function results', async () => {
    const cache = new MemoryCache<string>();
    
    const fn = jest.fn().mockImplementation(
      (a: number, b: string) => Promise.resolve(`${a}-${b}`)
    );
    
    const keyFn = (a: number, b: string) => `key:${a}:${b}`;
    
    const memoizedFn = memoize(fn, keyFn, cache);
    
    // First call should compute
    const result1 = await memoizedFn(1, 'test');
    expect(result1).toBe('1-test');
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Second call with same args should use cache
    const result2 = await memoizedFn(1, 'test');
    expect(result2).toBe('1-test');
    expect(fn).toHaveBeenCalledTimes(1); // Still 1
    
    // Call with different args should compute
    const result3 = await memoizedFn(2, 'test');
    expect(result3).toBe('2-test');
    expect(fn).toHaveBeenCalledTimes(2);
  });
  
  it('should respect TTL for memoized results', async () => {
    const cache = new MemoryCache<string>();
    
    const fn = jest.fn().mockImplementation(
      (a: number, b: string) => Promise.resolve(`${a}-${b}`)
    );
    
    const keyFn = (a: number, b: string) => `key:${a}:${b}`;
    
    const memoizedFn = memoize(fn, keyFn, cache, 500);
    
    // First call
    await memoizedFn(1, 'test');
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Advance time by 600ms
    jest.advanceTimersByTime(600);
    
    // Call again with same args, should compute again
    await memoizedFn(1, 'test');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('singleton caches', () => {
  it('should export singleton cache instances', () => {
    // Import the singleton caches to test that they're properly exported
    const { 
      userCache, 
      agentCache, 
      promptCache, 
      conversationCache, 
      staticCache 
    } = require('../lib/cache');
    
    // Verify each cache is an instance of MemoryCache
    expect(userCache).toBeInstanceOf(MemoryCache);
    expect(agentCache).toBeInstanceOf(MemoryCache);
    expect(promptCache).toBeInstanceOf(MemoryCache);
    expect(conversationCache).toBeInstanceOf(MemoryCache);
    expect(staticCache).toBeInstanceOf(MemoryCache);
  });
}); 