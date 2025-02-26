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
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10 hover:-translate-y-1.5 group border-primary/5 hover:border-primary/10">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">{agent.name}</h3>
          <Badge variant={agent.status === "active" ? "default" : "secondary"} className={cn(
            "capitalize transition-all duration-300 hover:opacity-90 shadow-sm",
            agent.status === "active" 
              ? "bg-green-500/15 text-green-600 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400" 
              : "hover:bg-muted"
          )}>
            {agent.status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/90 transition-colors duration-300">{agent.description}</p>
        <div className="flex flex-wrap items-center mt-4 gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 hover:text-primary/90 transition-all duration-300 group/edit"
            onClick={onEdit}
          >
            <Edit className="mr-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover/edit:scale-110" />
            <span className="transition-transform duration-300 group-hover/edit:translate-x-0.5">Edit</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="hover:bg-primary/10 hover:text-primary/90 transition-all duration-300 group/test"
            onClick={handleTest}
          >
            <Play className="mr-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover/test:scale-110 fill-current opacity-0 group-hover/test:opacity-20" />
            <span className="transition-transform duration-300 group-hover/test:translate-x-0.5">Test</span>
          </Button>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-primary/10 transition-all duration-300 hover:rotate-12"
                >
                  <MoreHorizontal className="h-4 w-4 transition-transform duration-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="shadow-lg border-primary/10 animate-in fade-in-50 zoom-in-95 duration-200">
                <DropdownMenuItem className="transition-colors duration-200 cursor-pointer focus:bg-primary/5 focus:text-primary">Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="transition-colors duration-200 cursor-pointer focus:bg-primary/5 focus:text-primary">Share</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive transition-colors duration-200 cursor-pointer focus:bg-destructive/5">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-5 py-3 bg-muted/20 border-t border-primary/5 group-hover:bg-muted/30 transition-colors duration-300">
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="transition-colors duration-200 hover:text-foreground">{agent.lastUpdated}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
