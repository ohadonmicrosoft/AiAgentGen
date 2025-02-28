import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import { MemoryCache } from '../lib/cache';

describe('MemoryCache', () => {
  let cache: MemoryCache<any>;

  beforeEach(() => {
    // Create a new cache instance before each test
    cache = new MemoryCache({
      defaultTTL: 1000, // 1 second
      maxSize: 100,
      cleanupInterval: 500, // 0.5 seconds
      useLRU: true,
    });
  });

  afterEach(() => {
    // Clear the cache after each test
    cache.clear();
  });

  test('should set and get values correctly', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    cache.set('key2', { name: 'test' });
    expect(cache.get('key2')).toEqual({ name: 'test' });
  });

  test('should return undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  test('should check if a key exists', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('nonexistent')).toBe(false);
  });

  test('should delete a value', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    cache.delete('key1');

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.has('key1')).toBe(false);
  });

  test('should clear all values', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.clear();

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.getStats().size).toBe(0);
  });

  test('should delete values matching a pattern', () => {
    cache.set('user:1', 'user 1 data');
    cache.set('user:2', 'user 2 data');
    cache.set('post:1', 'post 1 data');

    // Delete all keys starting with 'user:'
    const count = cache.deletePattern(/^user:/);

    expect(count).toBe(2);
    expect(cache.get('user:1')).toBeUndefined();
    expect(cache.get('user:2')).toBeUndefined();
    expect(cache.get('post:1')).toBeDefined();
  });

  test('should respect TTL and expire items', async () => {
    // Set a key with a short TTL
    cache.set('shortLived', 'value', 100); // 100ms TTL

    // Verify it exists immediately
    expect(cache.get('shortLived')).toBe('value');

    // Wait for the TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Verify it's gone
    expect(cache.get('shortLived')).toBeUndefined();
  });

  test('should enforce max size limit', () => {
    // Create a small cache with max size of 3
    const smallCache = new MemoryCache({
      maxSize: 3,
      useLRU: true,
    });

    // Add 3 items (reaches max size)
    smallCache.set('key1', 'value1');
    smallCache.set('key2', 'value2');
    smallCache.set('key3', 'value3');

    expect(smallCache.getStats().size).toBe(3);

    // Access key2 to make it most recently used
    smallCache.get('key2');

    // Add a 4th item (should evict the least recently used item, which is key1)
    smallCache.set('key4', 'value4');

    expect(smallCache.getStats().size).toBe(3);

    // key1 should be evicted
    expect(smallCache.get('key1')).toBeUndefined();

    // The other keys should still be there
    expect(smallCache.get('key2')).toBe('value2');
    expect(smallCache.get('key3')).toBe('value3');
    expect(smallCache.get('key4')).toBe('value4');
  });
});
