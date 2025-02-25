import React, { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Edit, Trash2, Eye, Bot, Activity } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { ROLES, Agent } from "@shared/schema";

interface ExtendedAgent extends Agent {
  createdBy: {
    id: number;
    username: string;
  };
}

export default function AdminAgentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewAgent, setViewAgent] = useState<ExtendedAgent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<ExtendedAgent | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all agents (admin can see all)
  const {
    data: agents,
    isLoading,
    error,
  } = useQuery<ExtendedAgent[]>({
    queryKey: ["/api/admin/agents"],
    queryFn: getQueryFn(),
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: number) => {
      return await apiRequest("DELETE", `/api/admin/agents/${agentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Agent Deleted",
        description: "The agent has been permanently deleted.",
      });
      setAgentToDelete(null);
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle agent delete
  const handleDeleteAgent = (agent: ExtendedAgent) => {
    setAgentToDelete(agent);
    setIsDeleteDialogOpen(true);
  };

  // Handle agent view
  const handleViewAgent = (agent: ExtendedAgent) => {
    setViewAgent(agent);
    setIsViewDialogOpen(true);
  };

  // Confirm deletion
  const confirmDelete = () => {
    if (agentToDelete) {
      deleteAgentMutation.mutate(agentToDelete.id);
    }
  };

  // Filter agents by search term and tab
  const filteredAgents = agents?.filter((agent) => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.createdBy.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && agent.status === "active";
    if (activeTab === "draft") return matchesSearch && agent.status === "draft";
    
    return matchesSearch;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If not admin, redirect to dashboard
  if (!authLoading && user && user.role !== ROLES.ADMIN) {
    return <Redirect to="/" />;
  }

  if (isLoading || authLoading) {
    return (
      <MainLayout title="Agent Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Agent Management">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">Could not load agents. Please try again.</p>
          <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] })}>
            Retry
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Agent Management">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Agent Management</h1>
            <p className="text-muted-foreground">View and manage all agents in the system</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Admin Area
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Agent List</CardTitle>
                <CardDescription>All agents created in the system</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All Agents</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents && filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>{agent.createdBy.username}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={agent.status === "active" ? "default" : "secondary"}
                        >
                          {agent.status === "active" ? "Active" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(agent.updatedAt || agent.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => handleViewAgent(agent)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1 text-amber-500 hover:text-amber-600"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteAgent(agent)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      {searchTerm ? "No agents match your search" : "No agents found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* View Agent Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {viewAgent?.name}
            </DialogTitle>
            <DialogDescription>
              Agent details and configuration
            </DialogDescription>
          </DialogHeader>
          
          {viewAgent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge 
                    variant={viewAgent.status === "active" ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {viewAgent.status === "active" ? "Active" : "Draft"}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created By</h3>
                  <p>{viewAgent.createdBy.username}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                  <p>{formatDate(viewAgent.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p>{formatDate(viewAgent.updatedAt || viewAgent.createdAt)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="mt-1">{viewAgent.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">System Prompt</h3>
                <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                  {viewAgent.systemPrompt}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Model Configuration</h3>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs font-medium">Model:</span>
                    <p>{viewAgent.model || "gpt-4"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium">Temperature:</span>
                    <p>{viewAgent.temperature || 0.7}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium">Max Tokens:</span>
                    <p>{viewAgent.maxTokens || 2048}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium">Top P:</span>
                    <p>{viewAgent.topP || 1}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button 
              type="button"
              onClick={() => {
                setIsViewDialogOpen(false);
                // Here you could navigate to the agent test page or implement a test function
              }}
            >
              <Activity className="mr-2 h-4 w-4" />
              Test Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the agent 
              "{agentToDelete?.name}" and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteAgentMutation.isPending}
            >
              {deleteAgentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}