import { useState } from 'react';
import { useLocation } from 'wouter';
import MainLayout from '@/layouts/MainLayout';
import AgentCard from '@/components/AgentCard';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Agent as AgentSchema } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/animations';

// Define the UIAgent type to match the AgentCard component props
interface UIAgent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft';
  lastUpdated: string;
}

// Helper function to format the date
function formatLastUpdated(date: string): string {
  const updatedDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Updated today';
  } else if (diffDays === 1) {
    return 'Updated yesterday';
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
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { ref, controls } = useScrollAnimation();

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  // Fetch agents from the API
  const {
    data: agents,
    isLoading,
    error,
  } = useQuery<AgentSchema[]>({
    queryKey: ['/api/agents'],
    enabled: !!user,
  });

  const filteredAgents = agents?.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const activeAgents = filteredAgents?.filter((agent) => agent.status === 'active');
  const draftAgents = filteredAgents?.filter((agent) => agent.status === 'draft');

  return (
    <MainLayout title="Agents">
      <motion.div className="py-6" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          variants={containerVariants}
        >
          <motion.div className="relative w-full sm:w-64" variants={itemVariants}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search agents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button onClick={() => navigate('/create-agent')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
          </motion.div>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <motion.div className="flex justify-center items-center py-12" variants={itemVariants}>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <motion.div className="py-8 text-center" variants={itemVariants}>
            <p className="text-destructive">Error loading agents. Please try again later.</p>
          </motion.div>
        )}

        {/* Content when data is loaded */}
        {!isLoading && !error && agents && (
          <motion.div variants={containerVariants} ref={ref} animate={controls}>
            <Tabs defaultValue="all" className="w-full">
              <motion.div variants={itemVariants}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Agents ({filteredAgents?.length || 0})</TabsTrigger>
                  <TabsTrigger value="active">Active ({activeAgents?.length || 0})</TabsTrigger>
                  <TabsTrigger value="draft">Draft ({draftAgents?.length || 0})</TabsTrigger>
                </TabsList>
              </motion.div>

              <TabsContent value="all">
                <motion.div
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                  variants={containerVariants}
                >
                  {filteredAgents?.map((agent, index) => (
                    <motion.div key={agent.id} variants={itemVariants} custom={index}>
                      <AgentCard
                        agent={{
                          id: agent.id.toString(),
                          name: agent.name,
                          description: agent.description || '',
                          status: agent.status as 'active' | 'draft',
                          lastUpdated: formatLastUpdated(agent.updatedAt),
                        }}
                        onEdit={() => navigate(`/agents/${agent.id}`)}
                        onTest={() => navigate(`/test-agent/${agent.id}`)}
                        animationDelay={0.1 * (index + 1)}
                      />
                    </motion.div>
                  ))}
                  {filteredAgents?.length === 0 && (
                    <motion.div className="col-span-full py-8 text-center" variants={itemVariants}>
                      <p className="text-muted-foreground">
                        No agents found. Try a different search term or create a new agent.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="active">
                <motion.div
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                  variants={containerVariants}
                >
                  {activeAgents?.map((agent, index) => (
                    <motion.div key={agent.id} variants={itemVariants} custom={index}>
                      <AgentCard
                        agent={{
                          id: agent.id.toString(),
                          name: agent.name,
                          description: agent.description || '',
                          status: agent.status as 'active' | 'draft',
                          lastUpdated: formatLastUpdated(agent.updatedAt),
                        }}
                        onEdit={() => navigate(`/agents/${agent.id}`)}
                        onTest={() => navigate(`/test-agent/${agent.id}`)}
                        animationDelay={0.1 * (index + 1)}
                      />
                    </motion.div>
                  ))}
                  {activeAgents?.length === 0 && (
                    <motion.div className="col-span-full py-8 text-center" variants={itemVariants}>
                      <p className="text-muted-foreground">
                        No active agents found. Try a different search term or activate a draft
                        agent.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="draft">
                <motion.div
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                  variants={containerVariants}
                >
                  {draftAgents?.map((agent, index) => (
                    <motion.div key={agent.id} variants={itemVariants} custom={index}>
                      <AgentCard
                        agent={{
                          id: agent.id.toString(),
                          name: agent.name,
                          description: agent.description || '',
                          status: agent.status as 'active' | 'draft',
                          lastUpdated: formatLastUpdated(agent.updatedAt),
                        }}
                        onEdit={() => navigate(`/agents/${agent.id}`)}
                        onTest={() => navigate(`/test-agent/${agent.id}`)}
                        animationDelay={0.1 * (index + 1)}
                      />
                    </motion.div>
                  ))}
                  {draftAgents?.length === 0 && (
                    <motion.div className="col-span-full py-8 text-center" variants={itemVariants}>
                      <p className="text-muted-foreground">
                        No draft agents found. Try a different search term.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </motion.div>
    </MainLayout>
  );
}
