import React, { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorFallback } from '@/components/ui/error-fallback';

interface AsyncBoundaryProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?:
    | ReactNode
    | ((props: { error: Error; resetErrorBoundary: () => void }) => React.ReactNode);
  onError?: (error: Error, info: React.ErrorInfo) => void;
  onReset?: () => void;
  suspense?: boolean;
}

/**
 * A component that wraps Suspense and ErrorBoundary to handle async data loading
 * and error handling in a unified way.
 */
export function AsyncBoundary({
  children,
  loadingFallback,
  errorFallback,
  onError,
  onReset,
  suspense = true,
}: AsyncBoundaryProps) {
  // Default loading fallback
  const defaultLoadingFallback = (
    <div className="w-full p-6 space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  // Content wrapped with error boundary
  const contentWithErrorBoundary = (
    <ErrorBoundary
      fallback={errorFallback || <ErrorFallback />}
      onError={onError}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );

  // If suspense is enabled, wrap with Suspense, otherwise just use the error boundary
  return suspense ? (
    <Suspense fallback={loadingFallback || defaultLoadingFallback}>
      {contentWithErrorBoundary}
    </Suspense>
  ) : (
    contentWithErrorBoundary
  );
}

/**
 * HOC version of AsyncBoundary
 */
export function withAsyncBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AsyncBoundaryProps, 'children'>,
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';

  const WrappedComponent: React.FC<P> = (props) => (
    <AsyncBoundary {...options}>
      <Component {...props} />
    </AsyncBoundary>
  );

  WrappedComponent.displayName = `withAsyncBoundary(${displayName})`;

  return WrappedComponent;
}

/**
 * Example usage:
 *
 * ```tsx
 * <AsyncBoundary
 *   loadingFallback={<LoadingSpinner />}
 *   errorFallback={({ error, resetErrorBoundary }) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={resetErrorBoundary}>Try Again</button>
 *     </div>
 *   )}
 *   onError={(error, info) => {
 *     // Log error to a service
 *     console.error('Caught error:', error, info);
 *   }}
 * >
 *   <DataComponent />
 * </AsyncBoundary>
 * ```
 */
