import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AgentReviewProps {
  formData: any;
  onBack: () => void;
  preview?: boolean;
}

export default function AgentReview({ formData, onBack, preview = false }: AgentReviewProps) {
  const [isTestingAgent, setIsTestingAgent] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Mutation for testing an agent
  const testAgentMutation = useMutation({
    mutationFn: async ({ config, message }: { config: any, message: string }) => {
      const res = await apiRequest("POST", "/api/agents/test", {
        agentConfig: config,
        userMessage: message
      });
      return res.json();
    },
    onSuccess: (data) => {
      setTestResponse(data.content);
      toast({
        title: "Test completed",
        description: "Your agent has been tested successfully.",
      });
      setIsTestingAgent(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive",
      });
      setIsTestingAgent(false);
    }
  });

  // Mutation for creating an agent
  const createAgentMutation = useMutation({
    mutationFn: async (agentData: any) => {
      const res = await apiRequest("POST", "/api/agents", agentData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent created successfully!",
        description: "Your new AI agent is ready to use.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate("/agents");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create agent",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateAgent = async () => {
    if (preview) return;
    setIsSubmitting(true);
    createAgentMutation.mutate(formData);
    
    // Update state based on mutation state
    if (createAgentMutation.isPending) {
      setIsSubmitting(true);
    }
    
    if (createAgentMutation.isSuccess) {
      setIsSubmitting(false);
      setIsSuccess(true);
    }
    
    if (createAgentMutation.isError) {
      setIsSubmitting(false);
    }
  };
  
  const handleTestAgent = () => {
    if (!testMessage.trim()) {
      toast({
        title: "Test message required",
        description: "Please enter a test message to check your agent's response.",
      });
      return;
    }
    
    setIsTestingAgent(true);
    testAgentMutation.mutate({ 
      config: formData, 
      message: testMessage
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Review Agent Configuration</h3>
        <p className="text-muted-foreground mb-6">
          Please review the information below to ensure your agent is configured correctly.
        </p>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Agent Name</p>
                <p className="text-sm">{formData.name || "Unnamed Agent"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Agent Type</p>
                <p className="text-sm capitalize">{formData.type || "Custom"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                <Badge variant="outline">Draft</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm">{formData.description || "No description provided"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">AI Model</p>
                <p className="text-sm">{formData.model || "GPT-4o"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Temperature</p>
                <p className="text-sm">{formData.temperature || 0.7}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Max Tokens</p>
                <p className="text-sm">{formData.maxTokens || 2048}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Response Style</p>
                <p className="text-sm capitalize">{formData.responseStyle || "Formal"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">System Prompt</p>
              <div className="bg-muted p-3 rounded-md overflow-auto max-h-32">
                <pre className="text-xs whitespace-pre-wrap">{formData.systemPrompt || "No system prompt provided"}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Test Agent Section */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Test Your Agent</h4>
                {!preview && (
                  <Button size="sm" variant="outline" onClick={handleTestAgent} disabled={isTestingAgent || !testMessage.trim()}>
                    {isTestingAgent ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Agent"
                    )}
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <textarea
                  className="w-full p-2 min-h-[80px] text-sm rounded-md border border-border bg-background"
                  placeholder="Enter a test message to see how your agent responds..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  disabled={isTestingAgent || preview}
                />
                
                {testResponse && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Agent Response:</p>
                    <div className="bg-muted p-3 rounded-md overflow-auto max-h-[200px]">
                      <p className="text-sm whitespace-pre-wrap">{testResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting || isSuccess || preview}>
          Back
        </Button>
        <Button 
          onClick={handleCreateAgent} 
          disabled={isSubmitting || isSuccess || preview}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : isSuccess ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Created!
            </>
          ) : (
            "Create Agent"
          )}
        </Button>
      </div>
    </div>
  );
}
