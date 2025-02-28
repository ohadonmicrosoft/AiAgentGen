import {
  isOnline,
  submitForm,
  getPendingForms,
  syncOfflineForms,
} from '../offline-forms';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }),
) as jest.Mock;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  configurable: true,
  value: true,
});

// Mock IndexedDB
const mockIDBDatabase = {
  transaction: jest.fn(),
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(true),
  },
  createObjectStore: jest.fn(),
};

const mockIDBObjectStore = {
  add: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
};

const mockIDBTransaction = {
  objectStore: jest.fn().mockReturnValue(mockIDBObjectStore),
  complete: Promise.resolve(),
};

// Mock IndexedDB request results
const mockRequestSuccess = {
  onsuccess: null as null | ((event: any) => void),
  onerror: null as null | ((event: any) => void),
  result: [],
  error: null,
};

// Mock IndexedDB open request
const mockOpenDBRequest = {
  onupgradeneeded: null as null | ((event: any) => void),
  onsuccess: null as null | ((event: any) => void),
  onerror: null as null | ((event: any) => void),
  result: mockIDBDatabase,
  error: null,
};

// Mock indexed DB functions
global.indexedDB = {
  open: jest.fn().mockImplementation(() => {
    setTimeout(() => {
      if (mockOpenDBRequest.onsuccess) {
        mockOpenDBRequest.onsuccess({ target: mockOpenDBRequest } as any);
      }
    }, 0);
    return mockOpenDBRequest;
  }),
};

// Mock service worker registration
global.navigator.serviceWorker = {
  ready: Promise.resolve({
    sync: {
      register: jest.fn().mockResolvedValue(undefined),
    },
  }),
} as any;

describe('Offline Forms Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
    mockIDBObjectStore.add.mockImplementation((data) => {
      setTimeout(() => {
        if (mockRequestSuccess.onsuccess) {
          mockRequestSuccess.onsuccess({ target: mockRequestSuccess } as any);
        }
      }, 0);
      return mockRequestSuccess;
    });

    mockIDBObjectStore.getAll.mockImplementation(() => {
      setTimeout(() => {
        if (mockRequestSuccess.onsuccess) {
          mockRequestSuccess.result = [];
          mockRequestSuccess.onsuccess({ target: mockRequestSuccess } as any);
        }
      }, 0);
      return mockRequestSuccess;
    });

    mockIDBObjectStore.delete.mockImplementation((id) => {
      setTimeout(() => {
        if (mockRequestSuccess.onsuccess) {
          mockRequestSuccess.onsuccess({ target: mockRequestSuccess } as any);
        }
      }, 0);
      return mockRequestSuccess;
    });

    // Reset online status
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    // Reset fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('isOnline', () => {
    it('returns true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
      });

      expect(isOnline()).toBe(true);
    });

    it('returns false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });

      expect(isOnline()).toBe(false);
    });
  });

  describe('submitForm', () => {
    it('submits form data when online', async () => {
      const formData = {
        url: '/api/test',
        method: 'POST' as const,
        data: { name: 'Test' },
      };

      const result = await submitForm(formData);

      expect(fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        }),
      );

      expect(result).toEqual({ success: true });
    });

    it('saves form data for later when offline', async () => {
      // Mock being offline
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });

      // Setup mock for getting pending forms
      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequestSuccess.onsuccess) {
            mockRequestSuccess.result = [];
            mockRequestSuccess.onsuccess({ target: mockRequestSuccess } as any);
          }
        }, 0);
        return mockRequestSuccess;
      });

      const formData = {
        url: '/api/test',
        method: 'POST' as const,
        data: { name: 'Test' },
      };

      const result = await submitForm(formData);

      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();

      // Verify form was saved for later
      expect(mockIDBObjectStore.add).toHaveBeenCalled();

      // Verify correct result format
      expect(result).toHaveProperty('_offlineSubmitted', true);
      expect(result).toHaveProperty('_formId');
    });

    it('saves form data for later when fetch fails with network error', async () => {
      // Mock fetch failing
      (global.fetch as jest.Mock).mockRejectedValue(
        new TypeError('Failed to fetch'),
      );

      const formData = {
        url: '/api/test',
        method: 'POST' as const,
        data: { name: 'Test' },
      };

      const result = await submitForm(formData);

      // Verify form was saved for later
      expect(mockIDBObjectStore.add).toHaveBeenCalled();

      // Verify correct result format
      expect(result).toHaveProperty('_offlineSubmitted', true);
      expect(result).toHaveProperty('_formId');
    });
  });

  describe('getPendingForms', () => {
    it('returns an empty array if no pending forms', async () => {
      // Setup mock response
      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequestSuccess.onsuccess) {
            mockRequestSuccess.result = [];
            mockRequestSuccess.onsuccess({ target: mockRequestSuccess } as any);
          }
        }, 0);
        return mockRequestSuccess;
      });

      const result = await getPendingForms();

      expect(result).toEqual([]);
      expect(mockIDBObjectStore.getAll).toHaveBeenCalled();
    });

    it('returns pending forms if available', async () => {
      // Setup mock pending forms
      const pendingForms = [
        {
          id: '1',
          url: '/api/test',
          method: 'POST',
          body: '{}',
          headers: {},
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequestSuccess.onsuccess) {
            mockRequestSuccess.result = pendingForms;
            mockRequestSuccess.onsuccess({ target: mockRequestSuccess } as any);
          }
        }, 0);
        return mockRequestSuccess;
      });

      const result = await getPendingForms();

      expect(result).toEqual(pendingForms);
    });
  });

  describe('syncOfflineForms', () => {
    it('returns no syncs if no pending forms', async () => {
      // Setup mock response
      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequestSuccess.onsuccess) {
            mockRequestSuccess.result = [];
            mockRequestSuccess.onsuccess({ target: mockRequestSuccess } as any);
          }
        }, 0);
        return mockRequestSuccess;
      });

      const result = await syncOfflineForms();

      expect(result).toEqual({ success: 0, failed: 0 });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('syncs pending forms and deletes successful ones', async () => {
      // Setup mock pending forms
      const pendingForms = [
        {
          id: '1',
          url: '/api/test',
          method: 'POST',
          body: '{}',
          headers: {},
          timestamp: Date.now(),
          retries: 0,
        },
        {
          id: '2',
          url: '/api/test2',
          method: 'POST',
          body: '{}',
          headers: {},
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequestSuccess.onsuccess) {
            mockRequestSuccess.result = pendingForms;
            mockRequestSuccess.onsuccess({ target: mockRequestSuccess } as any);
          }
        }, 0);
        return mockRequestSuccess;
      });

      // First request succeeds, second fails
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // First will succeed
        .mockResolvedValueOnce({ ok: false }); // Second will fail

      const result = await syncOfflineForms();

      // Should have tried to sync both forms
      expect(fetch).toHaveBeenCalledTimes(2);

      // Should have tried to delete only the successful form
      expect(mockIDBObjectStore.delete).toHaveBeenCalledWith('1');
      expect(mockIDBObjectStore.delete).not.toHaveBeenCalledWith('2');

      // Should report the sync results
      expect(result).toEqual({ success: 1, failed: 1 });
    });
  });
});
