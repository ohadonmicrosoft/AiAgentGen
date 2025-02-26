import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Play, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft";
  lastUpdated: string;
}

interface AgentCardProps {
  agent: Agent;
  onEdit: () => void;
  onTest?: () => void; // Make onTest optional
}

export default function AgentCard({ agent, onEdit, onTest }: AgentCardProps) {
  const [, navigate] = useLocation();
  
  // Default test handler if none provided
  const handleTest = () => {
    if (onTest) {
      onTest();
    } else {
      navigate(`/test-agent/${agent.id}`);
    }
  };
  return (
    <Card className="overflow-hidden transition-all duration-150 hover:shadow-md group border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">{agent.name}</h3>
          <Badge variant={agent.status === "active" ? "default" : "secondary"} className="capitalize">
            {agent.status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
        <div className="flex flex-wrap items-center mt-4 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit}
          >
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTest}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            <span>Test</span>
          </Button>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer">Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Share</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive cursor-pointer">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 bg-muted/10 border-t">
        <div className="flex items-center text-xs text-muted-foreground">
          <span>{agent.lastUpdated}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
