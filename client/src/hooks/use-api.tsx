import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ApiError, checkResponse, formatErrorForLogging } from '@/lib/api-error';

interface ApiOptions extends RequestInit {
  hideErrorToast?: boolean;
  useAuthToken?: boolean;
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
 * A hook for making API calls with built-in error handling
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

      try {
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

        // Make the request
        const response = await fetch(endpoint, {
          ...fetchOptions,
          headers,
        });

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
        // Handle errors
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