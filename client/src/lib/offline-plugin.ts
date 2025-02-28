import { QueryClient } from '@tanstack/react-query';

/**
 * Simple storage interface for the offline cache
 */
interface OfflineStorage {
  getItem: (key: string) => Promise<unknown | null>;
  setItem: (key: string, value: unknown) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * LocalStorage implementation of OfflineStorage
 */
class LocalStorageAdapter implements OfflineStorage {
  private prefix = 'offline-cache:';

  async getItem(key: string): Promise<unknown | null> {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to get item from localStorage:', e);
      return null;
    }
  }

  async setItem(key: string, value: unknown): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save item to localStorage:', e);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (e) {
      console.error('Failed to remove item from localStorage:', e);
    }
  }
}

/**
 * Options for the offline plugin
 */
interface OfflinePluginOptions {
  /**
   * Storage adapter for the cache
   * @default LocalStorageAdapter
   */
  storage?: OfflineStorage;

  /**
   * Default time-to-live for cached queries in milliseconds
   * @default 24 hours
   */
  defaultTTL?: number;

  /**
   * Queries to persist offline (whitelist)
   * If not provided, all queries will be persisted
   */
  persistQueries?: string[] | RegExp[];

  /**
   * Whether to automatically attempt to refetch queries when coming back online
   * @default true
   */
  refetchOnReconnect?: boolean;
}

/**
 * Create a plugin to support offline caching
 * @param options Plugin options
 */
export function offlinePlugin(options: OfflinePluginOptions = {}) {
  const {
    storage = new LocalStorageAdapter(),
    defaultTTL = 24 * 60 * 60 * 1000, // 24 hours
    persistQueries,
    refetchOnReconnect = true,
  } = options;

  return {
    /**
     * Register the plugin with a QueryClient
     * @param client QueryClient instance
     */
    register(client: QueryClient): void {
      // Initialize from storage on startup
      this.restoreFromStorage(client);

      // Add listeners for online/offline events
      if (typeof window !== 'undefined') {
        // Refetch stale queries when coming back online
        if (refetchOnReconnect) {
          window.addEventListener('online', () => {
            client.refetchQueries({ type: 'all', stale: true });
          });
        }

        // Save cache state before going offline
        window.addEventListener('offline', () => {
          this.saveToStorage(client);
        });
      }

      // Register event handlers for persisting query results
      client.getQueryCache().subscribe((event) => {
        if (event.type === 'updated' || event.type === 'added') {
          const query = event.query;

          // Check if this query should be persisted
          if (this.shouldPersistQuery(query.queryKey[0] as string)) {
            this.persistQuery(query.queryKey[0] as string, query.state.data);
          }
        }
      });
    },

    /**
     * Determine if a query should be persisted based on the configuration
     * @param queryKey Query key to check
     */
    shouldPersistQuery(queryKey: string): boolean {
      // If no whitelist is provided, persist all queries
      if (!persistQueries) return true;

      // Check against whitelist
      return persistQueries.some((pattern) => {
        if (pattern instanceof RegExp) {
          return pattern.test(queryKey);
        }
        return pattern === queryKey;
      });
    },

    /**
     * Persist a query result to storage
     * @param queryKey Query key
     * @param data Query data to persist
     */
    async persistQuery(queryKey: string, data: unknown): Promise<void> {
      if (!data) return;

      await storage.setItem(queryKey, {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + defaultTTL,
      });
    },

    /**
     * Save the entire query cache to storage
     * @param client QueryClient instance
     */
    async saveToStorage(client: QueryClient): Promise<void> {
      // Get all queries and save those that should be persisted
      const queries = client.getQueryCache().findAll();

      for (const query of queries) {
        const queryKey = query.queryKey[0];
        if (typeof queryKey === 'string' && this.shouldPersistQuery(queryKey)) {
          await this.persistQuery(queryKey, query.state.data);
        }
      }
    },

    /**
     * Restore cache from storage
     * @param client QueryClient instance
     */
    async restoreFromStorage(client: QueryClient): Promise<void> {
      try {
        // Get all keys in storage that match our prefix
        const keys = Object.keys(localStorage)
          .filter((key) => key.startsWith('offline-cache:'))
          .map((key) => key.replace('offline-cache:', ''));

        for (const key of keys) {
          const cached = await storage.getItem(key);

          if (cached && typeof cached === 'object' && cached !== null) {
            const { data, expiry } = cached as {
              data: unknown;
              expiry: number;
            };

            // Only restore if not expired
            if (expiry > Date.now()) {
              client.setQueryData([key], data);
            } else {
              // Clean up expired items
              await storage.removeItem(key);
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore cache from storage:', e);
      }
    },
  };
}

// Detect network status
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

// Initialize the offline plugin with the query client
export function initOfflineSupport(queryClient: QueryClient): void {
  const plugin = offlinePlugin({
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    persistQueries: [
      /^\/api\/user/,
      /^\/api\/agents/,
      /^\/api\/prompts/,
      /^\/api\/conversations/,
    ],
  });

  plugin.register(queryClient);
}
