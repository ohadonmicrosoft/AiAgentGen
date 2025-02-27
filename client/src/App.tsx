import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { SidebarProvider } from "@/hooks/use-sidebar-state";
import { DragProvider } from "@/contexts/drag-context";
import { PageTransition } from "./lib/page-transition";
import { AnimatePresence } from "framer-motion";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Agents from "@/pages/agents";
import CreateAgent from "@/pages/create-agent";
import TestAgent from "@/pages/test-agent";
import Prompts from "@/pages/prompts-new";
import Settings from "@/pages/settings";
import AdminAgents from "@/pages/admin-agents";
import AdminUsers from "@/pages/admin-users";
import FormDemo from "@/pages/form-demo";
import TypographyDemo from "@/pages/typography-demo";
import PaletteDemo from "@/pages/palette-demo";
import SpacingDemo from "@/pages/spacing-demo";
import DragDropDemo from "@/pages/drag-drop-demo";
import InfiniteScrollDemo from "@/pages/infinite-scroll-demo";
import ContrastCheckerDemo from "@/pages/contrast-checker-demo";
import PerformanceDashboard from "@/pages/performance-dashboard";

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <PageTransition location={location}>
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
          <Route component={NotFound} />
        </Switch>
      </PageTransition>
    </AnimatePresence>
  );
}

function App() {
  return (
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
  );
}

export default App;
