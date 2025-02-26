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
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 card-hover">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{agent.name}</h3>
          <Badge variant={agent.status === "active" ? "default" : "secondary"} className={cn(
            "capitalize transition-all duration-200 hover:opacity-80",
            agent.status === "active" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : ""
          )}>
            {agent.status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
        <div className="flex flex-wrap items-center mt-4 gap-3">
          <Button variant="outline" size="sm" className="text-primary border-primary/20 bg-primary/10 btn-animated" onClick={onEdit}>
            <Edit className="mr-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="btn-animated" onClick={handleTest}>
            <Play className="mr-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
            Test
          </Button>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent/50 transition-all duration-200">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="shadow-soft">
                <DropdownMenuItem className="transition-colors duration-150 cursor-pointer">Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="transition-colors duration-150 cursor-pointer">Share</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive transition-colors duration-150 cursor-pointer">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-5 py-3 bg-muted/20 border-t">
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="transition-colors duration-200 hover:text-foreground">{agent.lastUpdated}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
