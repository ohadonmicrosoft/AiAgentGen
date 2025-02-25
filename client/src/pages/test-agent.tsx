import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation, Link } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';
import MainLayout from '@/layouts/MainLayout';
import AgentTester from '@/components/AgentTester';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Save, Cog, Bot, Wand2, History } from 'lucide-react';
import { Agent } from '@shared/schema';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function TestAgentPage() {
  const [_, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>('test');
  
  // If we have an ID, fetch the agent
  const {
    data: agent,
    isLoading,
    error
  } = useQuery<Agent>({
    queryKey: ['/api/agents', id],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!id,
  });
  
  // If we don't have an ID, we'll use a temporary agent
  const tempAgent: Partial<Agent> = {
    name: 'Test Agent',
    description: 'This is a temporary agent for testing',
    systemPrompt: 'You are a helpful, creative, clever, and friendly AI assistant. Your purpose is to engage in natural, helpful conversations. You have a cheerful, optimistic, and supportive personality. You help users with their questions and problems to the best of your ability. You respond to questions conversationally.',
    model: 'gpt-4o',
    temperature: '0.7',
    maxTokens: 1000,
    status: 'draft'
  };
  
  const currentAgent = id ? agent : tempAgent;
  
  if (isLoading) {
    return (
      <MainLayout title="Agent Testing">
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (error && id) {
    return (
      <MainLayout title="Agent Testing">
        <div className="flex flex-col items-center justify-center gap-4 min-h-[500px]">
          <h2 className="text-2xl font-bold">Error Loading Agent</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load agent'}
          </p>
          <Button onClick={() => setLocation('/agents')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={id ? `Testing: ${currentAgent?.name}` : "Test an Agent"}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/agents">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">
              {id ? currentAgent?.name : "Test Agent Configuration"}
            </h1>
            {currentAgent?.status && (
              <Badge variant={currentAgent.status === 'active' ? 'default' : 'secondary'}>
                {currentAgent.status === 'active' ? 'Active' : 'Draft'}
              </Badge>
            )}
          </div>
          
          {id && (
            <div className="flex gap-2">
              <Link href={`/agents/${id}/edit`}>
                <Button variant="outline">
                  <Cog className="mr-2 h-4 w-4" />
                  Edit Agent
                </Button>
              </Link>
              {currentAgent?.status !== 'active' && (
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Activate Agent
                </Button>
              )}
            </div>
          )}
        </div>
        
        <Tabs defaultValue="test" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="test">
              <Bot className="mr-2 h-4 w-4" />
              Test Agent
            </TabsTrigger>
            <TabsTrigger value="config">
              <Cog className="mr-2 h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="test" className="space-y-4 pt-4">
            <AgentTester agent={currentAgent as Partial<Agent>} />
          </TabsContent>
          
          <TabsContent value="config" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Agent Configuration
                </CardTitle>
                <CardDescription>
                  These are the current settings for this agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Model</h3>
                    <p className="text-sm">{currentAgent?.model || 'gpt-4o'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Temperature</h3>
                    <p className="text-sm">{currentAgent?.temperature || 0.7}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Max Tokens</h3>
                    <p className="text-sm">{currentAgent?.maxTokens || 1000}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Status</h3>
                    <p className="text-sm">{currentAgent?.status || 'draft'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="font-medium">System Prompt</h3>
                  <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                    {currentAgent?.systemPrompt}
                  </div>
                </div>
                
                {currentAgent?.description && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-medium">Description</h3>
                      <p className="text-sm">{currentAgent.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}