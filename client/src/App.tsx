import { Switch, Route, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from './lib/protected-route';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/hooks/use-theme';
import { SidebarProvider } from '@/hooks/use-sidebar-state';
import { DragProvider } from '@/contexts/drag-context';
import { PageTransition } from './lib/page-transition';
import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ErrorFallback } from '@/components/ui/error-fallback';
import { Logger } from '@/lib/logger';
import { useReducedMotion } from '@/hooks/animations/useReducedMotion';
import { initOfflineSupport } from './lib/offline-plugin';
import { OfflineIndicator } from '@/components/ui/offline-indicator';

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
const AuthPage = lazy(() => import(/* webpackChunkName: "auth" */ '@/pages/auth-page'));
  () => import(/* webpackChunkName: "auth" */ '@/pages/auth-page')
// Main app routes
const Dashboard = lazy(() => import(/* webpackChunkName: "main" */ '@/pages/dashboard'));
const Agents = lazy(() => import(/* webpackChunkName: "main" */ '@/pages/agents'));
const CreateAgent = lazy(() => import(/* webpackChunkName: "main" */ '@/pages/create-agent'));
const TestAgent = lazy(() => import(/* webpackChunkName: "main" */ '@/pages/test-agent'));
const Prompts = lazy(() => import(/* webpackChunkName: "main" */ '@/pages/prompts-new'));
const Settings = lazy(() => import(/* webpackChunkName: "main" */ '@/pages/settings'));
  () => import(/* webpackChunkName: "main" */ '@/pages/agents')
