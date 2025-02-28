import React, { useState } from 'react';
import { MainLayout } from '@/components/layouts/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  ErrorFallback,
  CompactErrorFallback,
} from '@/components/ui/error-fallback';
import { useErrorBoundary } from '@/hooks/use-error-boundary';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Bug, RefreshCw } from 'lucide-react';

// Component that throws an error when the button is clicked
function ErrorThrower() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('This is a simulated error!');
  }

  return (
    <div className="p-4 border rounded-md">
      <p className="mb-4">Click the button to simulate an error:</p>
      <Button variant="destructive" onClick={() => setShouldThrow(true)}>
        <Bug className="mr-2 h-4 w-4" />
        Throw Error
      </Button>
    </div>
  );
}

// Component that throws an error during render
function BrokenComponent() {
  throw new Error('I crashed during render!');
  return <div>You will never see this</div>;
}

// Component that throws an error after a delay
function DelayedErrorComponent() {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setHasError(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (hasError) {
    throw new Error('Delayed error after component mount');
  }

  return (
    <div className="p-4">
      This component will throw an error after 2 seconds...
    </div>
  );
}

// Component using the hook approach
function HookBasedErrorHandling() {
  const { ErrorBoundaryWrapper, hasError, resetBoundary } = useErrorBoundary();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Hook-based Error Handling</h3>
      <p className="text-sm text-muted-foreground">
        This example uses the <code>useErrorBoundary</code> hook to manage
        errors.
      </p>

      <ErrorBoundaryWrapper
        fallback={
          <div className="p-4 border rounded-md bg-muted">
            <p className="mb-2 font-medium">Error caught by the hook!</p>
            <Button onClick={resetBoundary} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-3 w-3" />
              Reset
            </Button>
          </div>
        }
      >
        <ErrorThrower />
      </ErrorBoundaryWrapper>
    </div>
  );
}

export default function ErrorHandlingDemo() {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <MainLayout>
      <div className="container mx-auto py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Error Handling Demo
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore different error handling patterns using Error Boundaries
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="nested">Nested</TabsTrigger>
            <TabsTrigger value="hook">Hook-based</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Error Boundary</CardTitle>
                  <CardDescription>
                    Simple error boundary with a fallback UI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Interactive Error
                      </h3>
                      <ErrorBoundary
                        fallback={
                          <ErrorFallback message="Error in interactive component" />
                        }
                      >
                        <ErrorThrower />
                      </ErrorBoundary>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Render Error</h3>
                      <ErrorBoundary
                        fallback={
                          <ErrorFallback message="Error during component render" />
                        }
                      >
                        <BrokenComponent />
                      </ErrorBoundary>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nested" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nested Error Boundaries</CardTitle>
                  <CardDescription>
                    Demonstrating how errors are caught by the nearest boundary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ErrorBoundary
                    fallback={
                      <ErrorFallback message="Outer boundary caught an error" />
                    }
                  >
                    <div className="p-6 border rounded-md mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        Outer Component
                      </h3>
                      <p className="mb-4">
                        This component has its own error boundary
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <ErrorBoundary
                          fallback={
                            <CompactErrorFallback message="Inner boundary 1 caught an error" />
                          }
                        >
                          <div className="p-4 border rounded-md">
                            <h4 className="font-medium mb-2">
                              Inner Component 1
                            </h4>
                            <ErrorThrower />
                          </div>
                        </ErrorBoundary>

                        <div className="p-4 border rounded-md">
                          <h4 className="font-medium mb-2">
                            Inner Component 2
                          </h4>
                          <p className="text-sm mb-4">
                            This component has no error boundary
                          </p>
                          <ErrorBoundary
                            fallback={
                              <CompactErrorFallback message="Deeply nested error" />
                            }
                          >
                            <DelayedErrorComponent />
                          </ErrorBoundary>
                        </div>
                      </div>
                    </div>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hook" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hook-based Error Handling</CardTitle>
                  <CardDescription>
                    Using the useErrorBoundary hook for functional components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HookBasedErrorHandling />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Error Handling</CardTitle>
                  <CardDescription>
                    Error recovery patterns and error logging
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Error with Recovery
                    </h3>
                    <ErrorBoundary
                      fallback={({ error, resetErrorBoundary }) => (
                        <div className="p-6 border rounded-md bg-amber-50 dark:bg-amber-950/20">
                          <div className="flex items-center mb-4">
                            <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                            <h3 className="font-medium text-amber-800 dark:text-amber-300">
                              Application Error
                            </h3>
                          </div>

                          <p className="text-amber-700 dark:text-amber-400 mb-4">
                            {error?.message || 'An unexpected error occurred'}
                          </p>

                          <div className="flex space-x-4">
                            <Button
                              onClick={resetErrorBoundary}
                              variant="outline"
                              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/50"
                            >
                              Try Again
                            </Button>

                            <Button
                              onClick={() => window.location.reload()}
                              variant="ghost"
                              className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950/50"
                            >
                              Reload Page
                            </Button>
                          </div>
                        </div>
                      )}
                      onError={(error, info) => {
                        // In a real app, you would send this to your error tracking service
                        console.error('Captured in error boundary:', error);
                        console.error('Component stack:', info.componentStack);
                      }}
                      onReset={() => {
                        // Perform additional reset actions if needed
                        console.log('Error boundary was reset');
                      }}
                    >
                      <ErrorThrower />
                    </ErrorBoundary>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Error Boundary with HOC
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This component is wrapped with the withErrorBoundary HOC
                    </p>

                    {/* We would normally use the HOC outside the component, but for demo purposes: */}
                    {(() => {
                      // Import at the top in a real component
                      const {
                        withErrorBoundary,
                      } = require('@/components/ui/error-boundary');

                      const WrappedComponent = withErrorBoundary(
                        () => <DelayedErrorComponent />,
                        {
                          FallbackComponent: ErrorFallback,
                          onError: (error) =>
                            console.log('HOC caught:', error.message),
                        },
                      );

                      return <WrappedComponent />;
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
