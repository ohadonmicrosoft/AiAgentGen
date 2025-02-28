import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ErrorFallback } from '@/components/ui/error-fallback';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { Spinner } from '@/components/ui/spinner';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { DragProvider } from '@/contexts/drag-context';
import { useReducedMotion } from '@/hooks/animations/useReducedMotion';
import { SidebarProvider } from '@/hooks/use-sidebar-state';
import { ThemeProvider } from '@/hooks/use-theme';
import { Logger } from '@/lib/logger';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Suspense, lazy, useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { initOfflineSupport } from './lib/offline-plugin';
import { PageTransition } from './lib/page-transition';
import { ProtectedRoute } from './lib/protected-route';
import { queryClient } from './lib/queryClient';

// Initialize logger
const logger = new Logger('App');

// Initialize offline support
initOfflineSupport(queryClient);

// Define route groups for code splitting
const ROUTE_GROUPS = {
  AUTH: 'auth',
  MAIN: 'main',
  ADMIN: 'admin',
  DEMO: 'demo',
};

// Lazy load page components with route-based code splitting
// Auth routes
const AuthPage = lazy(
  () => import(/* webpackChunkName: "auth" */ '@/pages/auth-page'),
);
() => import(/* webpackChunkName: "auth" */ '@/pages/auth-page');
// Main app routes
const Dashboard = lazy(
  () => import(/* webpackChunkName: "main" */ '@/pages/dashboard'),
);
const Agents = lazy(
  () => import(/* webpackChunkName: "main" */ '@/pages/agents'),
);
const CreateAgent = lazy(
  () => import(/* webpackChunkName: "main" */ '@/pages/create-agent'),
);
const TestAgent = lazy(
  () => import(/* webpackChunkName: "main" */ '@/pages/test-agent'),
);
const Prompts = lazy(
  () => import(/* webpackChunkName: "main" */ '@/pages/prompts-new'),
);
const Settings = lazy(
  () => import(/* webpackChunkName: "main" */ '@/pages/settings'),
);
const Agents = lazy(
  () => import(/* webpackChunkName: "main" */ '@/pages/agents'),
);
// Admin routes
const AdminAgents = lazy(
  () => import(/* webpackChunkName: "admin" */ '@/pages/admin-agents'),
);
const AdminUsers = lazy(
  () => import(/* webpackChunkName: "admin" */ '@/pages/admin-users'),
);

// Demo routes
const FormDemo = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/form-demo'),
);
const TypographyDemo = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/typography-demo'),
);
const PaletteDemo = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/palette-demo'),
);
const SpacingDemo = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/spacing-demo'),
);
const DragDropDemo = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/drag-drop-demo'),
);
const InfiniteScrollDemo = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/infinite-scroll-demo'),
);
const ContrastCheckerDemo = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/contrast-checker-demo'),
);
const PerformanceDashboard = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/performance-dashboard'),
);
const ErrorHandlingDemo = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/error-handling-demo'),
);

// Common routes
const NotFound = lazy(
  () => import(/* webpackChunkName: "common" */ '@/pages/not-found'),
);

