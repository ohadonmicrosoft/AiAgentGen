import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SignIn } from "../components/auth/SignIn";
import { SignUp } from "../components/auth/SignUp";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("signin");
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  // Get the redirect path from location state or default to home
  const from = location.state?.from?.pathname || "/";

  // If user is already authenticated, redirect to the intended destination
  if (currentUser) {
    navigate(from, { replace: true });
    return null;
  }

  const handleAuthSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Welcome to AI Agent Generator</h1>
        <p className="text-muted-foreground mt-2">
          Sign in to your account or create a new one to get started
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <SignIn onSuccess={handleAuthSuccess} />
        </TabsContent>
        <TabsContent value="signup">
          <SignUp onSuccess={handleAuthSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
