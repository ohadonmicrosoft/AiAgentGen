import { useState } from "react";
import { useLocation } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import AgentCard from "@/components/AgentCard";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft";
  lastUpdated: string;
}

export default function Agents() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock data - would come from API in real implementation
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    queryFn: () => ([
      {
        id: "1",
        name: "Customer Support Bot",
        description: "Handles customer inquiries automatically with a formal response style.",
        status: "active",
        lastUpdated: "Updated 2 days ago"
      },
      {
        id: "2",
        name: "Product Recommendation",
        description: "Suggests products based on customer preferences and past purchases.",
        status: "active",
        lastUpdated: "Updated 5 days ago"
      },
      {
        id: "3",
        name: "Email Assistant",
        description: "Drafts email responses based on incoming inquiries.",
        status: "draft",
        lastUpdated: "Created 1 week ago"
      },
      {
        id: "4",
        name: "Content Creator",
        description: "Generates social media posts and marketing content.",
        status: "active",
        lastUpdated: "Updated 1 week ago"
      },
      {
        id: "5",
        name: "Data Analyzer",
        description: "Provides insights from datasets and creates summaries.",
        status: "draft",
        lastUpdated: "Created 3 weeks ago"
      }
    ]),
  });

  const filteredAgents = agents?.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const activeAgents = filteredAgents?.filter(agent => agent.status === "active");
  const draftAgents = filteredAgents?.filter(agent => agent.status === "draft");

  return (
    <MainLayout title="Agents">
      <div className="py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search agents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button onClick={() => navigate("/create-agent")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Agents ({filteredAgents?.length || 0})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeAgents?.length || 0})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({draftAgents?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAgents?.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={() => navigate(`/agents/${agent.id}`)}
                  onTest={() => {}}
                />
              ))}
              {filteredAgents?.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <p className="text-muted-foreground">No agents found. Try a different search term or create a new agent.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeAgents?.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={() => navigate(`/agents/${agent.id}`)}
                  onTest={() => {}}
                />
              ))}
              {activeAgents?.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <p className="text-muted-foreground">No active agents found. Try a different search term or activate a draft agent.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="draft">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {draftAgents?.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={() => navigate(`/agents/${agent.id}`)}
                  onTest={() => {}}
                />
              ))}
              {draftAgents?.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <p className="text-muted-foreground">No draft agents found. Try a different search term.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
