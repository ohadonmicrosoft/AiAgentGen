import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Play, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useMicroInteractions, useScrollAnimation } from '@/hooks/animations';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft';
  lastUpdated: string;
}

interface AgentCardProps {
  agent: Agent;
  onEdit: () => void;
  onTest?: () => void; // Make onTest optional
  animationDelay?: number;
}

// Create a motion version of our Card component
const MotionCard = motion(Card);

export default function AgentCard({ agent, onEdit, onTest, animationDelay = 0 }: AgentCardProps) {
  const [, navigate] = useLocation();
  const [ref, isVisible] = useScrollAnimation();
  const { cardHover } = useMicroInteractions();

  // Default test handler if none provided
  const handleTest = () => {
    if (onTest) {
      onTest();
    } else {
      navigate(`/test-agent/${agent.id}`);
    }
  };

  return (
    <MotionCard
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.4,
        delay: animationDelay * 0.1,
        ease: [0.25, 0.1, 0.25, 1.0],
      }}
      whileHover={cardHover}
      className="overflow-hidden border"
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <motion.h3
            className="text-lg font-medium text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: animationDelay * 0.1 + 0.1 }}
          >
            {agent.name}
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: animationDelay * 0.1 + 0.2 }}
          >
            <Badge
              variant={agent.status === 'active' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {agent.status}
            </Badge>
          </motion.div>
        </div>
        <motion.p
          className="mt-2 text-sm text-muted-foreground line-clamp-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay * 0.1 + 0.3 }}
        >
          {agent.description}
        </motion.p>
        <motion.div
          className="flex flex-wrap items-center mt-4 gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationDelay * 0.1 + 0.4 }}
        >
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button variant="outline" size="sm" onClick={handleTest}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              <span>Test</span>
            </Button>
          </motion.div>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ rotate: 15 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer">Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Share</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive cursor-pointer">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      </CardContent>
      <CardFooter className="px-4 py-2 bg-muted/10 border-t">
        <motion.div
          className="flex items-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay * 0.1 + 0.5 }}
        >
          <span>{agent.lastUpdated}</span>
        </motion.div>
      </CardFooter>
    </MotionCard>
  );
}
