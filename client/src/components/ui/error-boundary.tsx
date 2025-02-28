import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { AlertCircle, RefreshCw } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  name?: string; // Component name for better error tracking
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary component that catches JavaScript errors in its child component tree.
 * It logs the errors and displays a fallback UI instead of crashing the whole application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log the error using the logger
    const componentName = this.props.name || 'UnnamedComponent';
    logger.error(`Error in component ${componentName}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      name: error.name,
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to server for tracking if in production
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToServer(error, errorInfo, componentName);
    }
  }

  /**
   * Send error data to server for tracking and analysis
   */
  private reportErrorToServer = (
    error: Error,
    errorInfo: ErrorInfo,
    componentName: string,
  ): void => {
    try {
      fetch('/api/logs/client-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          componentName,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
        // Use keepalive to ensure the request completes even if the page is unloading
        keepalive: true,
      }).catch((err) => {
        // Log silently if reporting fails
        console.error('Failed to report error to server:', err);
      });
    } catch (reportError) {
      // Catch any errors in error reporting to prevent cascading issues
      console.error('Error reporting failed:', reportError);
    }
  };

  resetErrorBoundary = (): void => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: undefined,
    });

    // Call onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }

    // Log the reset action
    logger.info('Error boundary reset by user');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise, render the default error UI
      return (
        <div className="p-4 w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>

          <div className="flex justify-center mt-4">
            <Button
              onClick={this.resetErrorBoundary}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * A higher-order component that wraps a component with an ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';

  // Include the component name in the error boundary props
  const mergedProps = {
    ...errorBoundaryProps,
    name: displayName,
  };

  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...mergedProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;

  return WrappedComponent;
}
