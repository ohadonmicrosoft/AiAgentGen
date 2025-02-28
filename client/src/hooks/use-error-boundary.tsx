import { ErrorBoundary } from '@/components/ui/error-boundary';
import React, { useState, useCallback, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface UseErrorBoundaryResult {
  ErrorBoundaryWrapper: React.FC<{ children: ReactNode; fallback?: ReactNode }>;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  hasError: boolean;
  resetBoundary: () => void;
}

/**
 * A hook for using Error Boundaries in functional components.
 * This provides a wrapper component and state/handlers for error management.
 */
export function useErrorBoundary(): UseErrorBoundaryResult {
  const [errorState, setErrorState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorInfo: null,
  });

  const resetBoundary = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  }, []);

  const handleError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      setErrorState({
        hasError: true,
        error,
        errorInfo,
      });

      // Log the error
      console.error('Error caught by useErrorBoundary:', error, errorInfo);
    },
    [],
  );

  const ErrorBoundaryWrapper: React.FC<{
    children: ReactNode;
    fallback?: ReactNode;
  }> = useCallback(
    ({ children, fallback }) => (
      <ErrorBoundary
        fallback={fallback}
        onReset={resetBoundary}
        onError={handleError}
      >
        {children}
      </ErrorBoundary>
    ),
    [resetBoundary, handleError],
  );

  return {
    ErrorBoundaryWrapper,
    error: errorState.error,
    errorInfo: errorState.errorInfo,
    hasError: errorState.hasError,
    resetBoundary,
  };
}

/**
 * Example usage:
 *
 * ```tsx
 * function MyComponent() {
 *   const { ErrorBoundaryWrapper, hasError, resetBoundary } = useErrorBoundary();
 *
 *   return (
 *     <ErrorBoundaryWrapper>
 *       <ComponentThatMightThrow />
 *     </ErrorBoundaryWrapper>
 *   );
 * }
 * ```
 */
