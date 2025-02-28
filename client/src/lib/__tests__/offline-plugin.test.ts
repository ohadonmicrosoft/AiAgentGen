import { offlinePlugin, isOffline } from '../offline-plugin';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock QueryClient
class MockQueryClient {
  defaultQueryOptions = {};
  getQueryCache = jest.fn().mockReturnValue({
    subscribe: jest.fn(),
    findAll: jest.fn().mockReturnValue([]),
  });
  setQueryData = jest.fn();
  getQueryData = jest.fn();
  refetchQueries = jest.fn();
}

// Mock Event for online/offline events
const createEvent = (eventName: string) => {
  const event = document.createEvent('Event');
  event.initEvent(eventName, true, true);
  return event;
};

describe('Offline Plugin', () => {
  let mockQueryClient: MockQueryClient;
  let plugin: ReturnType<typeof offlinePlugin>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockQueryClient = new MockQueryClient();
    plugin = offlinePlugin();
  });

  describe('register', () => {
    it('registers event listeners and restores from storage', () => {
      const addEventListener = jest.spyOn(window, 'addEventListener');
      const restoreSpy = jest.spyOn(plugin, 'restoreFromStorage');
      
      plugin.register(mockQueryClient as any);
      
      expect(addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(restoreSpy).toHaveBeenCalledWith(mockQueryClient);
    });

    it('subscribes to query cache events', () => {
      plugin.register(mockQueryClient as any);
      
      expect(mockQueryClient.getQueryCache().subscribe).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('shouldPersistQuery', () => {
    it('returns true when no whitelist is provided', () => {
      expect(plugin.shouldPersistQuery('/api/users')).toBe(true);
    });

    it('returns true when query matches a string in the whitelist', () => {
      const pluginWithWhitelist = offlinePlugin({
        persistQueries: ['/api/users', '/api/posts'],
      });
      
      expect(pluginWithWhitelist.shouldPersistQuery('/api/users')).toBe(true);
      expect(pluginWithWhitelist.shouldPersistQuery('/api/other')).toBe(false);
    });

    it('returns true when query matches a regex in the whitelist', () => {
      const pluginWithWhitelist = offlinePlugin({
        persistQueries: [/^\/api\/users/, /^\/api\/posts/],
      });
      
      expect(pluginWithWhitelist.shouldPersistQuery('/api/users')).toBe(true);
      expect(pluginWithWhitelist.shouldPersistQuery('/api/users/123')).toBe(true);
      expect(pluginWithWhitelist.shouldPersistQuery('/api/other')).toBe(false);
    });
  });

  describe('persistQuery', () => {
    it('saves query data to storage', async () => {
      const data = { id: 1, name: 'Test' };
      await plugin.persistQuery('/api/users', data);
      
      // Check that localStorage.setItem was called with the right key and data
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'offline-cache:/api/users',
        expect.stringContaining('"data":{"id":1,"name":"Test"}')
      );
    });

    it('does not save undefined data', async () => {
      await plugin.persistQuery('/api/users', undefined);
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('saveToStorage', () => {
    it('saves all valid queries to storage', async () => {
      // Mock queries in the cache
      const queries = [
        { queryKey: ['/api/users'], state: { data: { users: [] } } },
        { queryKey: ['/api/posts'], state: { data: { posts: [] } } },
      ];
      
      mockQueryClient.getQueryCache().findAll.mockReturnValue(queries);
      
      const persistSpy = jest.spyOn(plugin, 'persistQuery');
      
      await plugin.saveToStorage(mockQueryClient as any);
      
      // Should have tried to persist both queries
      expect(persistSpy).toHaveBeenCalledTimes(2);
      expect(persistSpy).toHaveBeenCalledWith('/api/users', { users: [] });
      expect(persistSpy).toHaveBeenCalledWith('/api/posts', { posts: [] });
    });
  });

  describe('restoreFromStorage', () => {
    it('restores valid cached data to query client', async () => {
      // Setup mock cached queries
      localStorageMock.setItem(
        'offline-cache:/api/users', 
        JSON.stringify({ 
          data: { users: [] }, 
          timestamp: Date.now(), 
          expiry: Date.now() + 60000 // One minute in the future
        })
      );
      
      await plugin.restoreFromStorage(mockQueryClient as any);
      
      // Should have restored the cached query
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ['/api/users'],
        { users: [] }
      );
    });

    it('removes expired items from storage', async () => {
      // Setup expired cached query
      localStorageMock.setItem(
        'offline-cache:/api/expired', 
        JSON.stringify({ 
          data: { value: 'old' }, 
          timestamp: Date.now() - 60000, // One minute in the past
          expiry: Date.now() - 1000 // Expired
        })
      );
      
      await plugin.restoreFromStorage(mockQueryClient as any);
      
      // Should not have restored expired data
      expect(mockQueryClient.setQueryData).not.toHaveBeenCalled();
      
      // Should have removed the expired item
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('/api/expired');
    });
  });

  describe('online/offline event handlers', () => {
    it('refetches queries when coming back online', async () => {
      plugin.register(mockQueryClient as any);
      
      // Simulate coming back online
      window.dispatchEvent(createEvent('online'));
      
      // Should have triggered a refetch of all stale queries
      expect(mockQueryClient.refetchQueries).toHaveBeenCalledWith({ 
        type: 'all', 
        stale: true 
      });
    });

    it('saves cache state when going offline', async () => {
      const saveToStorageSpy = jest.spyOn(plugin, 'saveToStorage');
      
      plugin.register(mockQueryClient as any);
      
      // Simulate going offline
      window.dispatchEvent(createEvent('offline'));
      
      // Should have saved cache state
      expect(saveToStorageSpy).toHaveBeenCalledWith(mockQueryClient);
    });
  });

  describe('isOffline', () => {
    it('returns false when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
      });
      
      expect(isOffline()).toBe(false);
    });

    it('returns true when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });
      
      expect(isOffline()).toBe(true);
    });
  });
}); 