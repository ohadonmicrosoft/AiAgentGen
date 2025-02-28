import {
  QueryClient,
  QueryFunction,
  QueryClientConfig,
  DefaultOptions,
} from '@tanstack/react-query';
import { offlinePlugin } from './offline-plugin'; // We'll create this next

export enum UnauthorizedBehavior {
  Throw = 'throw',
  ReturnNull = 'returnNull',
}

type ApiRequestOptions = {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  headers?: Record<string, string>;
};

// Network error detection
function isNetworkError(error: any): boolean {
  return (
    !window.navigator.onLine ||
    error.message === 'Failed to fetch' ||
    error.message.includes('NetworkError') ||
    error.message.includes('Network request failed')
  );
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: ApiRequestOptions,
): Promise<Response> {
  const { timeout = 10000, headers = {}, retries = 3, retryDelay = 1000 } = options || {};

  // Add timeout support with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const defaultHeaders: Record<string, string> = data
      ? { 'Content-Type': 'application/json' }
      : {};

    const res = await fetch(url, {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
      signal: controller.signal,
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    // Handle retries for network errors
    if (isNetworkError(error) && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return apiRequest(method, url, data, {
        ...options,
        retries: retries - 1,
        retryDelay: retryDelay * 1.5, // Exponential backoff
      });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  cacheTime?: number;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, cacheTime }) =>
  async ({ queryKey, signal }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: 'include',
        signal,
      });

      if (unauthorizedBehavior === UnauthorizedBehavior.ReturnNull && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);

      // Parse the JSON response
      const data = await res.json();

      // Store in browser cache for offline support if specified
      if (cacheTime) {
        try {
          localStorage.setItem(
            `query-cache:${queryKey[0]}`,
            JSON.stringify({
              data,
              timestamp: Date.now(),
              expiry: Date.now() + cacheTime,
            }),
          );
        } catch (e) {
          console.warn('Failed to cache query result:', e);
        }
      }

      return data;
    } catch (error) {
      // Try to use cached data when offline
      if (isNetworkError(error) && typeof localStorage !== 'undefined') {
        const cachedItem = localStorage.getItem(`query-cache:${queryKey[0]}`);
        if (cachedItem) {
          try {
            const parsed = JSON.parse(cachedItem);
            // Check if cache is valid
            if (parsed.expiry > Date.now()) {
              console.info('Using cached data for:', queryKey[0]);
              return parsed.data;
            }
          } catch (e) {
            console.warn('Failed to parse cached query result:', e);
          }
        }
      }
      throw error;
    }
  };

// Configure query client with optimized defaults
const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({
        on401: UnauthorizedBehavior.Throw,
        cacheTime: 30 * 60 * 1000, // 30 minutes default
      }),
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (except 408 Request Timeout and 429 Too Many Requests)
        if (
          error instanceof Error &&
          error.message.match(/^4\d\d:/) &&
          !error.message.match(/^(408|429):/)
        ) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (how long to keep inactive data in cache)
    },
    mutations: {
      retry: (failureCount, error) => {
        // Only retry network errors, not server errors
        if (isNetworkError(error) && failureCount < 3) {
          return true;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
};

export const queryClient = new QueryClient(defaultQueryClientConfig);
