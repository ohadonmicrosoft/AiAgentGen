import { useState } from "react";
import { Link, useLocation } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import StatsCard from "@/components/StatsCard";
import QuickActionCard from "@/components/QuickActionCard";
import AgentCard from "@/components/AgentCard";
import AgentWizard from "@/components/wizard/AgentWizard";
import { useQuery } from "@tanstack/react-query";
import { Bot, MessageSquare, BarChart3, Plus, Edit2, Terminal, HelpCircle } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft";
  lastUpdated: string;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  
  // Mock data - would come from API in real implementation
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => ({
      activeAgents: 4,
      savedPrompts: 12,
      totalInteractions: 231
    }),
  });

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
      }
    ]),
  });

  return (
    <MainLayout title="Dashboard">
      <div className="py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard 
            title="Active Agents"
            value={stats?.activeAgents || 0}
            icon={<Bot />}
            color="primary"
          />
          
          <StatsCard 
            title="Saved Prompts"
            value={stats?.savedPrompts || 0}
            icon={<MessageSquare />}
            color="purple"
          />
          
          <StatsCard 
            title="Total Interactions"
            value={stats?.totalInteractions || 0}
            icon={<BarChart3 />}
            color="green"
          />
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-medium">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              title="Create New Agent"
              description="Build a custom AI agent"
              icon={<Plus />}
              color="primary"
              onClick={() => navigate("/create-agent")}
            />
            
            <QuickActionCard
              title="Engineer Prompts"
              description="Create or edit prompts"
              icon={<Edit2 />}
              color="purple"
              onClick={() => navigate("/prompts")}
            />
            
            <QuickActionCard
              title="API Keys"
              description="Manage API access"
              icon={<Terminal />}
              color="green"
              onClick={() => navigate("/settings")}
            />
            
            <QuickActionCard
              title="Help & Support"
              description="Get assistance"
              icon={<HelpCircle />}
              color="gray"
              onClick={() => {}}
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Recent Agents</h2>
            <Link href="/agents" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents?.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={() => navigate(`/agents/${agent.id}`)}
                onTest={() => {}}
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="p-6 bg-card rounded-lg shadow-sm">
            <h2 className="mb-4 text-lg font-medium">Create a New AI Agent</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Get started with our step-by-step wizard to create your custom AI agent.
            </p>
            
            <AgentWizard preview={true} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
