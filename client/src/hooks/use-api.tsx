import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  ApiError, 
  checkResponse, 
  formatErrorForLogging, 
  createNetworkError,
  ErrorCategory
} from '@/lib/api-error';
import { logger } from '@/lib/logger';

// Create a dedicated logger for API calls
const logger = new Logger('APIClient');

interface ApiOptions extends RequestInit {
  hideErrorToast?: boolean;
  useAuthToken?: boolean;
  retryCount?: number;
  retryDelay?: number;
  abortTimeoutMs?: number;
  retryOn5xx?: boolean;
}

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isValidating: boolean;
}

type ApiHookResult<T> = [
  (endpoint: string, options?: ApiOptions) => Promise<T>,
  ApiState<T>
];

/**
 * A hook for making API calls with built-in error handling and retry capability
 * @template T The expected response data type
 * @returns A tuple with the fetch function and state
 */
export function useApi<T = any>(): ApiHookResult<T> {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isValidating: false,
  });
  
  // Keep track of in-flight requests to avoid state updates after component unmount
  const activeRequestsRef = useRef(new Set<string>());
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRequestsRef.current.clear();
    };
  }, []);

  const fetchData = useCallback(
    async (endpoint: string, options: ApiOptions = {}): Promise<T> => {
      const {
        hideErrorToast = false,
        useAuthToken = true,
        retryCount = 2,
        retryDelay = 1000,
        abortTimeoutMs = 30000,
        retryOn5xx = true,
        ...fetchOptions
      } = options;

      // Generate a unique request ID
      const requestId = `${endpoint}-${Date.now()}`;
      activeRequestsRef.current.add(requestId);

      // Set loading state
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
      
      // Set up abort controller for timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, abortTimeoutMs);
      
      // Create a signal if one doesn't exist or combine with existing
      const signal = fetchOptions.signal
        ? composeAbortSignals(controller.signal, fetchOptions.signal)
        : controller.signal;

      // Function to perform the actual fetch with retry logic
      async function performFetchWithRetry(attempt: number): Promise<T> {
        try {
          logger.debug(`API Request [${attempt}/${retryCount + 1}]: ${endpoint}`);
          
          // Add authorization header if needed
          const headers = new Headers(fetchOptions.headers);
          
          if (useAuthToken && user?.token) {
            headers.set('Authorization', `Bearer ${user.token}`);
          }
          
          // Set content type to JSON if not already set and there's a body
          if (
            fetchOptions.body &&
            !headers.has('Content-Type') &&
            !(fetchOptions.body instanceof FormData)
          ) {
            headers.set('Content-Type', 'application/json');
          }
          
          // Add a client request ID for tracking
          headers.set('X-Client-Request-ID', requestId);

          // Make the request
          const startTime = Date.now();
          const response = await fetch(endpoint, {
            ...fetchOptions,
            headers,
            signal,
          });
          const duration = Date.now() - startTime;
          
          logger.debug(`API Response [${attempt}]: ${endpoint} - ${response.status} in ${duration}ms`);

          // Check for errors
          await checkResponse(response, endpoint);

          // Parse the response
          let data: T;
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            data = await response.json();
          } else {
            // Handle non-JSON responses
            const text = await response.text();
            try {
              // Try to parse as JSON anyway
              data = JSON.parse(text) as T;
            } catch (e) {
              // If not JSON, use the text as is
              data = text as unknown as T;
            }
          }
          
          // Cleanup timeout
          clearTimeout(timeoutId);

          // Only update state if the request is still active
          if (activeRequestsRef.current.has(requestId)) {
            setState({
              data,
              isLoading: false,
              error: null,
              isValidating: false,
            });
          }

          return data;
        } catch (error) {
          // Handle abort errors
          if (error instanceof DOMException && error.name === 'AbortError') {
            const abortError = new ApiError(
              'Request timed out',
              408,
              'Request Timeout',
              endpoint
            );
            throw abortError;
          }
          
          // Handle network errors
          if (!(error instanceof ApiError)) {
            const networkError = createNetworkError(
              error instanceof Error ? error : new Error(String(error)),
              endpoint
            );
            throw networkError;
          }
          
          // Determine if we should retry
          const shouldRetry = attempt <= retryCount && (
            // Retry on network errors
            error.category === ErrorCategory.NETWORK || 
            // Retry on server errors if enabled
            (retryOn5xx && error.isServerError()) ||
            // Retry on timeout errors
            error.category === ErrorCategory.TIMEOUT
          );
          
          if (shouldRetry) {
            // Log retry attempt
            logger.debug(`Retrying API call (${attempt}/${retryCount}): ${endpoint}`);
            
            // Wait before retry using exponential backoff
            const delay = retryDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Retry the request
            return performFetchWithRetry(attempt + 1);
          }
          
          // We've exhausted retries or shouldn't retry, so propagate the error
          clearTimeout(timeoutId);
          throw error;
        }
      }

      try {
        // Start fetch operation with retry
        return await performFetchWithRetry(1);
      } catch (error) {
        // Handle errors after all retries exhausted
        console.error('API Error:', formatErrorForLogging(error));

        // Check for auth errors
        if (error instanceof ApiError && error.isAuthError()) {
          logout();
        }

        // Show toast for errors
        if (!hideErrorToast) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'An unexpected error occurred',
            variant: 'destructive',
          });
        }

        // Only update state if the request is still active
        if (activeRequestsRef.current.has(requestId)) {
          setState({
            data: null,
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
            isValidating: false,
          });
        }

        throw error;
      } finally {
        // Remove the request from active requests
        activeRequestsRef.current.delete(requestId);
      }
    },
    [toast, user, logout]
  );

  return [fetchData, state];
}

/**
 * Helper function to compose multiple AbortSignals
 */
function composeAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  
  signals.forEach(signal => {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return;
    }
    
    signal.addEventListener('abort', () => {
      controller.abort(signal.reason);
    }, { once: true });
  });
  
  return controller.signal;
}

/**
 * Example usage:
 * 
 * ```tsx
 * function UserProfile() {
 *   const [fetchApi, { data, isLoading, error }] = useApi<User>();
 *   
 *   useEffect(() => {
 *     const fetchUser = async () => {
 *       try {
 *         await fetchApi('/api/user/profile');
 *       } catch (error) {
 *         // Handle specific component error handling if needed
 *       }
 *     };
 *     
 *     fetchUser();
 *   }, [fetchApi]);
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return data ? <div>Hello, {data.name}!</div> : null;
 * }
 * ```
 */ 