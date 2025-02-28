import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/hooks/use-theme";
import { SidebarProvider } from "@/hooks/use-sidebar-state";
import { DragProvider } from "@/contexts/drag-context";
import { PageTransition } from "./lib/page-transition";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { Logger } from "@/lib/logger";

// Initialize logger
const logger = new Logger('App');

// Lazy load page components
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Agents = lazy(() => import("@/pages/agents"));
const CreateAgent = lazy(() => import("@/pages/create-agent"));
const TestAgent = lazy(() => import("@/pages/test-agent"));
const Prompts = lazy(() => import("@/pages/prompts-new"));
const Settings = lazy(() => import("@/pages/settings"));
const AdminAgents = lazy(() => import("@/pages/admin-agents"));
const AdminUsers = lazy(() => import("@/pages/admin-users"));
const FormDemo = lazy(() => import("@/pages/form-demo"));
const TypographyDemo = lazy(() => import("@/pages/typography-demo"));
const PaletteDemo = lazy(() => import("@/pages/palette-demo"));
const SpacingDemo = lazy(() => import("@/pages/spacing-demo"));
const DragDropDemo = lazy(() => import("@/pages/drag-drop-demo"));
const InfiniteScrollDemo = lazy(() => import("@/pages/infinite-scroll-demo"));
const ContrastCheckerDemo = lazy(() => import("@/pages/contrast-checker-demo"));
const PerformanceDashboard = lazy(() => import("@/pages/performance-dashboard"));
const ErrorHandlingDemo = lazy(() => import("@/pages/error-handling-demo"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Spinner size="lg" />
  </div>
);

// Global error fallback component
const GlobalErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => {
  // Log the error when it occurs
  useEffect(() => {
    logger.error('Global application error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
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
            Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    </div>
  );
};

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <PageTransition location={location}>
        <ErrorBoundary
          fallback={({ error, resetErrorBoundary }) => (
            <GlobalErrorFallback error={error!} resetErrorBoundary={resetErrorBoundary} />
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
              <ProtectedRoute path="/typography-demo" component={TypographyDemo} />
              <ProtectedRoute path="/palette-demo" component={PaletteDemo} />
              <ProtectedRoute path="/spacing-demo" component={SpacingDemo} />
              <ProtectedRoute path="/drag-drop-demo" component={DragDropDemo} />
              <ProtectedRoute path="/infinite-scroll-demo" component={InfiniteScrollDemo} />
              <ProtectedRoute path="/contrast-checker-demo" component={ContrastCheckerDemo} />
              <ProtectedRoute path="/performance-dashboard" component={PerformanceDashboard} />
              <ProtectedRoute path="/error-handling-demo" component={ErrorHandlingDemo} />
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
        stack: event.error?.stack
      });
      
      // Prevent the browser from showing its own error dialog
      event.preventDefault();
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection:', {
        reason: event.reason,
        stack: event.reason?.stack
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
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <GlobalErrorFallback error={error!} resetErrorBoundary={resetErrorBoundary} />
      )}
      name="AppRootErrorBoundary"
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
          <SidebarProvider>
            <DragProvider>
              <AuthProvider>
                <Router />
                <Toaster />
              </AuthProvider>
            </DragProvider>
          </SidebarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
