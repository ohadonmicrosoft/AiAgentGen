import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Play, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  onTest: () => void;
}

export default function AgentCard({ agent, onEdit, onTest }: AgentCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{agent.name}</h3>
          <Badge variant={agent.status === "active" ? "success" : "secondary"} className="capitalize">
            {agent.status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{agent.description}</p>
        <div className="flex items-center mt-4 space-x-4">
          <Button variant="outline" size="sm" className="text-primary border-primary/20 bg-primary/10" onClick={onEdit}>
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onTest}>
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Test
          </Button>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-5 py-3 bg-muted/50 border-t">
        <div className="flex items-center text-xs text-muted-foreground">
          <span>{agent.lastUpdated}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