// Admin routes
const AdminAgents = lazy(() => import(/* webpackChunkName: "admin" */ '@/pages/admin-agents'));
const AdminUsers = lazy(() => import(/* webpackChunkName: "admin" */ '@/pages/admin-users'));
);
// Demo routest = lazy(
const FormDemo = lazy(() => import(/* webpackChunkName: "demo" */ '@/pages/form-demo'));
const TypographyDemo = lazy(() => import(/* webpackChunkName: "demo" */ '@/pages/typography-demo'));
const PaletteDemo = lazy(() => import(/* webpackChunkName: "demo" */ '@/pages/palette-demo'));
const SpacingDemo = lazy(() => import(/* webpackChunkName: "demo" */ '@/pages/spacing-demo'));
const DragDropDemo = lazy(() => import(/* webpackChunkName: "demo" */ '@/pages/drag-drop-demo'));
const InfiniteScrollDemo = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/infinite-scroll-demo'),
);
const ContrastCheckerDemo = lazy(
  () => import(/* webpackChunkName: "demo" */ '@/pages/contrast-checker-demo'),
);nst AdminAgents = lazy(
const PerformanceDashboard = lazy(: "admin" */ '@/pages/admin-agents')
  () => import(/* webpackChunkName: "demo" */ '@/pages/performance-dashboard'),
);nst AdminUsers = lazy(
const ErrorHandlingDemo = lazy(ame: "admin" */ '@/pages/admin-users')
  () => import(/* webpackChunkName: "demo" */ '@/pages/error-handling-demo'),
);
// Demo routes
// Common routes lazy(
const NotFound = lazy(() => import(/* webpackChunkName: "common" */ '@/pages/not-found'));
);
// Enhanced loading fallback component with progress indicator
const LoadingFallback = () => {ame: "demo" */ '@/pages/typography-demo')
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  () => import(/* webpackChunkName: "demo" */ '@/pages/palette-demo')
  // Simulate loading progress
  useEffect(() => { lazy(
    if (prefersReducedMotion) return; // Skip animation for reduced motion
);
    const interval = setInterval(() => {
      setProgress((prev) => {kName: "demo" */ '@/pages/drag-drop-demo')
        // Slow down as we approach 100%
        const increment = Math.max(1, 10 * (1 - prev / 100));
        const next = Math.min(99, prev + increment);es/infinite-scroll-demo')
        return next;
      });trastCheckerDemo = lazy(
    }, 150);rt(/* webpackChunkName: "demo" */ '@/pages/contrast-checker-demo')
);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);kName: "demo" */ '@/pages/performance-dashboard')
);
  return (rHandlingDemo = lazy(
    <div className="flex flex-col h-screen w-full items-center justify-center">
      <Spinner size="lg" />
      {!prefersReducedMotion && (
        <div className="w-64 mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div = lazy(
            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>ading fallback component with progress indicator
      )}adingFallback = () => {
      <p className="text-sm text-muted-foreground mt-2">Loading...</p>
    </div>efersReducedMotion = useReducedMotion();
  );
};// Simulate loading progress
  useEffect(() => {
// Global error fallback componentrn; // Skip animation for reduced motion
const GlobalErrorFallback = ({
  error,t interval = setInterval(() => {
  resetErrorBoundary,ev) => {
}: { error: Error; resetErrorBoundary: () => void }) => {
  // Log the error when it occursx(1, 10 * (1 - prev / 100));
  useEffect(() => {= Math.min(99, prev + increment);
    logger.error('Global application error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });urn () => clearInterval(interval);
  }, [error]);educedMotion]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-6">ter">
      <div className="w-full max-w-md">
        <ErrorFallbackMotion && (
          error={error}"w-64 mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          resetErrorBoundary={resetErrorBoundary}
          message="The application encountered an unexpected error" duration-300 ease-out"
        />  style={{ width: `${progress}%` }}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please try refreshing the page or contact support if the problem persists.
          </p>Name="text-sm text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    </div>
  );
}; Global error fallback component
const GlobalErrorFallback = ({
// Preload critical routes
function preloadRoutes() {
  // Preload auth routes
  import('@/pages/auth-page');
  resetErrorBoundary: () => void;
  // Preload main routes
  setTimeout(() => {hen it occurs
    import('@/pages/dashboard');
    import('@/pages/agents');ication error:', {
  }, 1000); error.name,
}     message: error.message,
      stack: error.stack,
function Router() {
  const [location] = useLocation();

  // Preload routes on initial load
  useEffect(() => {"flex h-screen w-full items-center justify-center p-6">
    preloadRoutes();="w-full max-w-md">
  }, []);ErrorFallback
          error={error}
  // Determine which route group is activeundary}
  const getRouteGroup = (path: string): string => {nexpected error"
    if (path.startsWith('/auth')) return ROUTE_GROUPS.AUTH;
    if (path.startsWith('/admin')) return ROUTE_GROUPS.ADMIN;
    if (  <p className="text-sm text-gray-500 dark:text-gray-400">
      [     Please try refreshing the page or contact support if the problem
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
    ) {eload auth routes
      return ROUTE_GROUPS.DEMO;
    }
    return ROUTE_GROUPS.MAIN;
  };tTimeout(() => {
    import('@/pages/dashboard');
  const currentRouteGroup = getRouteGroup(location);
  }, 1000);
  // Preload related routes when a route group is accessed
  useEffect(() => {
    // When accessing main routes, preload other main routes
    if (currentRouteGroup === ROUTE_GROUPS.MAIN) {
      import('@/pages/prompts-new');
      import('@/pages/settings');ad
    }Effect(() => {
    preloadRoutes();
    // When accessing admin routes, preload other admin routes
    if (currentRouteGroup === ROUTE_GROUPS.ADMIN) {
      import('@/pages/admin-agents');ctive
      import('@/pages/admin-users');g): string => {
    }f (path.startsWith('/auth')) return ROUTE_GROUPS.AUTH;
  }, [currentRouteGroup]);admin')) return ROUTE_GROUPS.ADMIN;
    if (
  return (
    <AnimatePresence mode="wait">
      <PageTransition location={location}>
        <ErrorBoundary',
          fallback={({ error, resetErrorBoundary }) => (
            <GlobalErrorFallback error={error!} resetErrorBoundary={resetErrorBoundary} />
          )}finite-scroll-demo',
          name="RouterErrorBoundary"
        >/performance-dashboard',
          <Suspense fallback={<LoadingFallback />}>
            <Switch>=> path.startsWith(demo))
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
              <ProtectedRoute path="/typography-demo" component={TypographyDemo} />
              <ProtectedRoute path="/palette-demo" component={PaletteDemo} />
              <ProtectedRoute path="/spacing-demo" component={SpacingDemo} />
              <ProtectedRoute path="/drag-drop-demo" component={DragDropDemo} />
              <ProtectedRoute path="/infinite-scroll-demo" component={InfiniteScrollDemo} />
              <ProtectedRoute path="/contrast-checker-demo" component={ContrastCheckerDemo} />
              <ProtectedRoute path="/performance-dashboard" component={PerformanceDashboard} />
              <ProtectedRoute path="/error-handling-demo" component={ErrorHandlingDemo} />
              <Route component={NotFound} />
            </Switch>up]);
          </Suspense>
        </ErrorBoundary>
      </PageTransition>de="wait">
    </AnimatePresence>location={location}>
  );    <ErrorBoundary
}         fallback={({ error, resetErrorBoundary }) => (
            <GlobalErrorFallback
function App() {ror={error!}
  // Register global error handlers for unhandled errors and promise rejections
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      logger.error('Unhandled global error:', {
        message: event.message,
        filename: event.filename,adingFallback />}>
        lineno: event.lineno,
        colno: event.colno,/auth" component={AuthPage} />
        stack: event.error?.stack,="/" component={Dashboard} />
      });     <ProtectedRoute path="/agents" component={Agents} />
              <ProtectedRoute path="/create-agent" component={CreateAgent} />
      // Prevent the browser from showing its own error dialogt={TestAgent} />
      event.preventDefault(); path="/test-agent" component={TestAgent} />
    };        <ProtectedRoute path="/test-agent/:id" component={TestAgent} />
              <ProtectedRoute path="/prompts" component={Prompts} />
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection:', {omponent={AdminAgents} />
        reason: event.reason, path="/admin/users" component={AdminUsers} />
        stack: event.reason?.stack,"/form-demo" component={FormDemo} />
      });     <ProtectedRoute
                path="/typography-demo"
      // Prevent the browser from showing its own error dialog
      event.preventDefault();
    };        <ProtectedRoute path="/palette-demo" component={PaletteDemo} />
              <ProtectedRoute path="/spacing-demo" component={SpacingDemo} />
    // Register the handlerse path="/drag-drop-demo" component={DragDropDemo} />
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
                component={InfiniteScrollDemo}
    // Log application startup
    logger.info('Application initialized');
                path="/contrast-checker-demo"
    // Clean up the handlers when the component unmounts
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };          component={PerformanceDashboard}
  }, []);     />
              <ProtectedRoute
  return (      path="/error-handling-demo"
    <QueryClientProvider client={queryClient}>mponent={ErrorHandlingDemo}
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-background">    </Switch>
            <Router />
          </div>   </ErrorBoundary>
          <Toaster />
          <OfflineIndicator />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}handlers for unhandled errors and promise rejections

export default App;(event: ErrorEvent) => {
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
        handleUnhandledRejection
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
