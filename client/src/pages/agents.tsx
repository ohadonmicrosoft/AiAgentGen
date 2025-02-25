import { useState } from "react";
import { useLocation } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import AgentCard from "@/components/AgentCard";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Loader2 } from "lucide-react";
import { Agent as AgentSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Define the UIAgent type to match the AgentCard component props
interface UIAgent {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft";
  lastUpdated: string;
}

// Helper function to format the date
function formatLastUpdated(date: string): string {
  const updatedDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Updated today";
  } else if (diffDays === 1) {
    return "Updated yesterday";
  } else if (diffDays < 7) {
    return `Updated ${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Updated ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return `Updated on ${updatedDate.toLocaleDateString()}`;
  }
}

export default function Agents() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  // Fetch agents from the API
  const { data: agents, isLoading, error } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    enabled: !!user,
  });

  const filteredAgents = agents?.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
              disabled={isLoading}
            />
          </div>
          
          <Button onClick={() => navigate("/create-agent")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="py-8 text-center">
            <p className="text-destructive">Error loading agents. Please try again later.</p>
          </div>
        )}

        {/* Content when data is loaded */}
        {!isLoading && !error && agents && (
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
                    agent={{
                      id: agent.id.toString(),
                      name: agent.name,
                      description: agent.description || "",
                      status: agent.status as "active" | "draft",
                      lastUpdated: formatLastUpdated(agent.updatedAt)
                    }}
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
                    agent={{
                      id: agent.id.toString(),
                      name: agent.name,
                      description: agent.description || "",
                      status: agent.status as "active" | "draft",
                      lastUpdated: formatLastUpdated(agent.updatedAt)
                    }}
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
                    agent={{
                      id: agent.id.toString(),
                      name: agent.name,
                      description: agent.description || "",
                      status: agent.status as "active" | "draft",
                      lastUpdated: formatLastUpdated(agent.updatedAt)
                    }}
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
        )}
      </div>
    </MainLayout>
  );
}
