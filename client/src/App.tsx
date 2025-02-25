import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
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

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/agents" component={Agents} />
      <ProtectedRoute path="/create-agent" component={CreateAgent} />
      <ProtectedRoute path="/agents/:id/test" component={TestAgent} />
      <ProtectedRoute path="/test-agent" component={TestAgent} />
      <ProtectedRoute path="/prompts" component={Prompts} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/admin/agents" component={AdminAgents} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