// Enhanced loading fallback component with progress indicator
const LoadingFallback = () => {
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Simulate loading progress
  useEffect(() => {
    if (prefersReducedMotion) return; // Skip animation for reduced motion

    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we approach 100%
        const increment = Math.max(1, 10 * (1 - prev / 100));
        const next = Math.min(99, prev + increment);
        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center">
      <Spinner size="lg" />
      {!prefersReducedMotion && (
        <div className="w-64 mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground mt-2">Loading...</p>
      </div>
    </div>
  );
};

// Global error fallback component
const GlobalErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => {
  useEffect(() => {
    logger.error('Global application error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          message="The application encountered an unexpected error"
        />
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please try refreshing the page or contact support if the problem
            persists.
          </p>
        </div>
      </div>
    </div>
  );
};

// Preload critical routes
function preloadRoutes() {
  // Preload auth routes
  import('@/pages/auth-page');
  // Preload main routes
  setTimeout(() => {
    import('@/pages/dashboard');
    import('@/pages/agents');
  }, 1000);
}

function Router() {
  const [location] = useLocation();

  // Preload routes on initial load
  useEffect(() => {
    preloadRoutes();
  }, []);

  // Determine which route group is active
  const getRouteGroup = (path: string): string => {
    if (path.startsWith('/auth')) return ROUTE_GROUPS.AUTH;
    if (path.startsWith('/admin')) return ROUTE_GROUPS.ADMIN;
    if (
      [
        '/form-demo',
        '/typography-demo',
        '/palette-demo',
        '/spacing-demo',
        '/drag-drop-demo',
        '/infinite-scroll-demo',
        '/contrast-checker-demo',
        '/performance-dashboard',
        '/error-handling-demo',
      ].some((demo) => path.startsWith(demo))
    ) {
      return ROUTE_GROUPS.DEMO;
    }
    return ROUTE_GROUPS.MAIN;
  };

  const currentRouteGroup = getRouteGroup(location);

  // Preload related routes when a route group is accessed
  useEffect(() => {
    // When accessing main routes, preload other main routes
    if (currentRouteGroup === ROUTE_GROUPS.MAIN) {
      import('@/pages/prompts-new');
      import('@/pages/settings');
    }
    // When accessing admin routes, preload other admin routes
    if (currentRouteGroup === ROUTE_GROUPS.ADMIN) {
      import('@/pages/admin-agents');
      import('@/pages/admin-users');
    }
  }, [currentRouteGroup]);

  return (
    <AnimatePresence mode="wait">
      <PageTransition location={location}>
        <ErrorBoundary
          fallback={({ error, resetErrorBoundary }) => (
            <GlobalErrorFallback
              error={error!}
              resetErrorBoundary={resetErrorBoundary}
            />
          )}
          name="RouterErrorBoundary"
        >
          <Suspense fallback={<LoadingFallback />}>
            <Switch>
              <Route path="/auth" component={AuthPage} />
              <ProtectedRoute path="/" component={Dashboard} />
              <ProtectedRoute path="/agents" component={Agents} />
              <ProtectedRoute path="/create-agent" component={CreateAgent} />
              <ProtectedRoute path="/agents/:id/test" component={TestAgent} />
              <ProtectedRoute path="/test-agent" component={TestAgent} />
              <ProtectedRoute path="/test-agent/:id" component={TestAgent} />
              <ProtectedRoute path="/prompts" component={Prompts} />
              <ProtectedRoute path="/settings" component={Settings} />
              <ProtectedRoute path="/admin/agents" component={AdminAgents} />
              <ProtectedRoute path="/admin/users" component={AdminUsers} />
              <ProtectedRoute path="/form-demo" component={FormDemo} />
              <ProtectedRoute
                path="/typography-demo"
                component={TypographyDemo}
              />
              <ProtectedRoute path="/palette-demo" component={PaletteDemo} />
              <ProtectedRoute path="/spacing-demo" component={SpacingDemo} />
              <ProtectedRoute path="/drag-drop-demo" component={DragDropDemo} />
              <ProtectedRoute
                path="/infinite-scroll-demo"
                component={InfiniteScrollDemo}
              />
              <ProtectedRoute
                path="/contrast-checker-demo"
                component={ContrastCheckerDemo}
              />
              <ProtectedRoute
                path="/performance-dashboard"
                component={PerformanceDashboard}
              />
              <ProtectedRoute
                path="/error-handling-demo"
                component={ErrorHandlingDemo}
              />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </PageTransition>
    </AnimatePresence>
  );
}

function App() {
  // Register global error handlers for unhandled errors and promise rejections
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      logger.error('Unhandled global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });

      // Prevent the browser from showing its own error dialog
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection:', {
        reason: event.reason,
        stack: event.reason?.stack,
      });

      // Prevent the browser from showing its own error dialog
      event.preventDefault();
    };

    // Register the handlers
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Log application startup
    logger.info('Application initialized');

    // Clean up the handlers when the component unmounts
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      );
    };
  }, []);

  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <GlobalErrorFallback
          error={error!}
          resetErrorBoundary={resetErrorBoundary}
        />
      )}
      name="AppErrorBoundary"
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SidebarProvider>
            <DragProvider>
              <ThemeProvider>
                <Router />
                <Toaster />
                <OfflineIndicator />
              </ThemeProvider>
            </DragProvider>
          </SidebarProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
